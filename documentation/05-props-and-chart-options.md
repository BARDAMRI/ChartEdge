# Props & chart options

## `SimpleChartEdgeProps` / `ChartEdgeHostProps`

### Data & view

| Prop | Purpose |
|------|---------|
| `intervalsArray` | OHLCV series (`Interval[]`). Default `[]`. |
| `initialVisibleTimeRange` | Optional `TimeRange` (`start`/`end` unix seconds). |
| `initialNumberOfYTicks` | Default Y tick count (default 5). |
| `initialXAxisHeight` | X axis height hint (pixels). |
| `initialYAxisWidth` | Y axis width hint (pixels). |
| `initialTimeDetailLevel` | `TimeDetailLevel` for axis time density. |
| `initialTimeFormat12h` | 12h vs 24h time formatting. |

### `chartOptions` (deep partial merge)

Type: `DeepPartial<ChartOptions>`. Merged with library defaults (`DEFAULT_GRAPH_OPTIONS`). **Important:** pass a **stable reference** (`useMemo`) when the object does not meaningfully change, so internal state (e.g. chart type from the toolbar) is not overwritten by a new empty `{}` every render.

When you **do** change options intentionally, any deep change triggers a merge into current state.

### Layout (only without `productId`)

| Prop | Purpose |
|------|---------|
| `showSidebar` | Drawing tools column. |
| `showTopBar` | Symbol + chart controls row. |
| `showSettingsBar` | Gear and related controls in the top cluster. |

### Toolbar / host hooks

| Prop | Purpose |
|------|---------|
| `symbol` | Controlled symbol string. |
| `defaultSymbol` | Uncontrolled initial symbol. |
| `onSymbolChange` | Symbol field changes. |
| `onSymbolSearch` | Search submit (button or Enter). |
| `onRefreshRequest` | User hit Refresh in toolbar. |

### Other

| Prop | Purpose |
|------|---------|
| `productId` | Lock layout to a tier (`pulse` \| `flow` \| `command` \| `desk` \| `apex`). |
| `showAttribution` | In-chart ChartEdge watermark (default true; forced on for Desk). |
| `licenseKey` | Apex licensing hook. |

## `ChartOptions` structure (high level)

```ts
ChartOptions = {
  base: {
    chartType,           // Candlestick | Line | Area | Bar
    theme,
    showOverlayLine,
    showHistogram,
    showCrosshair,       // hover cross lines
    showCrosshairValues, // time/price labels on crosshair
    showCandleTooltip,   // OHLC hover panel
    style: { candles, line, area, bar, histogram, grid, overlay, axes, drawings, showGrid, backgroundColor },
    overlays?, overlayKinds?,
  },
  axes: { yAxisPosition, currency, numberOfYTicks },
};
```

### Interaction flags (`base`)

- **`showCrosshair`** — Vertical + horizontal guide lines in default navigation mode.  
- **`showCrosshairValues`** — Labels for cursor time (along bottom) and price (along Y-axis side). Requires crosshair enabled.  
- **`showCandleTooltip`** — Corner panel with date, O/H/L/C, change, volume.

These can be toggled from the **Settings** modal (Chart Style → Hover) when using the full shell.

### Axes & formatting

Under `base.style.axes`: locale, language, decimals, currency, date format, timezone, **trading sessions**, **holidays**, exchange, notation, tick size, conversion/display currency fields, etc. See [i18n & axes](./13-internationalization-and-axes.md).

### Overlays / indicators

- **`base.showOverlayLine`** — Master switch for drawing indicator lines on the plot.  
- **`base.overlays`** — `OverlayWithCalc[]` (recommended for explicit periods).  
- **`base.overlayKinds`** — Shorthand list of kinds with library default parameters.

See [Overlays & indicators](./12-overlays-and-indicators.md).

### Drawings default style

Under `base.style.drawings`: line color, width, line style, fill, and **selected** state styling.

See also existing reference: [`docs/Documentation/ChartStyleOptions.md`](../docs/Documentation/ChartStyleOptions.md) if present for extra detail; defaults live in `src/components/DefaultData.ts`.
