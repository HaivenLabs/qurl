import path from "node:path";

export function createGoEnv(repoRoot) {
  return {
    ...process.env,
    GOCACHE: path.join(repoRoot, ".cache", "go-build"),
    GOMODCACHE: path.join(repoRoot, ".cache", "gomod"),
  };
}
