# Glossary

## Data

- **Interval** — One bar or tick row: open, high, low, close, time (`t` in **Unix seconds**), optional volume (`v`). See `Interval` type.
- **Series** — Ordered array of intervals, usually sorted by `t`.
- **Time range** — Visible window on the X axis: `start` and `end` (Unix seconds). Indices `startIndex` / `endIndex` refer to positions in the loaded series.
- **Price range** — Visible Y window: min/max prices and derived `range` span.

## Chart presentation

- **Chart type** — `ChartType`: Candlestick, Line, Area, Bar (OHLCV rendering mode).
- **Theme** — `base.theme` on the chart (e.g. light, dark, grey) plus app-level light/dark toggle in the shell.
- **Axes** — Time (X) and price (Y) scales, tick formatting, locale, timezone options under `chartOptions.base.style.axes` and `chartOptions.axes`.
- **Histogram** — Volume bars below (or proportionally to) the main plot when `showHistogram` is true.
- **Overlay** — Additional computed or static series drawn on top of price (see overlay types in code).

## Products (tiers)

ChartEdge ships **named product components** that fix toolbar layout:

| Product   | Typical use |
|-----------|-------------|
| **Pulse** | Minimal embed: plot + axes only |
| **Flow**  | Top bar (symbol, settings, chart type); no drawing sidebar |
| **Command** | Full UI: side drawing bar + top bar |
| **Desk**  | Same as Command; in-chart branding watermark required |
| **Apex**  | Same chrome as Command; optional `licenseKey`, evaluation banner if missing |

Use **`ChartEdgeHost`** (`SimpleChartEdge`) **without** `productId` to control `showSidebar` / `showTopBar` / `showSettingsBar` yourself.

## Live data

- **Placement** — How new bars are merged: `replace`, `append`, `prepend`, `mergeByTime` (`LiveDataPlacement`).
- **Apply result** — `LiveDataApplyResult`: success flag, resulting intervals, `errors`, `warnings`.

## Drawings

- **Shape** — User or API-created overlay: line, rectangle, circle, triangle, angle, arrow, polyline, custom symbol (`ShapeType`).
- **Drawing spec** — Plain object `{ type, points, style?, id?, symbol?, size? }` for creation (`DrawingSpec`).
- **Patch** — Partial update `{ style?, points?, symbol?, size? }` (`DrawingPatch`).
- **Z-index** — Stack order: later shapes draw above earlier ones; hit-testing uses top-most first.

## Interaction modes

Internal drawing **mode** (toolbar) toggles between none, draw tools, select, and edit. Pan/zoom applies when mode is default navigation.

## Snapshot / export

- **Main canvas** — OHLC layer only (no histogram/drawings) via `getMainCanvasElement`.
- **Chart region snapshot** — PNG of the composed view (plot + axes) via `captureChartRegionToPngDataUrl` and toolbar integration.

## Indicators

- **Overlay** — A computed line series (e.g. SMA) drawn over price; configured via `base.showOverlayLine` and `base.overlays` or `base.overlayKinds`. See [Overlays & indicators](./12-overlays-and-indicators.md).

## Market calendar (axes)

- **Trading session** — Recurring weekday window (`dayOfWeek` + `HH:mm` start/end) used to dim time outside regular hours.
- **Holiday** — ISO date string list for calendar-aware behavior where applied.
