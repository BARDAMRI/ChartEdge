# TickUp Charts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

High-performance **React** financial charts: Canvas 2D OHLCV, pan/zoom, drawings, live data merge, and tiered product layouts.

## License & what we ship publicly

**[MIT](./LICENSE)** — free for commercial and personal use. The **documented, supported** embeds in this release are **TickUpPulse**, **TickUpFlow**, **TickUpCommand**, **TickUpDesk**, plus **TickUpHost** / **TickUpStage** for custom chrome.

**Prime:** the **`TickUpPrime`** render profile (`chartOptions.base.engine: 'prime'` or `ref.setEngine(TickUpPrime)`) adds the neon canvas look and glass toolbars. **`TickUpPrimeTier`** (`productId: 'prime'`) is the licensed shell (same chrome as Command; optional **`licenseKey`** hides the eval strip). See **[documentation/15-prime-engine-and-pro-roadmap.md](./documentation/15-prime-engine-and-pro-roadmap.md)**.

**Publishing:** run **`npm run build`** and **`npm pack --dry-run`**, then **`npm publish`** with the intended **`version`** in `package.json`. The npm page shows this README, **LICENSE**, **CHANGELOG**, and bundled **documentation/**.

## Features

- **Chart types:** candlestick, line, area, bar  
- **Canvas 2D** rendering (no WebGL requirement)  
- **Live data:** `applyLiveData` with replace / append / prepend / merge-by-time  
- **Drawings:** lines, rectangles, circles, triangles, angles, arrows, polylines, custom symbols — toolbar + full imperative API  
- **Settings modal:** axes, colors, grid, histogram, regional formats, hover/crosshair/tooltip toggles  
- **Products (public):** Pulse (minimal + optional symbol strip), Flow (top bar), Command & Desk (full trader UI)  
- **Snapshots & export:** PNG capture helpers, CSV export from toolbar  
- **Theming:** light / dark / grey chart themes, shell light–dark toggle, in-chart watermark (Desk)

## Who are TickUp Charts for?

Developers building trading terminals, analytics dashboards, and embeddable market widgets who want a **React + styled-components** chart with a real drawing and streaming story.

## API shape (important)

The npm package is **React-based**: you render **`TickUpHost`**, **`TickUpStage`**, or tier components (`TickUpCommand`, …) and pass **`intervalsArray`** / **`chartOptions`**. The **Prime** visual engine is applied with **`ref.setEngine(TickUpPrime)`** (or `chartOptions.base.engine: 'prime'`). There is **no** separate `TickUpCore` DOM constructor in this codebase.

## Quick setup

### 1. Install

```bash
npm install tickup react react-dom styled-components
```

React 18+, React DOM, and styled-components 6.x are **peer dependencies**.

### 2a. Basic chart (default package)

Use **`tickup`** when you only need the canvas stage and will supply your own shell:

```tsx
import { TickUpStage, ModeProvider } from 'tickup';
import type { DeepRequired, ChartOptions } from 'tickup';
// …build chartOptions (see documentation), wrap with ModeProvider + your layout
```

See **[`documentation/05-props-and-chart-options.md`](./documentation/05-props-and-chart-options.md)** for `TickUpStage` / `chartOptions`.

### 2b. Full trader UI (`tickup/full`)

```tsx
import { useRef } from 'react';
import { TickUpCommand, type TickUpHostHandle } from 'tickup/full';

const data = [
  { t: 1700000000, o: 100, h: 102, l: 99, c: 101, v: 1200 },
  { t: 1700000060, o: 101, h: 103, l: 100, c: 102, v: 900 },
];

export function App() {
  const ref = useRef<TickUpHostHandle>(null);
  return (
    <div style={{ height: 480, width: '100%' }}>
      <TickUpCommand ref={ref} intervalsArray={data} defaultSymbol="DEMO" />
    </div>
  );
}
```

Use **`TickUpPulse`** for plot+axes only, or **`TickUpHost`** (`TickUpHost`) without `productId` for custom toolbars — all from **`tickup/full`**.

### TypeScript & IntelliSense (`.d.ts`)

| Import | Types entry (`package.json`) |
|--------|------------------------------|
| `tickup` | `"types": "./dist/index.d.ts"` |
| `tickup/full` | `exports["./full"].types` → `./dist/full.d.ts` |

Declarations are emitted with **`tsc --emitDeclarationOnly`** after the Vite dual build (`npm run build`). This repo uses the **TypeScript compiler** for `.d.ts` rather than **`vite-plugin-dts`**, so both entries and the full module graph stay aligned with `strict` checking.

Public surfaces (e.g. **`TickUpHostProps`**, **`TickUpHostHandle`**, **`TickUpStageProps`**) carry **TSDoc** — your editor shows them on hover and in autocomplete.

### API reference (summary)

| Prop / area | Purpose |
|-------------|---------|
| `intervalsArray` | OHLCV series (`Interval[]`). |
| `chartOptions` | Deep-partial `ChartOptions` (chart type, theme, crosshair, tooltip, overlays, axes, …). Prefer a **stable** `useMemo` reference when not intentionally changing options. |
| `symbol` / `defaultSymbol` | Ticker; **Pulse** (no top bar) shows a **read-only symbol strip** when non-empty. |
| `onSymbolChange` | Fired when the toolbar symbol field changes. |
| `onSymbolSearch` | Enter / search button; return **`false`** or **reject** `Promise` on failure to **revert** to the last good symbol and sync via `onSymbolChange`. |
| `onRefreshRequest` | Toolbar refresh. |
| `productId` | On product components, locks layout (`pulse` \| `flow` \| `command` \| `desk` \| `prime`). |
| `ref` | **`TickUpHostHandle`**: `applyLiveData`, `addShape`, `patchShape`, `getViewInfo`, `getChartContext`, `fitVisibleRangeToData`, `setEngine`, interval helpers, … |

Full tables: **[Props & chart options](./documentation/05-props-and-chart-options.md)** · **[Imperative API](./documentation/06-imperative-api.md)**.

### 3. Documentation

Guides (glossary, API, live data, drawings, settings, exports) live in **[`documentation/`](./documentation/README.md)**. They are **included in the npm package** under `node_modules/tickup/documentation/` so links work from a local install; the same tree is on GitHub for browsing without installing.

| Start here | Link |
|------------|------|
| Documentation hub | [documentation/README.md](./documentation/README.md) |
| Quick start | [documentation/03-quick-start.md](./documentation/03-quick-start.md) |
| Imperative API | [documentation/06-imperative-api.md](./documentation/06-imperative-api.md) |
| Live updates | [documentation/07-data-and-live-updates.md](./documentation/07-data-and-live-updates.md) |
| Overlays (SMA, EMA, VWAP, …) | [documentation/12-overlays-and-indicators.md](./documentation/12-overlays-and-indicators.md) |
| Locale, RTL, sessions | [documentation/13-internationalization-and-axes.md](./documentation/13-internationalization-and-axes.md) |
| Full export list | [documentation/11-exports-and-advanced.md](./documentation/11-exports-and-advanced.md) |
| Prime engine & Pro roadmap | [documentation/15-prime-engine-and-pro-roadmap.md](./documentation/15-prime-engine-and-pro-roadmap.md) |
| Legal & policies (templates) | [documentation/14-legal-and-policies.md](./documentation/14-legal-and-policies.md) · [`legal/`](./legal/) |
| Example app (tiers, options, symbol API, ref demos) | [example/README.md](./example/README.md) |

Legacy / supplementary material may also appear under [`docs/`](./docs/).

## Roadmap

See [`docs/Project_Roadmap/`](./docs/Project_Roadmap/) or project issues for upcoming work.

## npm package entries

| Import | What you get |
|--------|----------------|
| **`tickup`** (default) | **Basic charts:** `TickUpStage`, types, live-data helpers, overlays, drawing specs/factories, snapshots, branding, `GlobalStyle`, `ModeProvider`. Build your own layout and chrome. |
| **`tickup/full`** | **Full UI:** `TickUpHost`, `TickUpPulse` / `Flow` / `Command` / `Desk` / **`TickUpPrimeTier`**, shape component classes, `ShapePropertiesModal`, engines (`TickUpPrime`), deprecated `ChartStage` aliases. |

Docs that show `TickUpCommand` or `TickUpHost` assume `import … from 'tickup/full'`.

### Publish to npm

**Pre-publish checklist**

- [ ] Root **`README.md`** is current (install, quick start, API summary).
- [ ] **`LICENSE`** is present and **not** excluded by `.npmignore` (it is **not** ignored here).
- [ ] **`CHANGELOG.md`** updated for the version you are publishing.
- [ ] Run **`npm run build`** and confirm **`dist/index.d.ts`** and **`dist/full.d.ts`** exist.
- [ ] Run **`npm pack --dry-run`** and confirm the tarball lists `dist/`, `documentation/`, `legal/` (policy templates linked from doc 14), `README.md`, `LICENSE`, `CHANGELOG.md` (and not `src/`).

**How this repo maps to npm**

| Item | In this repo |
|------|----------------|
| Entry fields | `main` → `dist/tickup.cjs.js`, `module` → `dist/tickup.es.js`, `types` → `dist/index.d.ts` |
| Conditional exports | `exports["."]` and `exports["./full"]` → `tickup-full.*.js` (ESM + CJS + types) |
| Packaged files | `"files": ["dist", "documentation", "legal", …]` — **no `src/`** |
| Ignore source | **`.npmignore`** excludes `src/`, `example/`, `docs/`, tooling configs, etc. |
| Pre-publish build | **`prepublishOnly`**: `npm run build` (tsc + dual Vite lib + `emitDeclarationOnly` `.d.ts`) |
| Public scoped packages | **`publishConfig.access`**: `"public"` (if you publish under `@scope/name`) |

**Optional:** Host a separate doc site (e.g. VitePress) on GitHub Pages or Vercel and set **`package.json` → `homepage`** to that URL; **`repository.url`** remains the Git clone link.

```bash
npm login
npm publish
```

For a scoped name (`@user/tickup`), use `npm publish --access public` if `publishConfig` is not picked up. Bump **`version`** in `package.json` before each new release.

## Contributing & contact

Open-source contributions, questions, and collaboration:

- **GitHub:** [github.com/BARDAMRI](https://github.com/BARDAMRI/) — [TickUp Charts source](https://github.com/BARDAMRI/tickup-charts), [issues](https://github.com/BARDAMRI/tickup-charts/issues)
- **Email:** [bardamri1702@gmail.com](mailto:bardamri1702@gmail.com)
- **Website:** [bardamri.com](https://bardamri.com)

See **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** for guidelines.

## License

[MIT](./LICENSE) — Copyright (c) 2026 Bar Damri.

## Legal templates

Standard **Terms of Service**, **Privacy Policy**, and **Acceptable Use Policy** templates—for hosted products, accounts, and services—live in **[`legal/`](./legal/)**. They are **not legal advice**; customize placeholders and review with counsel before publishing. Overview: **[`documentation/14-legal-and-policies.md`](./documentation/14-legal-and-policies.md)**.
