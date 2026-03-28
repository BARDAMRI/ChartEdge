# Internationalization, axes, and sessions

## Locale and language

Axis labels, dates, and many settings strings follow **`chartOptions.base.style.axes`**:

| Field | Role |
|-------|------|
| `locale` | BCP 47 tag (e.g. `en-US`, `he-IL`). Drives date/number formatting and default direction. |
| `language` | UI language key for built-in labels (toolbar tooltips, settings, etc.). |

The in-app **Settings → Regional** category updates these fields. The library ships multiple locale presets (decimal/thousands separators, date patterns, default currency, **RTL** vs LTR) in internal locale tables.

### RTL

When the active locale defaults specify `direction: 'rtl'`, toolbar and settings layout flip appropriately (`dir` on toolbars/modals).

## Numeric and currency display

Axes support:

- Fraction digits, min/max significant digits, `tickSize`, `autoPrecision`  
- `currency`, `useCurrency`, `currencyDisplay`  
- `numberNotation`: `standard` | `scientific` | `compact`  
- `unit` / `unitPlacement`  
- Optional **`displayCurrency`** / **`conversionRate`** for converted display (host-defined semantics)

## Time axis

- **`timezone`** — string such as `UTC` or `America/New_York` for session logic and labeling where used.  
- **`dateFormat`** — pattern consumed by the formatting layer.  
- Shell prop **`initialTimeFormat12h`** and settings **12-hour toggle** affect time presentation.  
- **`TimeDetailLevel`** (`Auto` / `Low` / `Medium` / `High`) controls tick density (prop `initialTimeDetailLevel`).

## Trading sessions and holidays

`axes` options include:

- **`tradingSessions`** — array of `{ dayOfWeek, start, end }` with `start`/`end` as `'HH:mm'` strings; used to **shade off-session** periods on the chart.  
- **`holidays`** — ISO `YYYY-MM-DD` strings for calendar context (where integrated).  
- **`exchange`** — display/metadata string.

## Grid and background

- **`base.style.showGrid`** — toggles grid lines (`grid` sub-style: colors, dash, spacing).  
- **`base.style.backgroundColor`** — plot background.

## Y axis layout

- **`axes.yAxisPosition`** — `AxesPosition.left` or `.right`.  
- **`axes.numberOfYTicks`** — count (also `initialNumberOfYTicks` on the shell).  
- **`initialYAxisWidth`** / **`initialXAxisHeight`** — layout hints passed into the stage.

## Clipboard (shell behavior)

When users copy selected text, the host shell may **normalize** numbers to a canonical plain form using the same axis parsing rules (implemented inside the chart app wrapper). This is a UX nicety for spreadsheets, not a separate public API export.
