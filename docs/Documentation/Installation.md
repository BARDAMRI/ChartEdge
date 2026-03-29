# Installation

Install the package and its **peer dependencies**:

```bash
npm install tickup react react-dom styled-components
```

Or with Yarn / pnpm:

```bash
yarn add tickup react react-dom styled-components
```

```bash
pnpm add tickup react react-dom styled-components
```

## Entry points

| Import | Use when |
|--------|----------|
| **`tickup`** | You need **`TickUpStage`**, types, live-data helpers, overlays, drawing specs, snapshots — you provide layout and chrome. |
| **`tickup/full`** | You need **`TickUpCommand`**, **`TickUpPulse`**, **`TickUpHost`** (`TickUpHost`), shape classes, modals, etc. |

TypeScript loads declarations from **`dist/index.d.ts`** and **`dist/full.d.ts`** via `package.json` **`types`** / **`exports`**.

## Verify

```bash
npm run build
```

in a project that depends on `tickup` should resolve both entries. See **[`../../documentation/02-installation.md`](../../documentation/02-installation.md)** for more detail.
