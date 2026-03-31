# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- **Rebrand:** npm package **`tickup`** with React surface **`TickUp*`** (`TickUpStage`, `TickUpHost`, `TickUpCommand`, …). Bundles: `dist/tickup.{es,cjs}.js`, `dist/tickup-full.{es,cjs}.js`. Build env: `TICKUP_LIB_ENTRY`, `TICKUP_SKIP_OBFUSCATE`.
- **Prime:** `chartOptions.base.engine` (`standard` \| `prime`), **`TickUpPrime`** / **`TickUpStandardEngine`** exports, **`ref.setEngine`**, neon canvas + glass toolbars; **`TickUpPrimeTier`** (`productId: 'prime'`) replaces the previous licensed shell name.
- **Public release scope:** docs and the reference example emphasize **Pulse, Flow, Command, Desk**; Prime engine/tier are documented in **`documentation/15-prime-engine-and-pro-roadmap.md`**.
- Documentation shipped in the npm package under `documentation/` for offline / IDE browsing.
- Symbol search: `onSymbolSearch` may return `false` or reject to revert the toolbar to the last good symbol.
- **Advanced Interval Selection:** Categorized, searchable dropdown in the top bar; supports numerous timeframes (Intraday, Daily, Weekly, Monthly) with Portal-based rendering.
- **Data-feed handler:** `onIntervalSearch` callback for intercepting timeframe changes; supports asynchronous data replacement with built-in UI revert logic on failure.
- **Drawing API Extensions:** Added `getSelectedDrawing`, `getSelectedDrawingId`, `selectShape`, `unselectShape`, and `updateSelectedShape` to the imperative handle; `setInteractionMode(Mode)` now fully supports programmatically starting any interactive drawing tool.

## [0.1.0] - 2026

- Initial public release on npm: dual entry `tickup` and `tickup/full`, TypeScript declarations in `dist/`.
