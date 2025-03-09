import { config } from "dotenv";
import postgres from "postgres";

config();

const password = process.env.POSTGRES_PW ?? "123";
const user = process.env.POSTGRES_USER ?? "123";
const database = "postgres"; // Hardcode to postgres database for now
const host = "127.0.0.1"; // Use IP address instead of hostname
const port = 5432; // Hardcode the port to match PostgreSQL

console.log(
	`Database config: user=${user}, database=${database}, host=${host}, port=${port}`,
);

const sql = postgres({
	host,
	port,
	database,
	username: user,
	password,
	ssl: false,
});

async function testConnection() {
	try {
		const result = await sql`SELECT 1`;
		console.log("Connection successful:", result);
	} catch (error) {
		console.error("Connection failed:", error);
	} finally {
		await sql.end();
	}
}

testConnection();
