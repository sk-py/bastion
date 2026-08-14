import pool from "src/db/pool.js";

export interface RecordingRow {
  id: string;
  sessionId: string;
  serverId: string;
  serverName: string;
  serverUsername: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "recording" | "uploading" | "completed" | "failed";
  provider: "local" | "s3" | "azure";
  storageKey: string | null;
  fileSizeBytes: string | null;
  durationSeconds: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  startedAt: Date;
  endedAt: Date | null;
  authSessionId: string | null;
}

const RECORDING_SELECT = `
  r.id,
  r.session_id AS "sessionId",
  s.name AS "serverName",
  s.username AS "serverUsername",
  r.server_id AS "serverId",
  r.user_id AS "userId",
  u.name AS "userName",
  u.email AS "userEmail",
  r.status,
  r.provider,
  r.storage_key AS "storageKey",
  r.file_size_bytes AS "fileSizeBytes",
  r.duration_seconds AS "durationSeconds",
  r.ip_address AS "ipAddress",
  r.user_agent AS "userAgent",
  r.started_at AS "startedAt",
  r.ended_at AS "endedAt",
  r.auth_session_id AS "authSessionId"
`;

const RECORDING_FROM = `
  FROM terminal_recordings r
  JOIN servers s ON s.id = r.server_id
  JOIN users u ON u.id = r.user_id
`;

export const listRecordings = async (
  userId: string,
  serverId?: string,
): Promise<RecordingRow[]> => {
  const query = serverId
    ? `
      SELECT ${RECORDING_SELECT}
      ${RECORDING_FROM}
      WHERE r.user_id = $1
        AND r.server_id = $2
      ORDER BY r.started_at DESC
    `
    : `
      SELECT ${RECORDING_SELECT}
      ${RECORDING_FROM}
      WHERE r.user_id = $1
      ORDER BY r.started_at DESC
    `;

  const params = serverId ? [userId, serverId] : [userId];

  const { rows } = await pool.query<RecordingRow>(query, params);
  return rows;
};

export const findRecordingById = async (
  recordingId: string,
): Promise<RecordingRow | null> => {
  const { rows } = await pool.query<RecordingRow>(
    `
      SELECT ${RECORDING_SELECT}
      ${RECORDING_FROM}
      WHERE r.id = $1
    `,
    [recordingId],
  );

  return rows[0] ?? null;
};

export interface InsertRecordingData {
  id: string;
  sessionId: string;
  serverId: string;
  userId: string;
  provider: "local" | "s3" | "azure";
  ipAddress: string;
  userAgent: string | null;
  authSessionId: string;
}

export const insertRecording = async (
  data: InsertRecordingData,
): Promise<void> => {
  await pool.query(
    `INSERT INTO terminal_recordings (id, session_id, server_id, user_id, provider, ip_address, user_agent, auth_session_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.id,
      data.sessionId,
      data.serverId,
      data.userId,
      data.provider,
      data.ipAddress,
      data.userAgent,
      data.authSessionId,
    ],
  );
};

export interface CompleteRecordingData {
  storageKey: string;
  fileSizeBytes: number;
  durationSeconds: number;
}

// Returns rowCount so the caller can detect and log a zero-match UPDATE
// instead of it failing silently — this is what would have caught the
// mismatched-id bug immediately instead of needing a full investigation.
export const markRecordingCompleted = async (
  recordingId: string,
  data: CompleteRecordingData,
): Promise<number> => {
  const { rowCount } = await pool.query(
    `UPDATE terminal_recordings
     SET status = 'completed', storage_key = $1, file_size_bytes = $2,
         duration_seconds = $3, ended_at = NOW(), updated_at = NOW()
     WHERE id = $4`,
    [data.storageKey, data.fileSizeBytes, data.durationSeconds, recordingId],
  );
  return rowCount ?? 0;
};

export const markRecordingFailed = async (
  recordingId: string,
): Promise<number> => {
  const { rowCount } = await pool.query(
    `UPDATE terminal_recordings SET status = 'failed', ended_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [recordingId],
  );
  return rowCount ?? 0;
};

// Boot-time correctness sweep — not the nightly retention job. This only
// resolves rows still claiming 'recording' after a process restart, where
// nothing in memory survived to ever call finalize(). Retention (deleting old
// completed recordings on a schedule) is a separate, deliberately deferred
// feature with its own table/column decisions still to be made.
export const sweepStuckRecordings = async (): Promise<number> => {
  const { rowCount } = await pool.query(
    `UPDATE terminal_recordings SET status = 'failed', ended_at = NOW(), updated_at = NOW() WHERE status = 'recording'`,
  );
  return rowCount ?? 0;
};
