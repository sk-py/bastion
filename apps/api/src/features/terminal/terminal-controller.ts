import type { Request, Response } from "express";
import busboy from "busboy";
import path from "node:path";
import { Transform } from "node:stream";
import { sshSessionManager } from "../../core/ssh/ssh-session-manager.js";
import logger from "../../core/logger.js";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 * 1024; // 20GB limit

// Pre-flight check: does this filename already exist on the remote?
// Called by the frontend BEFORE the upload stream starts, so the common
// "re-upload same file" case never touches busboy/SFTP write streams.
export const checkFileExists = (req: Request, res: Response) => {
  const sessionId = req.headers["x-session-id"] as string;
  const userId = (req as any).user?.id;
  const filename = req.query.filename as string;

  if (!sessionId || !filename) {
    res.status(400).json({ error: "Missing x-session-id header or filename query param" });
    return;
  }

  const session = sshSessionManager.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Active SSH session not found or closed" });
    return;
  }
  if (session.userId !== userId) {
    logger.warn({ event: "terminal.upload_forbidden", sessionId, userId });
    res.status(403).json({ error: "You do not have access to this session" });
    return;
  }

  const safeFilename = path.basename(filename);
  if (!safeFilename || safeFilename === "." || safeFilename === "..") {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  session.client.sftp((err, sftp) => {
    if (err) {
      logger.error({ event: "sftp.error", error: err.message, sessionId });
      res.status(500).json({ error: "Failed to open SFTP subsystem" });
      return;
    }

    sftp.stat(`./${safeFilename}`, (statErr: any) => {
      if (statErr) {
        // code 2 = SSH_FX_NO_SUCH_FILE — nothing there, upload is clear
        if (statErr.code === 2) {
          sftp.end()
          res.status(200).json({ exists: false });
          return;
        }
        logger.error({
          event: "sftp.stat_error",
          error: statErr.message,
          code: statErr.code,
          filename: safeFilename,
        });
        res.status(500).json({ error: "Could not check file status" });
        return;
      }
      sftp.end()
      res.status(200).json({ exists: true });
    });
  });
};

export const uploadFile = (req: Request, res: Response) => {
  const sessionId = req.headers["x-session-id"] as string;
  const userId = (req as any).user?.id;

  if (!sessionId) {
    res.status(400).json({ error: "Missing x-session-id header" });
    return;
  }

  const session = sshSessionManager.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Active SSH session not found or closed" });
    return;
  }

  if (session.userId !== userId) {
    logger.warn({ event: "terminal.upload_forbidden", sessionId, userId });
    res.status(403).json({ error: "You do not have access to this session" });
    return;
  }

  const operationId = sshSessionManager.beginOperation(sessionId);
  let responded = false;

  const respond = (status: number, body: object) => {
    if (responded) return;
    responded = true;
    res.status(status).json(body);
  };

  session.client.sftp((err, sftp) => {
    if (err) {
      sshSessionManager.endOperation(sessionId, operationId);
      logger.error({ event: "sftp.error", error: err.message, sessionId });
      respond(500, { error: "Failed to open SFTP subsystem" });
      return;
    }

    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    });

    let pendingWrites = 0;
    let parsingDone = false;
    let finished = false;

    // This is now the rare-race path only (two uploads of the same filename
    // landing within the same second). checkFileExists catches the common
    // "re-upload the same file" case before any bytes are streamed, so a
    // blunt destroy() here is an acceptable trade-off — no WS coordination needed.
    const abortTransfer = (status: number, errorMessage: string) => {
      if (finished) return;
      finished = true;

      sftp.end();
      sshSessionManager.endOperation(sessionId, operationId);
      respond(status, { error: errorMessage });

      req.unpipe(bb);
      req.destroy();
    };

    const maybeFinish = () => {
      if (finished || !parsingDone || pendingWrites > 0) return;
      finished = true;

      sftp.end();
      sshSessionManager.endOperation(sessionId, operationId);
      respond(200, { status: "success", message: "Upload complete" });
    };

    req.on("aborted", () => {
      logger.warn({ event: "upload.aborted", sessionId });
      abortTransfer(499, "Client aborted upload");
    });

    bb.on("file", (_name, file, info) => {
      const safeFilename = path.basename(info.filename || "");
      if (!safeFilename || safeFilename === "." || safeFilename === "..") {
        abortTransfer(400, "Invalid filename");
        return;
      }

      const remotePath = `./${safeFilename}`;
      const writeStream = sftp.createWriteStream(remotePath, {
        flags: "wx", // still the real safety net against the TOCTOU race
        highWaterMark: 64 * 1024,
      });

      pendingWrites++;

      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        pendingWrites--;
        maybeFinish();
      };

      file.on("limit", () => {
        writeStream.destroy();
        abortTransfer(413, "File exceeds size limit");
      });

      const totalBytes = Number(req.headers["content-length"]) || 0;
      let bytesWritten = 0;
      let lastSent = 0;

      const progressTracker = new Transform({
        transform(chunk, _enc, callback) {
          bytesWritten += chunk.length;
          const now = Date.now();
          if (totalBytes > 0 && now - lastSent > 250) {
            lastSent = now;
            if (session.ws?.readyState === session.ws?.OPEN) {
              session.ws?.send(JSON.stringify({
                type: "upload-progress",
                filename: safeFilename,
                percent: Math.min(100, Math.round((bytesWritten / totalBytes) * 100)),
              }));
            }
          }
          callback(null, chunk);
        },
      });

      file.pipe(progressTracker).pipe(writeStream);

      writeStream.on("finish", settle);
      writeStream.on("close", settle);

      writeStream.on("error", (writeErr: any) => {
        logger.error({
          event: "sftp.write_error",
          error: writeErr.message,
          filename: safeFilename,
          code: writeErr.code,
        });

        let errMsg = "File transfer failed";

        switch (writeErr.code) {
          case 2:
            errMsg = "Target directory does not exist.";
            break;
          case 3:
            errMsg = "Permission denied. You do not have write access to this directory.";
            break;
          case 4:
            // OpenSSH (SFTP v3) throws generic FAILURE for 'wx' collisions —
            // it has no dedicated file-exists code. Rare-race path now,
            // since checkFileExists handles the common case up front.
            errMsg = "File transfer failed. A file with this name may already exist.";
            break;
          case 11:
            // SFTP v6+ dedicated code — effectively dead against OpenSSH,
            // which only ever speaks protocol v3. Kept for other server targets.
            errMsg = "A file with this name already exists.";
            break;
          default:
            if (writeErr.message?.toLowerCase().includes("failure")) {
              errMsg = "File transfer failed. A file with this name may already exist.";
            } else if (writeErr.message) {
              errMsg = `Transfer failed: ${writeErr.message}`;
            }
        }

        abortTransfer(500, errMsg);
      });
    });

    bb.on("close", () => {
      parsingDone = true;
      maybeFinish();
    });

    bb.on("error", (bbErr) => {
      logger.error({ event: "sftp.parse_error", error: (bbErr as Error).message, sessionId });
      abortTransfer(500, "Stream parsing failed");
    });

    req.pipe(bb);
  });
};