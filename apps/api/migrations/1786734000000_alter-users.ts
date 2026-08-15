import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("users", {
    must_change_password: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    role: {
      type: "text",
      notNull: true,
      default: "owner",
      check: "role IN ('owner', 'admin', 'member')",
    },
    workspace_id: {
      type: "uuid",
      references: "workspaces(id)",
      onDelete: "CASCADE",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("users", ["role", "must_change_password", "workspace_id"]);
}
