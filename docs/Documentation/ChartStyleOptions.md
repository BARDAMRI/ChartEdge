# Chart options & styles (legacy page)

> **Authoritative reference:** **[`../../documentation/05-props-and-chart-options.md`](../../documentation/05-props-and-chart-options.md)** and **[`../../documentation/12-overlays-and-indicators.md`](../../documentation/12-overlays-and-indicators.md)**.  
> **Default values:** **`src/components/DefaultData.ts`** (`DEFAULT_GRAPH_OPTIONS`, style blocks).

The tables below described an **older, flat** shape. The shipped type is **`ChartOptions`** with a **`base`** object and top-level **`axes`**:

```ts
ChartOptions = {
  base: {
    chartType,           // Candlestick | Line | Area | Bar
    theme,               // 'light' | 'dark' | 'grey' | string
    showOverlayLine,
    showHistogram,
    showCrosshair,
    showCrosshairValues,
    showCandleTooltip,
    style: {
      candles, line, area, bar, histogram, grid, overlay, axes, drawings,
      showGrid,
      backgroundColor,
    },
    overlays?,           // explicit overlay series + calc
    overlayKinds?,       // SMA, EMA, VWAP, Bollinger, …
  },
  axes: {
    yAxisPosition,       // enum AxesPosition
    currency,
    numberOfYTicks,
  },
};
```

Axis **locale**, **timezone**, **trading sessions**, **holidays**, etc. live under **`base.style.axes`** (see i18n doc).

## Example (deep partial, as apps usually pass)

```tsx
import { AxesPosition, ChartType } from 'tickup';

const chartOptions = {
  base: {
    chartType: ChartType.Candlestick,
    theme: 'light',
    showHistogram: true,
    showCrosshair: true,
    style: {
      showGrid: true,
      backgroundColor: '#ffffff',
      grid: { lineColor: '#e0e0e0', lineWidth: 1, gridSpacing: 50, lineDash: [] },
      candles: {
        bullColor: '#26a69a',
        bearColor: '#ef5350',
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderColor: '#333333',
        borderWidth: 1,
        bodyWidthFactor: 0.6,
        spacingFactor: 0.2,
      },
    },
  },
  axes: {
    yAxisPosition: AxesPosition.left,
    numberOfYTicks: 5,
  },
};
```

---

## Deprecated flat tables (do not use as schema)

The following sections are **retained only for keyword search**. Field names and nesting **do not** match `ChartOptions` today.

<details>
<summary>Old flat outline (obsolete)</summary>

| Section (obsolete) | Notes |
|--------------------|--------|
| backgroundColor | Now under `base.style.backgroundColor` |
| grid | `base.style.grid` |
| axes | `base.style.axes` + `ChartOptions.axes` for y ticks / side |
| candles | `base.style.candles` |
| lineOverlay | Use `base.style.overlay` + `base.showOverlayLine` / overlays |
| padding | Not a top-level `ChartOptions` field in current API |

</details>
