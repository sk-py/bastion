export default {
  databaseUrl: process.env.DATABASE_URL,
  migrationsTable: "migrations",
  dir: "src/db/migrations",
  direction: "up",
  count: Infinity,
};