import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import type { RecordingStorage } from "./recording-storage.interface.js";

const RECORDINGS_DIR = path.resolve("./recordings");

export class LocalStorage implements RecordingStorage {
  async testConnection(): Promise<boolean> {
    try {
      await fs.mkdir(RECORDINGS_DIR, { recursive: true });
      await fs.access(RECORDINGS_DIR, fsConstants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  async upload(localPath: string, destinationKey: string): Promise<void> {
    const safeKey = path.basename(destinationKey);
    await fs.mkdir(RECORDINGS_DIR, { recursive: true });
    const dest = path.join(RECORDINGS_DIR, safeKey);

    try {
      await fs.rename(localPath, dest);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "EXDEV") {
        // os.tmpdir() and RECORDINGS_DIR are on different filesystems/mounts then rename() can't cross that boundary. Fall back to copy + delete.
        await fs.copyFile(localPath, dest);
        await fs.unlink(localPath);
      } else {
        throw err;
      }
    }
  }

  async getPlaybackUrl(): Promise<string> {
    // Not a real storage URL for Local an internal app route. The controller appends /:recordingId/stream and streams the file itself.
    return `/api/v1/recordings`;
  }

  async delete(storageKey: string): Promise<void> {
    const safeKey = path.basename(storageKey);
    await fs.rm(path.join(RECORDINGS_DIR, safeKey), { force: true });
  }
}