# Public exports & advanced topics

This guide mirrors **`src/index.ts`**. Symbols not listed here are **internal** (not semver-stable as public API).

## Components

| Export | Role |
|--------|------|
| `SimpleChartEdge` | Full application shell (toolbar, settings, stage). |
| `ChartEdgeHost` | **Alias** of `SimpleChartEdge`. |
| `ChartEdgePulse` | Minimal product (plot + axes). |
| `ChartEdgeFlow` | Top bar, no drawing sidebar. |
| `ChartEdgeCommand` | Full trader UI. |
| `ChartEdgeDesk` | Same as Command; watermark on. |
| `ChartEdgeApex` | Command-like + `licenseKey` / eval banner. |
| `ChartEdgeStage` | Headless chart + axes + imperative handle. |
| `ChartStage` | **Deprecated** — use `ChartEdgeStage`. |
| `ChartEdgeMark` | DOM wordmark (marketing). |
| `ChartEdgeAttribution` | DOM attribution strip. |
| `ShapePropertiesModal` | Shape property editor UI. |
| `GlobalStyle` | Styled global CSS fragment for the shell. |

### Component prop / handle types

`SimpleChartEdgeProps`, `SimpleChartEdgeHandle`, `ChartEdgeHostProps`, `ChartEdgeHostHandle`, `ChartEdgePulseProps`, … `ChartEdgeApexProps`, `ChartEdgeStageProps`, `ChartEdgeStageHandle`, `ChartStageProps`, `ChartStageHandle` (deprecated), `ChartEdgeAttributionProps`, `ShapePropertiesFormState`, `ModalThemeVariant`, `ChartEdgeThemeVariant`.

## Context

| Export | Role |
|--------|------|
| `ModeProvider` | Wraps tree so drawing toolbar modes work. |
| `useMode` | Access `{ mode, setMode }` inside provider. |

The **`Mode` enum** is used internally by the toolbar; it is **not** re-exported from `chartedge`. Hosts driving drawings programmatically should use **`DrawingSpec`** + ref APIs, not `Mode` values.

## Core data types

| Export | Role |
|--------|------|
| `Interval` | OHLCV bar. |
| `TimeRange`, `ChartDimensionsData` | Time window / layout metrics. |
| `LiveDataPlacement`, `LiveDataApplyResult` | Live merge contract. |
| `ChartContextInfo` | `getChartContext()` snapshot. |
| `ChartEdgeProductId` | `'pulse' \| 'flow' \| 'command' \| 'desk' \| 'apex'`. |

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
| **Shape classes** | `LineShape`, `RectangleShape`, `CircleShape`, `TriangleShape`, `AngleShape`, `ArrowShape`, `Polyline`, `CustomSymbolShape` — advanced/tests. |
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

## `ChartEdgeStage` usage sketch

Wrap with **`ModeProvider`**. Pass **all** required `ChartEdgeStageProps` from TypeScript (intervals, `chartOptions`, tick count, `timeDetailLevel`, `timeFormat12h`, selection state, chart-type handler, settings opener, toolbar flags, etc.). Most hosts use a **product component** or **`ChartEdgeHost`** instead of calling `ChartEdgeStage` directly.

## Init process (summary)

1. Mount product or `ChartEdgeHost` / `ChartEdgeStage`.  
2. Merge `chartOptions` with defaults (stable prop reference recommended).  
3. Load `intervalsArray`; derive visible time and price ranges.  
4. Allocate canvases; draw grid, session shading, series, histogram, watermark, overlays (if enabled), drawings.  
5. After mount, ref is non-null — run imperative calls in `useEffect` or callbacks.

## Updating (summary)

| Concern | Mechanism |
|---------|-----------|
| Series | `intervalsArray` or `applyLiveData` / `addInterval` / index update |
| Styles | `chartOptions` (deep merge on real changes) or Settings modal |
| Drawings | Toolbar, or `addShape` / `updateShape` / `patchShape` / `setDrawingsFromSpecs` |
| View | Pan/zoom, `fitVisibleRangeToData`, `redrawCanvas`, `reloadCanvas` |
| Theme | Shell toggle + `chartOptions.base.theme` |

## Deprecated

- `ChartStage`, `ChartStageProps`, `ChartStageHandle` → use `ChartEdgeStage*`.
