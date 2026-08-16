import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";

import {
  listRecordings,
  findAccessibleRecordingById,
} from "./recording-repository.js";

const RECORDINGS_DIR = path.resolve("./recordings");

export const getRecordings = async (
  req: Request,
  res: Response,
) => {
  const {
    id: userId,
    workspaceId,
    role,
  } = req.user;

  const serverId =
    typeof req.query.serverId === "string"
      ? req.query.serverId
      : undefined;

  const recordings = await listRecordings(
    userId,
    workspaceId,
    role,
    serverId,
  );

  return res.status(200).json({
    status: "success",
    data: recordings,
  });
};

export const streamRecording = async (
  req: Request,
  res: Response,
) => {
  const {
    id: userId,
    workspaceId,
    role,
  } = req.user;

  const { id: recordingId } = req.params as {
    id: string;
  };

  const recording = await findAccessibleRecordingById(
    recordingId,
    userId,
    workspaceId,
    role,
  );

  if (!recording) {
    return res.status(404).json({
      error: "Recording not found",
    });
  }

  if (
    recording.status !== "completed" ||
    !recording.storageKey
  ) {
    return res.status(409).json({
      error: `Recording is not available (status: ${recording.status})`,
    });
  }

  if (recording.provider === "local") {
    const safeKey = path.basename(
      recording.storageKey,
    );

    const filePath = path.join(
      RECORDINGS_DIR,
      safeKey,
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Recording file missing from storage",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/x-asciicast",
    );

    fs.createReadStream(filePath).pipe(res);

    return;
  }

  return res.status(501).json({
    error: `Playback for provider "${recording.provider}" not yet implemented`,
  });
};