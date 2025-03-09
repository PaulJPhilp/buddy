import { PgClient } from "@effect/sql-pg";
import { config } from "dotenv";
import { Effect, Layer, Redacted } from "effect";
import postgres from "postgres";

config();

const password = process.env.POSTGRES_PW ?? "123";
const user = process.env.POSTGRES_USER ?? "123";
const database = "postgres"; // Hardcode to postgres database for now
const host = "127.0.0.1"; // Use IP address instead of hostname
const port = 5432; // Hardcode the port to match PostgreSQL

// Log database configuration (excluding password)
Effect.log(
	`Database config: user=${user}, database=${database}, host=${host}, port=${port}`,
);

// Create a native PostgreSQL client
const sql = postgres({
	host,
	port: Number(port),
	database,
	username: user,
	password,
	ssl: false,
});

// Create a layer that provides the SQL client
export const DatabaseLive = PgClient.layer({
	database,
	host,
	port,
	username: user,
	password: Redacted.make(password),
	ssl: false,
}).pipe(
	Layer.tap(() => Effect.log("Database layer initialized")),
	Layer.tapError((error) =>
		Effect.log(`Database layer error: ${JSON.stringify(error)}`),
	),
);
