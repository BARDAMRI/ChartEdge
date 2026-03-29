# TickUp Charts — architecture overview

High-level map of the **shipped** React application (aligned with `src/`).

## Host shell (`tickup/full`)

- **`TickUpHost`** — root layout: **`GlobalStyle`**, optional Prime-tier eval banner, **`ModeProvider`**, **`SettingsModal`**, wires **`TickUpStage`**.
- **Product wrappers** — **`TickUpPulse`**, **`TickUpFlow`**, **`TickUpCommand`**, **`TickUpDesk`**, **`TickUpPrimeTier`**: fixed `productId` and chrome flags.
- **`SettingsToolbar`** — symbol field (with search / revert-on-failure), chart type, snapshot, range, CSV, refresh, theme.
- **`Toolbar`** (left) — drawing modes and tools when sidebar is on.

## Stage (`TickUpStage`)

- Owns **intervals** state, **visible range**, **drawings** list, **shape properties** modal trigger.
- Composes **Y axis**, **X axis**, **`ChartCanvas`** (main + histogram), optional **compact symbol strip** when there is no top bar but `symbol` / `defaultSymbol` is set.
- Exposes the **imperative handle** (shapes, intervals, `applyLiveData`, `getViewInfo`, `getChartContext`, …).

## Renderer (`ChartCanvas` + helpers)

- **Canvas 2D** layers (conceptually back → front): background, grid, session shading, main series (candle/line/area/bar), histogram, overlays, drawings, interaction/crosshair/tooltip, optional **watermark**.
- **Utilities** — `GraphHelpers` (`timeToX`, `priceToY`, …), overlay drawing, drawing hit-tests.

## Data flow

**Host / props** `intervalsArray` → stage state → **`ChartCanvas`**; streaming via **`applyLiveData`** or host-driven prop updates. **`chartOptions`** deep-merges from props and settings modal.

## Theming

- **`base.theme`** on chart options: light / dark / grey (+ string escape hatch).
- Shell **light/dark** toggle merges dark-friendly **`base.style`** overrides for the plot.

## Internal / collaborator docs

- **`docs/internal/`** — not published on npm; maintainer runbooks (e.g. Prime tier).

For API detail, use **[`../../documentation/`](../../documentation/README.md)**.
