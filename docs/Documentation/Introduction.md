# Introduction

TickUp Charts is a **React** charting library for **financial OHLCV** data: Canvas **2D** rendering, pan/zoom, histogram, overlays (SMA, EMA, VWAP, Bollinger, …), drawings (toolbar + imperative API), a settings modal, and **live data** merge (`applyLiveData`).

## Stack

- **React** 18+ and **styled-components** 6.x (peer dependencies)
- **TypeScript** (`strict`), **Vite** library build
- Published on npm as **`tickup`** (canvas-focused API) and **`tickup/full`** (full shell + product tiers)

## Public product line (documented)

| Component | Role |
|-----------|------|
| **`TickUpPulse`** | Minimal embed: plot + axes; optional read-only **symbol strip** when there is no top bar |
| **`TickUpFlow`** | Top bar (symbol, chart type, settings, export, …); no drawing sidebar |
| **`TickUpCommand`** | Full trader UI: drawing sidebar + top bar |
| **`TickUpDesk`** | Same chrome as Command; in-chart **watermark** always on |
| **`TickUpHost`** / **`TickUpHost`** | Custom chrome when **`productId`** is omitted |
| **`TickUpStage`** + **`ModeProvider`** | Low-level stage (`tickup` default entry) for custom layouts |

Use **`TickUpStage`** from **`tickup`** when you own all surrounding UI; use **`tickup/full`** for the shells above.

## Where to read next

- **Authoritative integration guides:** [`../../documentation/README.md`](../../documentation/README.md) (also shipped inside the npm package under `documentation/`).
- **Example app:** [`../../example/README.md`](../../example/README.md) (not published to npm).

This `docs/` tree is **supplementary** (vision, architecture sketches, legacy stubs). For props, ref API, and live data, prefer **`documentation/`**.
