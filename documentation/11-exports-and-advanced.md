# Public exports & advanced topics

Published API is split across **`tickup`** (default) and **`tickup/full`**. Symbols not listed here are **internal** (not semver-stable as public API).

## `tickup` (default — basic charts)

| Export | Role |
|--------|------|
| `TickUpStage` | Chart + axes + toolbars (when enabled via props) + optional **compact symbol strip** when `showTopBar` is false and `symbol` / `defaultSymbol` is set + imperative handle. |
| `TickUpMark` | DOM wordmark. |
| `TickUpAttribution` | DOM attribution strip. |
| `GlobalStyle` | Styled global CSS fragment (optional for hosts). |
| `ModeProvider`, `useMode` | Drawing mode context. |
| `ChartOptions`, `DeepRequired` | Configuration typing helpers. |
| Plus | Intervals, live-data utils, overlays builders, drawing specs/factories/query helpers, snapshot helpers, graph math (`timeToX`, …), `ShapeType` & shape arg types, `IDrawingShape`, enums (`ChartType`, `AxesPosition`, overlay keys), branding types. |

## `tickup/full` (product shells + extended)

Everything in **`tickup`**, **plus**:

### Components

| Export | Role |
|--------|------|
| `TickUpHost` | Full application shell (toolbar, settings, stage). |
| `TickUpHost` | **Alias** of `TickUpHost`. |
| `TickUpPulse` | Minimal product (plot + axes); symbol via compact strip when provided. |
| `TickUpFlow` | Top bar, no drawing sidebar. |
| `TickUpCommand` | Full trader UI. |
| `TickUpDesk` | Same as Command; watermark on. |
| `TickUpPrimeTier` | Licensed/eval shell: same chrome as Command; `productId: 'prime'`. |
| `TickUpPrime`, `TickUpStandardEngine` | Engine profiles for `setEngine` / `chartOptions.base.engine`. |
| `ChartStage` | **Deprecated** — use `TickUpStage`. |
| `ShapePropertiesModal` | Shape property editor UI. |

### Component prop / handle types (full)

`TickUpHostProps`, `TickUpHostHandle`, `TickUpHostProps`, `TickUpHostHandle`, `TickUpPulseProps`, `TickUpFlowProps`, `TickUpCommandProps`, `TickUpDeskProps`, `TickUpStageProps`, `TickUpStageHandle`, `ChartStageProps`, `ChartStageHandle` (deprecated), `TickUpAttributionProps`, `ShapePropertiesFormState`, `ModalThemeVariant`, `TickUpThemeVariant`, `TickUpProductId`.

## Context

| Export | Role |
|--------|------|
| `ModeProvider` | Wraps tree so drawing toolbar modes work. |
| `useMode` | Access `{ mode, setMode }` inside provider. |

The **`Mode` enum** is used internally by the toolbar; it is **not** re-exported from the package. Hosts driving drawings programmatically should use **`DrawingSpec`** + ref APIs, not `Mode` values.

## Core data types

| Export | Role |
|--------|------|
| `Interval` | OHLCV bar. |
| `TimeRange`, `ChartDimensionsData` | Time window / layout metrics. |
| `LiveDataPlacement`, `LiveDataApplyResult` | Live merge contract. |
| `ChartContextInfo` | `getChartContext()` snapshot. |
| `TickUpProductId` | Product id union — **`tickup/full` only**. Public docs use `pulse` \| `flow` \| `command` \| `desk` only. |

## Chart configuration types

| Export | Role |
|--------|------|
| `ChartType`, `TimeDetailLevel` | Chart mode & axis tick density. |
| `AxesPosition` | Y-axis left/right. |
| `OverlayWithCalc`, `OverlaySeries`, `OverlayOptions` | Indicator configuration. |
| `OverlayKind`, `OverlayPriceKey` | Enum keys for overlays. |

## Drawings

