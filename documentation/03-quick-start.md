# Quick start

TickUp Charts is **React-first**: embed **`TickUpHost`**, **`TickUpStage`**, or product components (`TickUpCommand`, …). There is **no** imperative `TickUpCore(container)` class — use props + refs (e.g. **`TickUpHostHandle.setEngine(TickUpPrime)`** for the Prime engine). See [Prime engine & Pro roadmap](./15-prime-engine-and-pro-roadmap.md).

## 1. Render a product component

```tsx
import { useRef } from 'react';
import { TickUpCommand, type TickUpHostHandle } from 'tickup/full';

const sample = [
  { t: 1700000000, o: 100, h: 102, l: 99, c: 101, v: 1200 },
  { t: 1700000060, o: 101, h: 103, l: 100, c: 102, v: 900 },
];

export function App() {
  const chartRef = useRef<TickUpHostHandle>(null);

  return (
    <div style={{ height: 480, width: '100%' }}>
      <TickUpCommand
        ref={chartRef}
        intervalsArray={sample}
        defaultSymbol="DEMO"
      />
    </div>
  );
}
```

`TickUpCommand` is the full-trader layout. For a minimal plot only, use **`TickUpPulse`** (same props, different chrome). Pass **`symbol`** or **`defaultSymbol`** so the ticker appears in a **compact strip** above the chart (Pulse has no top-bar symbol field). See [Products & layout](./04-products-and-layout.md) and [Toolbar & interactions](./10-toolbar-and-interactions.md).

## 2. Give the chart a sized parent

The chart fills its container. Use explicit `height` (and usually `width` or flex) on a wrapper `div`.

## 3. Updating data from React state

Control the series with props:

```tsx
const [bars, setBars] = useState<Interval[]>(initial);

<TickUpCommand ref={chartRef} intervalsArray={bars} />;
```

When `intervalsArray` changes reference or content, the stage syncs. For streaming updates without replacing the whole array, prefer the **imperative** API below.

## 4. Imperative live updates

```tsx
const r = chartRef.current?.applyLiveData(
  { t: 1700000120, o: 102, h: 104, l: 101, c: 103, v: 1100 },
  'append'
);
if (r && !r.ok) console.warn(r.errors);
```

See [Data & live updates](./07-data-and-live-updates.md).

## 5. Optional: `chartOptions`

Pass a **stable** object (e.g. `useMemo`) so you do not reset internal UI state on every render:

```tsx
const options = useMemo(
  () => ({
    base: { showHistogram: true },
    axes: { yAxisPosition: AxesPosition.left, numberOfYTicks: 5 },
  }),
  []
);

<TickUpCommand chartOptions={options} intervalsArray={bars} />;
```

See [Props & chart options](./05-props-and-chart-options.md).

## Next

- [Products & layout](./04-products-and-layout.md) — choose the right tier  
- [Imperative API](./06-imperative-api.md) — full ref surface  
