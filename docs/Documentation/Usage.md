# Basic usage

TickUp Charts is **not** a vanilla `ChartManager` constructor. You render **React components** and pass **OHLCV intervals** (`Interval`: unix **`t`** in **seconds**, `o`/`h`/`l`/`c`, optional `v`).

## Full shell (typical)

From **`tickup/full`**:

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
      <TickUpCommand
        ref={ref}
        intervalsArray={data}
        symbol="DEMO"
        onSymbolChange={(s) => console.log('symbol', s)}
        onSymbolSearch={(s) => {
          /* return false or reject Promise to revert toolbar on failure */
        }}
      />
    </div>
  );
}
```

Swap **`TickUpCommand`** for **`TickUpPulse`**, **`TickUpFlow`**, or **`TickUpDesk`** as needed.

## Canvas-only stage

From **`tickup`** — you must wrap with **`ModeProvider`** and supply all **`TickUpStage`** props (see types and **[`../../documentation/11-exports-and-advanced.md`](../../documentation/11-exports-and-advanced.md)**):

```tsx
import { TickUpStage, ModeProvider } from 'tickup';
import type { ChartOptions, DeepRequired } from 'tickup';
// Build merged chartOptions (see documentation/05-props-and-chart-options.md)
```

## Live updates

Prefer the ref API **`applyLiveData(updates, placement)`** with **`mergeByTime`**, **`append`**, etc. See **[`../../documentation/07-data-and-live-updates.md`](../../documentation/07-data-and-live-updates.md)**.

## Visible time and price (ref API)

After pan/zoom, read the same windows the chart uses for mapping:

- **`getVisibleRanges()`** → **`VisibleViewRanges`**: `time.start` / `time.end` (unix **seconds**), `time.startIndex` / `time.endIndex` in the sorted series, and `price.min` / `price.max` / `price.range` for the Y scale.
- **`getCanvasSize()`** → main plot backing-store size + DPR.

From a product shell, the ref may be **`null`** until the stage mounts — use optional chaining. Full detail and examples: **[`../../documentation/06-imperative-api.md`](../../documentation/06-imperative-api.md)**.

## Further reading

- **[Quick start](../../documentation/03-quick-start.md)**
- **[Imperative API](../../documentation/06-imperative-api.md)**
- **[Props & chart options](../../documentation/05-props-and-chart-options.md)**

The legacy snippet that referenced **`ChartManager`** is removed — it never matched the shipped API.
