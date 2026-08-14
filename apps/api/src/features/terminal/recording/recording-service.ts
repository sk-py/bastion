import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import logger from "../../../core/logger.js";
import { AsciicastV2Writer } from "./asciicast-writer.js";
import { LocalStorage } from "../../../core/storage/local-storage.js";
import type {
  RecordingStorage,
  StorageConfig,
} from "../../../core/storage/recording-storage.interface.js";
import type { SshSession } from "../../../core/ssh/ssh-session-manager.js";
import {
  insertRecording,
  markRecordingCompleted,
  markRecordingFailed,
  sweepStuckRecordings,
} from "./recording-repository.js";

interface ActiveRecording {
  recordingId: string;
  writer: AsciicastV2Writer;
  tempPath: string;
}
interface RecordingContext {
  ipAddress: string;
  userAgent: string | null;
  authSessionId: string;
}

class RecordingService {
  private active = new Map<string, ActiveRecording>();

  private resolveStorage(): {
    storage: RecordingStorage;
    config: StorageConfig;
  } {
    return {
      storage: new LocalStorage(),
      config: { provider: "local", config: {} },
    };
  }

  async startRecording(
    session: SshSession,
    cols: number,
    rows: number,
    context: RecordingContext,
  ): Promise<void> {
    const recordingId = crypto.randomUUID();
    const tempPath = path.join(os.tmpdir(), `bastion-rec-${recordingId}.cast`);

    let writer: AsciicastV2Writer;
    try {
      writer = new AsciicastV2Writer(tempPath, cols, rows);
    } catch (err) {
      logger.error({
        event: "recording.writer_init_failed",
        sessionId: session.sessionId,
        error: (err as Error).message,
      });
      return;
    }

    this.active.set(session.sessionId, { recordingId, writer, tempPath });

    try {
      const { config } = this.resolveStorage();
      await insertRecording({
        id: recordingId,
        sessionId: session.sessionId,
        serverId: session.serverId,
        userId: session.userId,
        provider: config.provider,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        authSessionId: context.authSessionId,
      });
    } catch (err) {
      logger.error({
        event: "recording.start_failed",
        sessionId: session.sessionId,
        error: (err as Error).message,
      });
      this.active.delete(session.sessionId);
      await writer.close();
    }
  }

  writeOutput(sessionId: string, chunk: Buffer): void {
    this.active.get(sessionId)?.writer.writeOutput(chunk);
  }

  writeResize(sessionId: string, cols: number, rows: number): void {
    this.active.get(sessionId)?.writer.writeResize(cols, rows);
  }

  writeMarker(sessionId: string, label: string): void {
    this.active.get(sessionId)?.writer.writeMarker(label);
  }

  async finalize(sessionId: string): Promise<void> {
    const entry = this.active.get(sessionId);
    if (!entry) return;

    this.active.delete(sessionId);

    try {
      const result = await entry.writer.close();

      if (!result) {
        const rowCount = await markRecordingFailed(entry.recordingId);
        if (rowCount === 0) {
          logger.error({
            event: "recording.finalize_orphaned",
            recordingId: entry.recordingId,
            sessionId,
          });
        }
        return;
      }

      const { storage, config } = this.resolveStorage();
      const storageKey = `${entry.recordingId}.cast`;
      await storage.upload(entry.tempPath, storageKey, config);

      const rowCount = await markRecordingCompleted(entry.recordingId, {
        storageKey,
        fileSizeBytes: result.fileSizeBytes,
        durationSeconds: Math.round(result.durationSeconds),
      });

      if (rowCount === 0) {
        logger.error({
          event: "recording.finalize_orphaned",
          recordingId: entry.recordingId,
          sessionId,
        });
      }
    } catch (err) {
      logger.error({
        event: "recording.finalize_failed",
        sessionId,
        recordingId: entry.recordingId,
        error: (err as Error).message,
      });
      try {
        await markRecordingFailed(entry.recordingId);
      } catch (updateErr) {
        logger.error({
          event: "recording.finalize_status_update_failed",
          recordingId: entry.recordingId,
          error: (updateErr as Error).message,
        });
      }
    }
  }

  // Called once at boot.
  async sweepStuckRecordings(): Promise<void> {
    try {
      const count = await sweepStuckRecordings();
      if (count > 0) {
        logger.warn({
          event: "recording.boot_sweep",
          staleRecordingsMarkedFailed: count,
        });
      }
    } catch (err) {
      logger.error({
        event: "recording.boot_sweep_failed",
        error: (err as Error).message,
      });
    }
  }
}

export const recordingService = new RecordingService();
