# Toolbar & interactions

## Compact symbol strip (no top bar)

When **`showTopBar`** is **`false`**, there is no symbol text field in the toolbar. If the host passes a non-empty **`symbol`** (after trim) or, when `symbol` is omitted, a non-empty **`defaultSymbol`**, the stage renders a **single read-only row** above the plot showing that ticker. Styling follows **`chartOptions.base.style.axes`** (font, text color, line color for a bottom border) and **`base.style.backgroundColor`**.

- Used automatically by **`TickUpPulse`** when you set `symbol` / `defaultSymbol`.
- Same behavior for **`TickUpHost`** / **`TickUpStage`** with `showTopBar={false}`.

If the resolved string is empty, no strip is shown (minimal embed stays plot + axes only).

## Floating settings (no top bar)

If the stage is configured with **`showTopBar: false`** and **`showSettingsBar: true`**, a **floating gear** appears over the plot area (position depends on Y-axis side) to open the same settings modal. **Pulse** keeps **`showSettingsBar` false**, so there is no gear unless you use a custom host layout.

## Top bar (Flow, Command, Desk)

Typical controls (some may hide on very narrow widths):

| Control | Action |
|---------|--------|
| **Symbol** field | Edit ticker; Enter / search button triggers `onSymbolSearch` if provided. |
| **Search** | Focus/select symbol or run `onSymbolSearch`. If the handler returns **`false`** or a **rejected Promise**, the field reverts to the last good symbol and `onSymbolChange` runs with that value (see [Props & chart options](./05-props-and-chart-options.md)). |
| **Chart type** | Dropdown: Candlestick, Line, Area, Bar (menu is portaled for correct hit-testing). |
| **Settings** | Opens [settings modal](./09-settings-modal.md). |
| **Snapshot** | Captures chart region or main canvas to PNG (implementation may use `captureChartRegionToPngDataUrl`). |
| **Range** | `fitVisibleRangeToData`. |
| **Export** | CSV download of series. |
| **Refresh** | `onRefreshRequest` callback. |
| **Theme** | Toggles **shell** light/dark (**`GlobalStyle`**, settings modal chrome). Notify the app via **`onThemeVariantChange`** on **`TickUpHost`**; keep **`themeVariant`** controlled in sync. Plot styling still follows **`chartOptions`** — align **`base.theme`** (and use **`getTickUpPrimeThemePatch`** / **`createTickUpPrimeEngine`** for Prime) so grid, axes, and watermarks match. See [Props & chart options](./05-props-and-chart-options.md) and [Prime engine](./15-prime-engine-and-pro-roadmap.md). |

## Pan & zoom

With default mode (no draw tool active), wheel and drag behaviors follow the chart stage configuration (pan/zoom on the main plot). **Select** and **edit** modes use a **default** cursor and intentionally **do not** pan on drag so clicks hit-test shapes. Drawing modes use crosshair/drag semantics appropriate to the tool.

## Crosshair & tooltip

When enabled in options or settings:

- **Crosshair** — Vertical and horizontal lines following the pointer.  
- **Crosshair values** — Time label near the bottom track, price label near the Y-axis side.  
- **Candle tooltip** — Compact OHLC / change / volume panel (grid layout on small charts; scrollable cap).

Branding: low-opacity **TickUp watermark** (bundled **transparent** PNGs; strength depends on plot **`base.theme`**) is drawn inside the plot/histogram buffers (not a separate footer), unless disabled via **`showAttribution`** (**Desk** forces on).

## Keyboard

- **Escape** — Clears in-progress polyline points, exits active draw tools (except select/edit), and returns toward neutral navigation.

## Canvas stack (conceptual)

From back to front: main OHLC (and grid, session shading, watermark), optional histogram, persistent drawings layer, interaction/hover/crosshair layer. Histogram opacity and height ratio come from `chartOptions.base.style.histogram`.

## Copy

Selected axis or formatted numbers may normalize to clipboard-friendly representation when copying from the app (formatting service integration).
