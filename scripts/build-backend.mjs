import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createGoEnv } from "./go-env.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(scriptDir);
const backendRoot = path.join(repoRoot, "backend");

const result = spawnSync("go", ["build", "./cmd/qurl-backend"], {
  cwd: backendRoot,
  env: createGoEnv(repoRoot),
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
