# Overlays and indicators

Technical indicator lines are drawn **on top of** the main series when overlays are enabled in chart options.

## Enable drawing

Set **`base.showOverlayLine`** to `true` (via `chartOptions` or defaults). Style defaults for stroke live under **`base.style.overlay`** (`lineColor`, `lineWidth`, `lineStyle`: solid | dashed | dotted).

## Two configuration styles

### 1. `base.overlays` — full control (`OverlayWithCalc[]`)

Each entry combines:

- **Style** — line color, width, style (merged with defaults).  
- **`calc`** — an `OverlayCalcSpec` describing the math (see below).  
- **`connectNulls`** (optional) — draw through gaps in computed values (default true in helpers).  
- **`useCenterX`** (optional) — plot at bar center vs edge (default true in helpers).

Build entries with exported helpers:

```ts
import {
  withOverlayStyle,
  OverlaySpecs,
  overlay,
  type OverlayWithCalc,
} from 'chartedge';

const overlays: OverlayWithCalc[] = [
  withOverlayStyle({ lineColor: '#ff9800', lineWidth: 2 })(OverlaySpecs.ema(12)),
  overlay(OverlaySpecs.sma(20), { lineColor: '#2962ff' }),
];
```

`OverlaySpecs` includes: `close`, `open`, `high`, `low`, `sma`, `ema`, `wma`, `vwap`, `bbandsMid`, `bbandsUpper`, `bbandsLower`.

### 2. `base.overlayKinds` — shorthand

An array of **`OverlayKind`** string keys (or calc specs in the type definition; the renderer maps kinds through the same `overlay()` factory with **default periods**, e.g. SMA/EMA/WMA period 20, Bollinger period 20 / stddev 2). Useful for quick demos; prefer **`overlays`** for explicit periods and prices.

## Calculation kinds (`OverlayCalcSpec`)

| Kind | Role |
|------|------|
| `OverlayPriceKey` (`close`, `open`, `high`, `low`) | Raw price series. |
| `sma`, `ema`, `wma` | Moving averages; `period` + optional `price` key. |
| `vwap` | Volume-weighted average price (uses interval volume when present). |
| `bbands_mid`, `bbands_upper`, `bbands_lower` | Bollinger mid/upper/lower; `period`, optional `stddev`, optional `price`. |

## Exported API (from `chartedge`)

| Export | Role |
|--------|------|
| `OverlaySpecs` | Factory for calc specs. |
| `withOverlayStyle` | Curried builder: shared style → many overlays. |
| `overlay(kindOrSpec?, style?, extras?)` | Single `OverlayWithCalc` with defaults. |
| `OverlayKind`, `OverlayPriceKey` | Enums. |
| Types: `OverlayWithCalc`, `OverlaySeries`, `OverlayOptions` | Typing and advanced use. |

Lower-level functions such as `computeSeriesBySpec`, `drawOverlays`, `drawOverlay` exist in source for maintainers; the **supported host integration path** is configuring **`chartOptions.base.overlays`** / **`overlayKinds`** and **`showOverlayLine`**.

## Chart types

Overlays are wired in **candlestick**, **line**, **area**, and **bar** draw paths when `showOverlayLine` is true.
