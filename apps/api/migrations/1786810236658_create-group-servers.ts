import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("group_servers", {
    group_id: {
      type: "uuid",
      notNull: true,
      references: "groups(id)",
      onDelete: "CASCADE",
    },
    server_id: {
      type: "uuid",
      notNull: true,
      references: "servers(id)",
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("group_servers", "group_servers_pkey", {
    primaryKey: ["group_id", "server_id"],
  });

  pgm.createIndex("group_servers", "server_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("group_servers");
}
