import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("servers", {
    workspace_id: {
      type: "uuid",
      notNull: false,
      references: "workspaces(id)",
      onDelete: "RESTRICT",
    },
  });

  pgm.sql(`
    UPDATE servers s
    SET workspace_id = u.workspace_id
    FROM users u
    WHERE s.user_id = u.id
  `);

  pgm.alterColumn("servers", "workspace_id", {
    notNull: true,
  });

  pgm.createIndex("servers", "workspace_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("servers", "workspace_id");
}