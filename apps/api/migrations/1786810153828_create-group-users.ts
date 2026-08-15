import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("group_users", {
    group_id: {
      type: "uuid",
      notNull: true,
      references: "groups(id)",
      onDelete: "CASCADE",
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });

  pgm.addConstraint("group_users", "group_users_pkey", {
    primaryKey: ["group_id", "user_id"],
  });

  pgm.createIndex("group_users", "user_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("group_users");
}