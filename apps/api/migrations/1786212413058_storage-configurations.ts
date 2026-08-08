import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("storage_configurations", {
    id: {
      type: "uuid",
      default: pgm.func("gen_random_uuid()"),
      primaryKey: true,
    },
    provider: {
      type: "varchar(50)",
      notNull: true,
      check: "provider IN ('local', 's3', 'azure')",
    },
    encrypted_config: {
      type: "text",
      notNull: true,
    },
    is_active: {
      type: "boolean",
      notNull: true,
      default: false,
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

  // Only one provider can be active at a time.
  pgm.createIndex("storage_configurations", "is_active", {
    where: "is_active = true",
    unique: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("storage_configurations");
}
