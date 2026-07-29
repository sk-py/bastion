export const shorthands = undefined;
export async function up(pgm) {
    pgm.createType("auth_method", ["password", "private_key"]);
    pgm.createTable("servers", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("gen_random_uuid()"),
        },
        user_id: {
            type: "uuid",
            notNull: true,
            references: "users(id)",
            onDelete: "CASCADE",
        },
        name: {
            type: "text",
            notNull: true,
        },
        host: {
            type: "text",
            notNull: true,
        },
        port: {
            type: "integer",
            notNull: true,
            default: 22,
            check: "port BETWEEN 1 AND 65535",
        },
        username: {
            type: "text",
            notNull: true,
        },
        auth_method: {
            type: "auth_method",
            notNull: true,
        },
        encrypted_password: {
            type: "text",
        },
        encrypted_private_key: {
            type: "text",
        },
        encrypted_passphrase: {
            type: "text",
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
    pgm.createIndex("servers", "user_id");
}
export async function down(pgm) {
    pgm.dropTable("servers");
    pgm.dropType("auth_method");
}
//# sourceMappingURL=1784870704051_servers.js.map