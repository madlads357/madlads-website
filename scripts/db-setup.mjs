// Creates the database tables (db/schema.sql). Usage: npm run db:setup
// Reads DATABASE_URL_UNPOOLED (or DATABASE_URL) from the environment or from .env.local.
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (in the environment or .env.local).");
  process.exit(1);
}

const sql = neon(url);
const statements = readFileSync("db/schema.sql", "utf8")
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
for (const statement of statements) await sql.query(statement);
const tables = await sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
console.log("Tables:", tables.map((t) => t.table_name).join(", "));
