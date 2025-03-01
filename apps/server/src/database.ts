import { PgClient } from "@effect/sql-pg";
import { config } from "dotenv";
import { Redacted } from "effect";

config();

const password = process.env.POSTGRES_PW ?? "123";
const user = process.env.POSTGRES_USER ?? "123";
const database = process.env.POSTGRES_DB ?? "123";
const host = process.env.POSTGRES_HOST ?? "123";
const port = process.env.POSTGRES_PORT ?? "123";

export const DatabaseLive = PgClient.layer({
  password: Redacted.make(password),
  username: user,
  database: database,
  host: host,
  port: Number.parseInt(port),
});
