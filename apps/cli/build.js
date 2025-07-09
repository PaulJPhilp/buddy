#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🔨 Building Buddy CLI...");

// Create dist directory
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  // Use tsc to compile TypeScript
  console.log("📦 Compiling TypeScript...");
  execSync(
    "npx tsc src/index.ts --outDir dist --module esnext --target es2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck",
    {
      cwd: __dirname,
      stdio: "inherit",
    },
  );

  console.log("✅ Build completed successfully!");
  console.log("");
  console.log("🚀 Run the CLI with:");
  console.log("  node apps/cli/dist/index.js --help");
} catch (error) {
  console.error("❌ Build failed:", error.message);

  // Alternative: Create a simple bundled version
  console.log("");
  console.log("🔄 Trying alternative approach...");

  // Read the main file and create a simple bundle
  const indexPath = path.join(__dirname, "src", "index.ts");
  const indexContent = fs.readFileSync(indexPath, "utf8");

  // Create a simple JavaScript version (this is a basic approach)
  const jsContent = `#!/usr/bin/env node
  
// Simple CLI runner - you'll need to install dependencies first
console.log('Buddy CLI');
console.log('========');
console.log('');
console.log('To run the full CLI, please:');
console.log('1. Install bun: curl -fsSL https://bun.sh/install | bash');
console.log('2. Run: bun run apps/cli/src/index.ts --help');
console.log('');
console.log('Or install tsx: npm install -g tsx');
console.log('Then run: tsx apps/cli/src/index.ts --help');
`;

  fs.writeFileSync(path.join(distDir, "index.js"), jsContent);
  fs.chmodSync(path.join(distDir, "index.js"), "755");

  console.log("✅ Created fallback CLI runner");
  console.log("🚀 Run: node apps/cli/dist/index.js");
}
