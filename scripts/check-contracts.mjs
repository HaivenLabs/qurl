import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(scriptDir);
const contractScript = path.join(
  repoRoot,
  "packages",
  "contracts",
  "scripts",
  "validate-contracts.ps1",
);

const candidates =
  process.platform === "win32"
    ? [
        ["pwsh", ["-File", contractScript]],
        ["powershell", ["-ExecutionPolicy", "Bypass", "-File", contractScript]],
      ]
    : [["pwsh", ["-File", contractScript]]];

for (const [command, args] of candidates) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error?.code === "ENOENT") {
    continue;
  }

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

throw new Error(
  "PowerShell is required to validate contracts. Install pwsh or run on Windows with powershell.exe.",
);
