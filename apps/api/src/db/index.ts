import pool from "./pool.js";

export async function connectToDatabase() {
  await pool.query("SELECT 1");
  console.log("Connected to PostgreSQL");
}
