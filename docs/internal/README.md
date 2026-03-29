# Internal docs (collaborators)

Files in **`docs/internal/`** are **not** shipped in the **npm** package (`package.json` → `"files"` does not include `docs/`, and **`.npmignore`** lists `docs/`).

Use this folder for **maintainer-only** runbooks (e.g. [TickUp Prime tier & engine](./tickup-prime-tier.md)).

**Publishing a new npm version (maintainers):** from the repo root, run **`./scripts/publish-internal.sh patch`** (or `minor`, `major`, or an explicit semver like `0.2.0`). That script is commented step-by-step; it is excluded from the npm package via **`.npmignore`** → `scripts/`. It is intentionally **not** wired as a `package.json` script so the registry does not advertise a publish entry.

**If the Git repository is public**, anyone can read these files on GitHub. For truly private instructions, keep a copy in a **private** wiki, team drive, or **private** repo and treat this tree as a convenience for developers who already have clone access.
