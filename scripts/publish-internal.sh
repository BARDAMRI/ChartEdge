#!/usr/bin/env bash
# =============================================================================
# TickUp Charts — internal maintainer release script
# =============================================================================
# This file lives under scripts/ and is listed in .npmignore so it is NOT
# included in the npm tarball. It is still visible if the Git repo is public;
# for org-secret procedures, mirror this runbook in a private wiki as well.
#
# What it does (in order):
#   1. Sanity-check the version bump argument.
#   2. Ensure you are logged in to npm (prompts npm login if not).
#   3. Clean install from lockfile (npm ci) so the release matches CI.
#   4. Run tests (not part of prepublishOnly; we fail fast before bumping).
#   5. Bump package.json + package-lock.json version.
#   6. Build the library (same as prepublishOnly); publish will run it again.
#   7. Optional dry-run pack (lists exactly what would ship).
#   8. npm publish — runs lifecycle script prepublishOnly → npm run build again.
#
# Version bump (--no-git-tag-version):
#   We use --no-git-tag-version so a dirty working tree or missing git config
#   does not block the release. After a successful publish, commit the two
#   files and tag yourself if your process uses Git tags:
#     git add package.json package-lock.json
#     git commit -m "chore: release vX.Y.Z"
#     git tag vX.Y.Z && git push && git push --tags
#
# 2FA on npm:
#   If your account requires an OTP, run publish yourself with:
#     npm publish --otp=123456
#   or set NPM_CONFIG_OTP for that shell session.
#
# Usage:
#   ./scripts/publish-internal.sh patch
#   ./scripts/publish-internal.sh minor
#   ./scripts/publish-internal.sh major
#   ./scripts/publish-internal.sh 0.2.0
# =============================================================================

set -euo pipefail

usage() {
  echo "Usage: $0 <patch|minor|major|prepatch|preminor|premajor|prerelease|X.Y.Z>" >&2
  exit 1
}

BUMP="${1:-}"
if [[ -z "$BUMP" ]]; then
  usage
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Working directory: $ROOT"

# -----------------------------------------------------------------------------
# Step 1 — npm authentication
# -----------------------------------------------------------------------------
# npm whoami calls the registry; exit code non-zero means no valid token.
if ! npm whoami >/dev/null 2>&1; then
  echo "==> Not logged in to the npm registry. Starting npm login (interactive)."
  npm login
fi

echo "==> Logged in as: $(npm whoami)"

# -----------------------------------------------------------------------------
# Step 2 — reproducible install (same as a fresh CI checkout)
# -----------------------------------------------------------------------------
echo "==> npm ci"
npm ci

# -----------------------------------------------------------------------------
# Step 3 — tests (prepublishOnly does NOT run tests; we do explicitly)
# -----------------------------------------------------------------------------
echo "==> npm test"
npm test

# -----------------------------------------------------------------------------
# Step 4 — version bump in package.json and package-lock.json
# -----------------------------------------------------------------------------
echo "==> npm version ${BUMP} --no-git-tag-version"
npm version "${BUMP}" --no-git-tag-version

# -----------------------------------------------------------------------------
# Step 5 — build (mirrors prepublishOnly so failures happen before publish)
# -----------------------------------------------------------------------------
echo "==> npm run build"
npm run build

# -----------------------------------------------------------------------------
# Step 6 — show tarball contents (no upload)
# -----------------------------------------------------------------------------
echo "==> npm pack --dry-run"
npm pack --dry-run

# -----------------------------------------------------------------------------
# Step 7 — publish (prepublishOnly runs npm run build one more time by design)
# -----------------------------------------------------------------------------
echo "==> npm publish"
npm publish

echo ""
VER="$(node -p "require('./package.json').version")"
echo "==> Done. If you use Git for releases, commit package.json + package-lock.json and tag v${VER}."
