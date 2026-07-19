import dotenv from "dotenv";

dotenv.config()

export const environment = process.env.NODE_ENV || "production";
export const port = process.env.PORT || 3001;

export const logDirectory = process.env.LOG_DIR;

export const db = {
    name : process.env.DB_NAME || "",
    user : process.env.DB_USER || "",
    password : process.env.DB_PASSWORD || "",
    host : process.env.DB_HOST || "",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    url : process.env.DATABASE_URL || "",
}