import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("terminal_recordings", "status", {
    default: pgm.func("'recording'"),
  });
  pgm.alterColumn("terminal_recordings", "provider", {
    default: pgm.func("'local'"),
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("terminal_recordings", "status", { default: null });
  pgm.alterColumn("terminal_recordings", "provider", { default: null });
}
