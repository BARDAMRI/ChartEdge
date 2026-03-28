# Data & live updates

## `Interval` shape

```ts
interface Interval {
  t: number; // unix seconds
  o: number;
  c: number;
  l: number;
  h: number;
  v?: number;
}
```

Times are **seconds**, not milliseconds.

## React prop: `intervalsArray`

Supply the full series from parent state. When the array reference or backing data changes, the chart updates.

For high-frequency streaming, prefer **`applyLiveData`** on the ref to avoid reallocating huge arrays on every tick.

## `applyLiveData(updates, placement)`

- **updates** — Single `Interval` or `Interval[]`.  
- **placement** — `LiveDataPlacement`:

| Value | Behavior (conceptual) |
|-------|------------------------|
| `replace` | Replace series with normalized incoming set. Fails `ok` if incoming is empty after validation. |
| `append` | Append only bars with `t` ≥ last bar’s `t`; same `t` replaces the last bar; earlier times produce **warnings** and are skipped. |
| `prepend` | Prepend only bars with `t` ≤ first bar’s `t`; same `t` replaces the first bar; later times produce **warnings** and are skipped. |
| `mergeByTime` | Concatenate, sort by `t`, then **dedupe by time** (last row wins per timestamp). |

**Existing** series is normalized on merge; invalid base rows add to `errors`. Incoming rows go through **`normalizeIntervals`** (OHLC clamping, bad volume dropped, low/high swap notes in `warnings`).

Returns **`LiveDataApplyResult`**: `{ ok, intervals, errors, warnings }`. Always check `ok` and surface `errors` in production; inspect `warnings` for skipped bars or clamping.

## Normalization utilities (exported)

From `chartedge`:

- **`normalizeInterval`** — Validate/clamp one partial row; returns `{ value, notes }`.  
- **`normalizeIntervals`** — Batch version; `errors` / `warnings` arrays.  
- **`dedupeByTimePreferLast`** — Collapse duplicate `t`.  
- **`applyLiveDataMerge`** — Lower-level merge helper used by the stage.

Use these server-side or before calling `applyLiveData` if you need consistent cleaning.

## Refresh toolbar action

`onRefreshRequest` fires when the user chooses Refresh. Reload your feed, set new `intervalsArray`, or call `reloadCanvas` / `fitVisibleRangeToData` as needed.

## Pitfalls

- Do not pass a **new literal** `chartOptions={{}}` every render without `useMemo`; see [Props & chart options](./05-props-and-chart-options.md).  
- Ensure `t` is monotonic where your feed requires it; merge modes handle ordering differently.
