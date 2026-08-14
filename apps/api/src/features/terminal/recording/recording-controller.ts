import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { listRecordings, findRecordingById } from "./recording-repository.js";

const RECORDINGS_DIR = path.resolve("./recordings");

export const getRecordings = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const serverId = req.query.serverId as string | undefined;

  const recordings = await listRecordings(userId, serverId);

  res.status(200).json({ status: "success", data: recordings });
};

export const streamRecording = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params as { id: string };

  const recording = await findRecordingById(id);

  if (!recording) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  if (recording.userId !== userId) {
    res.status(403).json({ error: "You do not have access to this recording" });
    return;
  }

  if (recording.status !== "completed" || !recording.storageKey) {
    res
      .status(409)
      .json({
        error: `Recording is not available (status: ${recording.status})`,
      });
    return;
  }

  if (recording.provider === "local") {
    const safeKey = path.basename(recording.storageKey); // storageKey is DB-controlled, not user input
    const filePath = path.join(RECORDINGS_DIR, safeKey);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Recording file missing from storage" });
      return;
    }

    res.setHeader("Content-Type", "application/x-asciicast");
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // S3/Azure once built its provider's config will come here, calling storage.getPlaybackUrl(), redirect.
  res
    .status(501)
    .json({
      error: `Playback for provider "${recording.provider}" not yet implemented`,
    });
};