| Export | Role |
|--------|------|
| `ShapeType` | String enum for spec `type`. |
| `ShapeBaseArgs`, `Drawing` | Internal drawing description types. |
| `DrawingSpec`, `DrawingPatch`, `DrawingInput` | Spec / patch / instance union for APIs. |
| `drawingFromSpec`, `applyDrawingPatch`, `isDrawingPatch` | Build & merge helpers. |
| `DrawingSnapshot`, `DrawingQuery`, `DrawingWithZIndex` | Query & serialization. |
| `shapeToSnapshot`, `queryDrawingsToSnapshots`, `filterDrawingInstances`, `filterDrawingsWithMeta` | Snapshot pipelines. |
| `IDrawingShape` | Instance interface. |
| `LineShapeArgs`, `RectangleShapeArgs`, … `CustomSymbolShapeArgs` | Per-shape argument types. |
| **Shape classes** | `LineShape`, `RectangleShape`, … — advanced/tests; **`tickup/full` only**. |
| `generateDrawingShapeId` | Id factory. |

## Overlay builders

| Export | Role |
|--------|------|
| `OverlaySpecs`, `withOverlayStyle`, `overlay` | Build `OverlayWithCalc` entries. |

Details: [Overlays & indicators](./12-overlays-and-indicators.md).

## Live data utilities

| Export | Role |
|--------|------|
| `applyLiveDataMerge` | Same merge as ref `applyLiveData` (pure function). |
| `normalizeInterval`, `normalizeIntervals` | Validate/clamp bars. |
| `dedupeByTimePreferLast` | Collapse duplicate timestamps. |

## Snapshot / export helpers

| Export | Role |
|--------|------|
| `captureChartRegionToPngDataUrl` | Rasterize a DOM region. |
| `buildChartSnapshotFileName`, `sanitizeChartSnapshotToken`, `contrastingFooterTextColor` | Filename & contrast helpers. |
| `ChartSnapshotMeta` | Metadata type for snapshots. |

## Graph math (coordinate helpers)

`timeToX`, `xToTime`, `priceToY`, `yToPrice`, `interpolatedCloseAtTime`, `lerp`, `xFromCenter`, `xFromStart` — align custom logic with chart scales.

## Not exported (internal)

Examples: `FormattingService`, `deepMerge`, `deepEqual`, toolbar `Tooltip`, most styled wrappers. Do not import these from deep paths in apps if you want upgrade safety.

## `TickUpStage` usage sketch

Wrap with **`ModeProvider`**. Pass **all** required `TickUpStageProps` from TypeScript (intervals, `chartOptions`, tick count, `timeDetailLevel`, `timeFormat12h`, selection state, chart-type handler, settings opener, toolbar flags, etc.). Many hosts use a **product component** or **`TickUpHost`** from **`tickup/full`** instead of wiring `TickUpStage` alone.

## Init process (summary)

1. Mount product or `TickUpHost` / `TickUpStage`.  
2. Merge `chartOptions` with defaults (stable prop reference recommended).  
3. Load `intervalsArray`; derive visible time and price ranges.  
4. Allocate canvases; draw grid, session shading, series, histogram, watermark, overlays (if enabled), drawings.  
5. After mount, the **ref** is non-null — run imperative calls in `useEffect` or callbacks. **`getViewInfo()` / `getChartContext()`** may still return **`null`** until the inner stage is ready; use optional chaining or retry briefly (see the [`example/`](../example/) app for patterns).

## Updating (summary)

| Concern | Mechanism |
|---------|-----------|
| Series | `intervalsArray` or `applyLiveData` / `addInterval` / index update |
| Styles | `chartOptions` (deep merge on real changes) or Settings modal |
| Drawings | Toolbar, or `addShape` / `updateShape` / `patchShape` / `setDrawingsFromSpecs` |
| View | Pan/zoom, `fitVisibleRangeToData`, `redrawCanvas`, `reloadCanvas` |
| Theme | Shell toggle + `chartOptions.base.theme` |

## Deprecated

- `ChartStage`, `ChartStageProps`, `ChartStageHandle` → use `TickUpStage*`.
