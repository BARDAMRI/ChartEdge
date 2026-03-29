# Props & chart options

## `TickUpHostProps` / `TickUpHostHandle`

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
| `symbol` | Controlled symbol string (toolbar input when the top bar is shown). |
| `defaultSymbol` | Initial symbol when `symbol` is **omitted** (uncontrolled). Ignored for display once `symbol` is passed. |
| `onSymbolChange` | Fired when the user edits the symbol in the **top bar** (Flow, Command, Desk). |
| `onSymbolSearch` | Search submit (button or Enter) when the top bar is present. Return **`false`** or **reject** the returned `Promise` if loading the symbol failed — the input reverts to the last successfully displayed ticker and **`onSymbolChange`** is invoked with that previous value so controlled state stays consistent. Return **`true`** or **`undefined`** on success. |
| `onRefreshRequest` | User hit Refresh in toolbar. |

**When the top bar is hidden** (e.g. **Pulse**, or `showTopBar: false` on `TickUpHost`):

- There is no editable symbol control; use React state and pass **`symbol`** (or **`defaultSymbol`** only) from the host.
- If the resolved text is non-empty (trimmed controlled value, else trimmed `defaultSymbol`), a **read-only symbol strip** is rendered above the chart. Empty string hides it.

`getChartContext()` still reports the same symbol metadata for introspection.

### Other

| Prop | Purpose |
|------|---------|
| `productId` | Lock layout to a tier (`pulse` \| `flow` \| `command` \| `desk` \| `prime`). |
| `showAttribution` | In-chart TickUp watermark (default true; forced on for Desk). Uses transparent bundled marks. |
| `licenseKey` | For **`productId: 'prime'`**: non-empty value hides the eval strip. |
| `themeVariant` | Shell **light** \| **dark** — when set, the host is **controlled**; keep it in sync with your app state and update from **`onThemeVariantChange`** when the user toggles theme in the toolbar. |
| `defaultThemeVariant` | Initial shell theme when **`themeVariant`** is omitted (uncontrolled). Default **`light`**. |
| `onThemeVariantChange` | Called when the user toggles light/dark from the settings toolbar; use with **`themeVariant`** for controlled mode or alone to observe toggles in uncontrolled mode. |

## `ChartOptions` structure (high level)

```ts
ChartOptions = {
  base: {
    engine?,             // 'standard' | 'prime' — canvas profile (see doc 15)
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
