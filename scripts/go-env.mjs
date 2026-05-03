import path from "node:path";

export function getBackendBinaryPath(repoRoot) {
  return path.join(
    repoRoot,
    ".cache",
    "bin",
    process.platform === "win32" ? "qurl-backend.exe" : "qurl-backend",
  );
}

export function createGoEnv(repoRoot) {
  return {
    ...process.env,
    GOCACHE: path.join(repoRoot, ".cache", "go-build"),
    GOMODCACHE: path.join(repoRoot, ".cache", "gomod"),
  };
}
