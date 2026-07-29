export const shorthands = undefined;
export async function up(pgm) {
    pgm.createExtension("pgcrypto", {
        ifNotExists: true,
    });
    pgm.createTable("users", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("gen_random_uuid()"),
        },
        name: {
            type: "varchar(100)",
            notNull: true,
        },
        email: {
            type: "varchar(255)",
            notNull: true,
            unique: true,
        },
        password_hash: {
            type: "text",
            notNull: true,
        },
        is_active: {
            type: "boolean",
            notNull: true,
            default: true,
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
}
export async function down(pgm) {
    pgm.dropTable("users");
}
//# sourceMappingURL=1784659680451_create-users.js.map