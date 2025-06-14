import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const configsDir = path.resolve(__dirname, "../configs");

const files = readdirSync(configsDir).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.log("No config files found in src/configs.");
  process.exit(0);
}

console.log("Available Buddy bootstrap configs:\n");

for (const file of files) {
  const filePath = path.join(configsDir, file);
  let summary = "";
  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    const chatApps = parsed.chatApps?.map((a: any) => a.id).join(", ") || "-";
    summary = `  chatApps: [${chatApps}]`;
  } catch {
    summary = "  (invalid JSON)";
  }
  console.log(`- ${file}\n${summary}\n`);
}
