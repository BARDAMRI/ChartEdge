# Settings modal

The gear icon in the top toolbar (when enabled) opens the **Chart Settings** modal. Values apply to the current chart instance and merge into internal `chartOptions` state on **Save**.

## Categories

| Category | What users can change |
|----------|------------------------|
| **Chart Style** | Histogram on/off, grid on/off, **hover**: candle tooltip, crosshair lines, crosshair time & price labels |
| **Axes** | Y-axis side (left/right), number of Y ticks |
| **Time** | 12-hour vs 24-hour time display |
| **Layout** | Show side toolbar, show top bar (hidden when product chrome is **locked** by `productId`) |
| **Colors** | Background, axis text, bull/bear (and related histogram/bar colors), line chart color |
| **Drawing shapes** | Default line/fill/selection styles for new drawings |
| **Regional** | Locale, language (with sensible defaults linkage) |
| **Financial** | Currency code, use-currency toggle, currency display mode, number notation, tick size, min/max fraction & significant digits, auto precision, unit + placement |

## Locked layout (product tiers)

For `TickUpPulse`, `TickUpFlow`, `TickUpCommand`, and `TickUpDesk`, toolbar visibility is fixed by the product. The Layout section either hides the toggles or explains that chrome is product-controlled (`lockToolbarLayout` on the modal).

## Persistence

The modal does **not** persist to `localStorage` by default. The host app can:

- Read merged options from `getChartContext()` / custom hooks, or  
- Re-hydrate `chartOptions` prop on next mount from your own store.

## Related options in code

Several toggles map to `chartOptions.base` and `base.style`:

- `showCandleTooltip`, `showCrosshair`, `showCrosshairValues`  
- `showHistogram`, `showGrid`  
- Axes, colors, drawings defaults as described in [Props & chart options](./05-props-and-chart-options.md).
