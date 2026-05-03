param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
  throw "corepack is required. Install Node.js 22+ before running bootstrap."
}

corepack enable
pnpm install

