# TickUp Charts — project roadmap

## Current reality (shipped)

The library on **`npm`** (`tickup` / `tickup/full`) already includes:

- **Vite + TypeScript** dual library build (ESM + CJS) and **`.d.ts`** via `tsc --emitDeclarationOnly`
- **Canvas 2D** main chart + **volume histogram**
- **Pan / zoom**, crosshair, candle tooltip, session shading (axes options)
- **Chart types:** candlestick, line, area, bar
- **Themes:** light / dark / grey + shell theme toggle
- **Drawings:** toolbar + full imperative API (`addShape`, `patchShape`, …)
- **Live data:** `applyLiveData` + pure merge helpers
- **Overlays:** `overlayKinds` / `overlays` (SMA, EMA, VWAP, Bollinger, …)
- **Product tiers (public docs):** Pulse, Flow, Command, Desk + **`TickUpHost`** for custom chrome
- **Settings modal**, i18n / RTL-aware formatting, symbol toolbar with failed-search **revert**
- **PNG** snapshot helpers, toolbar **CSV** export

## Possible next phases

- **Testing:** broaden **Jest** unit/integration coverage  
- **Indicators:** more built-in kinds or documented extension patterns  
- **Docs site:** optional VitePress (root README mentions this)  
- **Prime tier / engine:** collaborator runbook **[`../internal/tickup-prime-tier.md`](../internal/tickup-prime-tier.md)**  

## Non-goals / deferred

- **WebGL** as default renderer (Canvas 2D remains the core story)  
- **3D** charts  

Track concrete work in **GitHub issues**; integration truth remains **[`../../documentation/`](../../documentation/README.md)**.
