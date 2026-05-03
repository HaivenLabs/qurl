import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createGoEnv, getBackendBinaryPath } from "./go-env.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(scriptDir);
const backendRoot = path.join(repoRoot, "backend");
const binaryPath = getBackendBinaryPath(repoRoot);
const env = {
  ...createGoEnv(repoRoot),
  QURL_LISTEN_ADDR: process.env.QURL_LISTEN_ADDR ?? ":8080",
};

mkdirSync(path.dirname(binaryPath), { recursive: true });

const build = spawnSync("go", ["build", "-o", binaryPath, "./cmd/qurl-backend"], {
  cwd: backendRoot,
  env,
  stdio: "inherit",
});

if (build.error) {
  throw build.error;
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

console.log(
  `Starting backend from ${path.relative(repoRoot, binaryPath)} on ${env.QURL_LISTEN_ADDR}`,
);

const server = spawn(binaryPath, {
  cwd: backendRoot,
  env,
  stdio: "inherit",
});

server.on("error", (error) => {
  throw error;
});

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 0);
});
