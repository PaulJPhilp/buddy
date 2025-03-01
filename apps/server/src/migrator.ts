import { fileURLToPath } from "node:url";
import { NodeContext } from "@effect/platform-node";
import type { FileSystem } from "@effect/platform/FileSystem";
import { PgMigrator } from "@effect/sql-pg";
import { Layer } from "effect";
import { DatabaseLive } from "./database";
// import { Migrator } from "@effect/sql";

export interface Migrator {
  schemaDirectory: string;
  loader: PgMigrator.Loader<FileSystem>;
}

export const MigratorLive = PgMigrator.layer({
  // Where to put the `_schema.sql` file
  schemaDirectory: "src/migrations",
  loader: PgMigrator.fromFileSystem(
    fileURLToPath(new URL("migrations", import.meta.url)),
  ),
}).pipe(Layer.provide([DatabaseLive, NodeContext.layer]));
