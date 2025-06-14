import { readFileSync } from "node:fs";
import path from "node:path";

// Path to the config file
const configPath = path.resolve(
  __dirname,
  "../configs/default-buddy-bootstrap.json",
);

// Read the config file
const configJson = readFileSync(configPath, "utf-8");

// Set in localStorage (browser only)
if (typeof window !== "undefined" && window.localStorage) {
  window.localStorage.setItem("buddy:bootstrap", configJson);
  console.log("✅ Buddy bootstrap config loaded into localStorage.");
} else {
  // For Node.js/Bun, print instructions
  console.log(
    "This script is intended to be run in the browser console or as part of a dev tool.\n",
  );
  console.log(
    "To load the config manually, paste the following in your browser console:",
  );
  console.log(
    `localStorage.setItem('buddy:bootstrap', ${JSON.stringify(configJson)});`,
  );
}
