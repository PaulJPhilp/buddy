import { execSync } from "node:child_process";
// scripts/bump-versions.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [packageName, newVersion] = process.argv.slice(2);

if (!packageName || !newVersion) {
  console.error(
    "\x1b[31mUsage: npm run bump <package-name> <new-version>\x1b[0m",
  );
  console.error("Example: npm run bump @your-org/ui-components 1.2.0");
  console.error('Use "all" as package name to bump all packages');
  process.exit(1);
}

try {
  // Get all workspace packages
  const workspaceOutput = execSync("npm list -w -json", {
    encoding: "utf-8",
  });
  const workspaceData = JSON.parse(workspaceOutput);
  const workspaces = workspaceData.workspaces || [];

  // Filter to only packages/ directory if needed
  const packagesOnly = workspaces.filter((w: string) =>
    w.startsWith("packages/"),
  );

  const updatePackage = async (workspace: string) => {
    const pkgJsonPath = path.join(process.cwd(), workspace, "package.json");

    if (fs.existsSync(pkgJsonPath)) {
      const pkgContent = await fs.promises.readFile(pkgJsonPath, "utf-8");
      const pkgJson = JSON.parse(pkgContent);

      // Only update if it matches the package name or "all" was specified
      if (packageName === "all" || pkgJson.name === packageName) {
        const oldVersion = pkgJson.version;
        pkgJson.version = newVersion;

        await fs.promises.writeFile(
          pkgJsonPath,
          `${JSON.stringify(pkgJson, null, 2)}\n`,
        );

        console.log(
          `\x1b[32m✓\x1b[0m Updated ${pkgJson.name} from ${oldVersion} to ${newVersion}`,
        );
      }
    }
  };

  // Update all relevant packages
  await Promise.all(packagesOnly.map(updatePackage));

  // Now update any dependent packages that use workspace: protocol
  await Promise.all(
    workspaces.map(async (workspace: string) => {
      const pkgJsonPath = path.join(process.cwd(), workspace, "package.json");

      if (fs.existsSync(pkgJsonPath)) {
        const pkgContent = await fs.promises.readFile(pkgJsonPath, "utf-8");
        const pkgJson = JSON.parse(pkgContent);
        let updated = false;

        // Update dependencies if they reference the updated package
        // biome-ignore lint/complexity/noForEach: <explanation>
        ["dependencies", "devDependencies"].forEach((depType) => {
          if (pkgJson[depType]) {
            // biome-ignore lint/complexity/noForEach: <explanation>
            Object.entries(pkgJson[depType]).forEach(([dep, version]) => {
              if (
                (version as string).startsWith("workspace:") &&
                dep === packageName
              ) {
                pkgJson[depType][dep] = `workspace:^${newVersion}`;
                updated = true;
              }
            });
          }
        });

        if (updated) {
          await fs.promises.writeFile(
            pkgJsonPath,
            `${JSON.stringify(pkgJson, null, 2)}\n`,
          );
          console.log(`\x1b[32m✓\x1b[0m Updated dependencies in ${workspace}`);
        }
      }
    }),
  );
} catch (error) {
  console.error("\x1b[31mError updating versions:\x1b[0m", error);
  process.exit(1);
}
