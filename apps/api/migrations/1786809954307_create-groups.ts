import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("groups", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    workspace_id: {
      type: "uuid",
      notNull: true,
      references: "workspaces(id)",
      onDelete: "RESTRICT",
    },
    name: {
      type: "text",
      notNull: true,
    },
    description: {
      type: "text",
      notNull: false,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("groups", "groups_workspace_name_unique", {
    unique: ["workspace_id", "name"],
  });

  pgm.createIndex("groups", "workspace_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("groups");
}
