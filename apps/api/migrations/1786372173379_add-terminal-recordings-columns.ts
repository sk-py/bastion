import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("terminal_recordings", {
    ip_address: { type: "varchar(45)" }, // long enough for IPv6
    user_agent: { type: "text" },
    auth_session_id: {
      type: "uuid",
      references: '"auth_sessions"',
      onDelete: "SET NULL",
    },
  });
  pgm.createIndex("terminal_recordings", "auth_session_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("terminal_recordings", [
    "ip_address",
    "user_agent",
    "auth_session_id",
  ]);
}
