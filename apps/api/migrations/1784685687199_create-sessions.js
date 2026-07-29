export const shorthands = undefined;
export async function up(pgm) {
    pgm.createTable("auth_sessions", {
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
        session_token_hash: {
            type: "text",
            notNull: true,
            unique: true,
        },
        expires_at: {
            type: "timestamptz",
            notNull: true,
        },
        last_used_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("NOW()"),
        },
        ip_address: {
            type: "text",
        },
        user_agent: {
            type: "text",
        },
        createdAt: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("NOW()"),
        },
    });
    pgm.createIndex("auth_sessions", "user_id");
    pgm.createIndex("auth_sessions", "expires_at");
}
export async function down(pgm) {
    pgm.dropTable("auth_sessions");
}
//# sourceMappingURL=1784685687199_create-sessions.js.map