import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("terminal_recordings", {
    id: {
      type: "uuid",
      default: pgm.func("gen_random_uuid()"),
      primaryKey: true,
    },
    session_id: { type: "uuid", notNull: true },
    server_id: {
      type: "uuid",
      notNull: true,
      references: '"servers"',
      onDelete: "RESTRICT",
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "RESTRICT",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "'recording'",
      check: "status IN ('recording', 'uploading', 'completed', 'failed')",
    },

    // Which provider this specific recording was stored with, not necessarily
    // whichever is globally active now. Resolved per-row at playback time.
    provider: {
      type: "varchar(50)",
      notNull: true,
      default: "'local'",
      check: "provider IN ('local', 's3', 'azure')",
    },
    storage_key: { type: "varchar(255)", unique: true },
    file_size_bytes: { type: "bigint" },
    duration_seconds: { type: "integer" },
    started_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    ended_at: { type: "timestamptz" },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });
  pgm.createIndex("terminal_recordings", "server_id");
  pgm.createIndex("terminal_recordings", "user_id");
  pgm.createIndex("terminal_recordings", "session_id");
  // will be used to build the crash-recovery sweep
  pgm.createIndex("terminal_recordings", "status");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("terminal_recordings");
}
