# Public exports & advanced topics

## Primary imports

```ts
import {
  ChartEdgeCommand,
  ChartEdgeHost,
  ChartEdgePulse,
  ChartEdgeFlow,
  ChartEdgeDesk,
  ChartEdgeApex,
  SimpleChartEdge,
  ChartType,
  TimeDetailLevel,
  AxesPosition,
  ShapeType,
  ModeProvider,
  useMode,
  // …utilities below
} from 'chartedge';
```

Full list: see `src/index.ts`.

## Headless / embedded stage

**`ChartEdgeStage`** (and legacy alias `ChartStage`) exposes the canvas + axes without the full app shell. You supply props similar to the internal stage: `intervalsArray`, `chartOptions`, callbacks, etc. You must wrap with **`ModeProvider`** if drawing modes are used.

Types: `ChartEdgeStageProps`, `ChartEdgeStageHandle`.

## Overlays

Exports include **`withOverlayStyle`**, **`OverlaySpecs`**, **`overlay`**, and types **`OverlayWithCalc`**, **`OverlayKind`**, **`OverlayPriceKey`**. Use these to configure extra series lines/areas derived from price data.

## Graph math helpers

`timeToX`, `xToTime`, `priceToY`, `yToPrice`, `interpolatedCloseAtTime`, `lerp`, `xFromCenter`, `xFromStart` — for custom overlays or plugins aligned to the same scales.

## Capture & filenames

- **`captureChartRegionToPngDataUrl`** — Rasterize a DOM subtree (e.g. chart + axes).  
- **`buildChartSnapshotFileName`**, **`sanitizeChartSnapshotToken`**, **`contrastingFooterTextColor`** — Metadata and styling for snapshots.  
- **`ChartSnapshotMeta`** — Typed snapshot metadata.

## Live data merge (imperative)

- **`applyLiveDataMerge`** — Core merge used by the stage.  
- **`normalizeInterval`**, **`normalizeIntervals`**, **`dedupeByTimePreferLast`** — Hygiene utilities.

## Branding (optional DOM)

- **`ChartEdgeMark`** — Wordmark component for marketing chrome.  
- **`ChartEdgeAttribution`** — Optional footer attribution (default chart uses in-canvas watermark instead).  

## Drawing classes (extensions)

Concrete classes (`LineShape`, `RectangleShape`, …) are exported for tests or custom pipelines; most apps use **`DrawingSpec`** + **`addShape`**.

## Global styles

**`GlobalStyle`** from `chartedge` applies shell-wide CSS helpers used by `SimpleChartEdge`; embed when building a custom shell around `ChartEdgeStage`.

## IDs

**`generateDrawingShapeId`** — Create unique shape ids for specs.

## Deprecated

- `ChartStage` / `ChartStageProps` / `ChartStageHandle` — use `ChartEdgeStage*` names.

## Init process (summary)

1. React mounts the product or host component.  
2. `DEFAULT_GRAPH_OPTIONS` is deep-merged with your `chartOptions` prop (stable reference recommended).  
3. `intervalsArray` flows into stage state; visible range and price range are derived.  
4. Canvases allocate buffers; grid + series + optional histogram + watermark + drawings render.  
5. Ref handle attaches after mount — defer `applyLiveData` / `addShape` until ref is non-null (e.g. `requestAnimationFrame` or `useEffect`).

## Updating (summary)

| Concern | Mechanism |
|---------|-----------|
| Series | `intervalsArray` prop or `applyLiveData` / `addInterval` / index update |
| Styles | `chartOptions` prop (deep merge when content changes) or Settings modal |
| Drawings | Toolbar, or ref `addShape` / `patchShape` / `setDrawingsFromSpecs` |
| View | Pan/zoom UI, `fitVisibleRangeToData`, `redrawCanvas` |
