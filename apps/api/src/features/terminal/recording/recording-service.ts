import os from "node:os";
import path from "node:path";
import pool from "../../../db/pool.js";
import logger from "../../../core/logger.js";
import { AsciicastV2Writer } from "./asciicast-writer.js";
import { LocalStorage } from "../../../core/storage/local-storage.js";
import type {
  RecordingStorage,
  StorageConfig,
} from "../../../core/storage/recording-storage.interface.js";
import type { SshSession } from "../../../core/ssh/ssh-session-manager.js";

interface ActiveRecording {
  recordingId: string;
  writer: AsciicastV2Writer;
  tempPath: string;
}

class RecordingService {
  private active = new Map<string, ActiveRecording>();

  // Hardcoded until the admin storage_configurations UI exists — every
  // recording is provider: 'local' for now. Swap this for a real query against
  // storage_configurations (decrypt the active row) later; nothing else in this
  // file needs to change when you do — that's the point of the interface.
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

      await pool.query<{ id: string }>(
        `INSERT INTO terminal_recordings (session_id, server_id, user_id, provider)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [session.sessionId, session.serverId, session.userId, config.provider],
      );
    } catch (err) {
      // Recording must never take the terminal down with it.
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

  async finalize(sessionId: string): Promise<void> {
    const entry = this.active.get(sessionId);
    if (!entry) return; // nothing recorded for this session

    this.active.delete(sessionId); // remove immediately — never leave a stale
    // entry behind even if everything below throws

    try {
      const result = await entry.writer.close();

      if (!result) {
        await pool.query(
          `UPDATE terminal_recordings SET status = 'failed', ended_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [entry.recordingId],
        );
        return;
      }

      const { storage, config } = this.resolveStorage();
      const storageKey = `${entry.recordingId}.cast`;

      await storage.upload(entry.tempPath, storageKey, config);

      await pool.query(
        `UPDATE terminal_recordings
         SET status = 'completed', storage_key = $1, file_size_bytes = $2,
             duration_seconds = $3, ended_at = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [
          storageKey,
          result.fileSizeBytes,
          Math.round(result.durationSeconds),
          entry.recordingId,
        ],
      );
    } catch (err) {
      logger.error({
        event: "recording.finalize_failed",
        sessionId,
        recordingId: entry.recordingId,
        error: (err as Error).message,
      });

      try {
        await pool.query(
          `UPDATE terminal_recordings SET status = 'failed', ended_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [entry.recordingId],
        );
      } catch (updateErr) {
        // If even this fails, the row stays at 'recording' forever — this is
        // exactly what the boot-time sweep exists to clean up.
        logger.error({
          event: "recording.finalize_status_update_failed",
          recordingId: entry.recordingId,
          error: (updateErr as Error).message,
        });
      }
    }
  }
}

export const recordingService = new RecordingService();
