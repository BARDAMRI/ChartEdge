# Imperative API (ref handle)

Obtain a handle with `useRef<SimpleChartEdgeHandle>()` (or `ChartEdgeHostHandle`) and attach `ref` to `ChartEdgeCommand`, `ChartEdgeHost`, etc.

## Drawings

| Method | Description |
|--------|-------------|
| `addShape(shape)` | Add from `DrawingSpec` or a shape instance (`DrawingInput`). |
| `updateShape(shapeId, newShape)` | Replace with full spec/instance or apply a `DrawingPatch` (see `isDrawingPatch`). |
| `patchShape(shapeId, patch)` | `DrawingPatch` only: style, points, symbol/size for custom symbols. |
| `deleteShape(shapeId)` | Remove by id. |
| `setDrawingsFromSpecs(specs)` | Replace stack from `DrawingSpec[]`. |

Helpers exported from the package: `drawingFromSpec`, `applyDrawingPatch`, `isDrawingPatch`.

## Intervals (series)

| Method | Description |
|--------|-------------|
| `addInterval(interval)` | Append a bar; series is kept sorted by `t`. |
| `updateInterval(index, interval)` | Replace bar at **0-based index** in the current sorted series. |
| `deleteInterval(index)` | Remove bar at **0-based index**. |
| `applyLiveData(updates, placement)` | Preferred for streaming and time-keyed upserts; see [Data & live updates](./07-data-and-live-updates.md). |

Resolve an index with `getViewInfo()?.intervals.findIndex(...)`. For time-based edits, prefer **`mergeByTime`** in `applyLiveData`.

## View & canvas

| Method | Description |
|--------|-------------|
| `fitVisibleRangeToData()` | Fit visible time range to loaded data. |
| `getMainCanvasElement()` | Main OHLC `HTMLCanvasElement` (snapshots). |
| `getCanvasSize()` | `{ width, height, dpr }` (backing store pixels + DPR). |
| `clearCanvas()` | Clear off-screen buffers **and** clear the drawings list (shapes removed). |
| `redrawCanvas()` | Re-run the draw pipeline with current state (no data reload). |
| `reloadCanvas()` | Stage **reload** hook (rebinds view to current intervals / internal reload path). |

## Introspection

| Method | Description |
|--------|-------------|
| `getViewInfo()` | Intervals, drawings instances, visible time/price ranges, canvas size. |
| `getDrawings(query?)` | `DrawingSnapshot[]` with optional `DrawingQuery` filter. |
| `getDrawingById(id)` | Single snapshot or null. |
| `getDrawingInstances(query?)` | Live `IDrawingShape[]` for advanced use. |
| `getChartContext()` | `ChartContextInfo`: symbol, chart type, theme, layout metrics, data window, drawing count, selection index, tick settings. |

## Example: add and patch a line

```tsx
import { ShapeType, type SimpleChartEdgeHandle } from 'chartedge';

ref.current?.addShape({
  type: ShapeType.Line,
  points: [
    { time: t0, price: p0 },
    { time: t1, price: p1 },
  ],
  style: { lineColor: '#ff00aa', lineWidth: 2 },
});

ref.current?.patchShape('some-id', {
  style: { lineWidth: 3 },
});
```

After `addShape`, read the new id via `getDrawings()` (last / highest `zIndex`) or pass an explicit `id` in `DrawingSpec`.
