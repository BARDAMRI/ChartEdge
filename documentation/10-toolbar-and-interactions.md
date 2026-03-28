# Toolbar & interactions

## Top bar (Flow, Command, Desk, Apex)

Typical controls (some may hide on very narrow widths):

| Control | Action |
|---------|--------|
| **Symbol** field | Edit ticker; Enter / search button triggers `onSymbolSearch` if provided. |
| **Search** | Focus/select symbol or run `onSymbolSearch`. |
| **Chart type** | Dropdown: Candlestick, Line, Area, Bar (menu is portaled for correct hit-testing). |
| **Settings** | Opens [settings modal](./09-settings-modal.md). |
| **Snapshot** | Captures chart region or main canvas to PNG (implementation may use `captureChartRegionToPngDataUrl`). |
| **Range** | `fitVisibleRangeToData`. |
| **Export** | CSV download of series. |
| **Refresh** | `onRefreshRequest` callback. |
| **Theme** | Toggles shell light/dark (merges dark-friendly colors into chart). |

## Pan & zoom

With default mode (no draw tool active), wheel and drag behaviors follow the chart stage configuration (pan/zoom on the main plot). Drawing modes disable pan so clicks commit to shapes.

## Crosshair & tooltip

When enabled in options or settings:

- **Crosshair** — Vertical and horizontal lines following the pointer.  
- **Crosshair values** — Time label near the bottom track, price label near the Y-axis side.  
- **Candle tooltip** — Compact OHLC / change / volume panel (grid layout on small charts; scrollable cap).

Branding: low-opacity **ChartEdge watermark** is drawn inside the plot/histogram buffers (not a separate footer), unless disabled via `showAttribution` (Desk forces on).

## Keyboard

- **Escape** cancels in-progress polyline / exits certain draw modes (see `ChartCanvas` behavior).

## Copy

Selected axis or formatted numbers may normalize to clipboard-friendly representation when copying from the app (formatting service integration).
