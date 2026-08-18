export default {
  databaseUrl: process.env.DATABASE_URL,
  migrationsTable: "migrations",
  dir: "/migrations",
  direction: "up",
  count: Infinity,
};