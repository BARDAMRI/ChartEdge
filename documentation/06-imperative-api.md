# Imperative API (ref handle)

Obtain a handle with `useRef<TickUpHostHandle>()` (or `TickUpHostHandle`) and attach `ref` to `TickUpCommand`, `TickUpHost`, etc.

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
| `nudgeVisibleTimeRangeToLatest(options?)` | If the last bar is past the right edge, pans the window by the minimum amount so it stays visible (keeps the same time span when possible). Optional `trailingPaddingSec`. No-op if the latest bar is already in view — useful for live streams without calling `fitVisibleRangeToData` every tick. |
| `getMainCanvasElement()` | Main OHLC `HTMLCanvasElement` (snapshots). |
| `getCanvasSize()` | `{ width, height, dpr }` (backing store pixels + DPR). |
| `clearCanvas()` | Clear off-screen buffers **and** clear the drawings list (shapes removed). |
| `redrawCanvas()` | Re-run the draw pipeline with current state (no data reload). |
| `reloadCanvas()` | Stage **reload** hook (rebinds view to current intervals / internal reload path). |
| `setEngine(engine)` | Merge a **`TickUpChartEngine`** patch (e.g. **`TickUpPrime`**, **`TickUpStandardEngine`**) into live **`chartOptions`**. Import engines from **`tickup`** or **`tickup/full`**. |
| `setInteractionMode(mode)` | Forwarded to the stage: same drawing modes as the package toolbar (`Mode` enum from **`tickup/full`**). |
| `deleteSelectedDrawing()` | Removes the currently selected shape on the stage (no-op if nothing selected). |

## Introspection

| Method | Description |
|--------|-------------|
| `getViewInfo()` | Intervals, drawings instances, visible time/price ranges, canvas size. On **`TickUpHost` / product refs**, this may be **`null`** until the inner stage is mounted — use optional chaining (`?.`) in `useEffect` or after layout. |
| `getDrawings(query?)` | `DrawingSnapshot[]` with optional `DrawingQuery` filter. |
| `getDrawingById(id)` | Single snapshot or null. |
| `getDrawingInstances(query?)` | Live `IDrawingShape[]` for advanced use. |
| `getChartContext()` | `ChartContextInfo`: symbol, chart type, theme, layout metrics, data window, drawing count, selection index, tick settings. May be `null` from the shell until the stage is ready. |

## Example: add and patch a line

```tsx
import { ShapeType, type TickUpHostHandle } from 'tickup/full';

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
