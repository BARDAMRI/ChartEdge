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
| `replace` | Replace series with normalized incoming set. |
| `append` | Add new bars after existing (sorted/validated internally). |
| `prepend` | Add before existing. |
| `mergeByTime` | Upsert by timestamp; overlapping `t` updates in place. |

Returns **`LiveDataApplyResult`**: `{ ok, intervals, errors, warnings }`. Always check `ok` and surface `errors` in production.

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
