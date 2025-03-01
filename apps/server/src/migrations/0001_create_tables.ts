import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
	DROP TABLE IF EXISTS prompts;
  	DROP TYPE IF EXISTS prompt_type;

	CREATE TYPE prompt_type AS ENUM ('user', 'system', 'tool');

	CREATE TABLE "prompt_types" (
    	id SERIAL PRIMARY KEY,
    	type prompt_type NOT NULL UNIQUE,
    	description TEXT,
    	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    	updated_at TIMESTAMP NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS prompts (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		type prompt_type NOT NULL,
		prompt TEXT NOT NULL,
		tags TEXT[] NOT NULL DEFAULT '{}'
  		);

	CREATE INDEX idx_prompts_type ON prompts(type);
  	CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
  `,
);
