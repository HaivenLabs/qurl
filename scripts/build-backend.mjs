import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createGoEnv, getBackendBinaryPath } from "./go-env.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(scriptDir);
const backendRoot = path.join(repoRoot, "backend");
const binaryPath = getBackendBinaryPath(repoRoot);

mkdirSync(path.dirname(binaryPath), { recursive: true });

const result = spawnSync("go", ["build", "-o", binaryPath, "./cmd/qurl-backend"], {
  cwd: backendRoot,
  env: createGoEnv(repoRoot),
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

console.log(`Built backend: ${binaryPath}`);
process.exit(result.status ?? 1);
