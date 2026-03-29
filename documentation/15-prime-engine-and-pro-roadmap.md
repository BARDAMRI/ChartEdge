# Prime render engine & Pro roadmap

## Prime vs standard

- **`chartOptions.base.engine`** — `'standard'` (default) or **`'prime'`**. Prime applies a neon-oriented dark palette, subtle candle glow, gradient crosshair with a target ring, bottom-right watermark at ~15% opacity, and glass-style toolbars (`rgba(15, 18, 25, 0.7)` + `backdrop-filter: blur(12px)`).
- **`TickUpPrime` / `TickUpStandardEngine`** — exported from **`tickup`** and **`tickup/full`**. Merge via `chartOptions` or at runtime with **`ref.setEngine(TickUpPrime)`** on **`TickUpHostHandle`** (deep-merges the engine patch into live options).

## Prime **tier** (`TickUpPrimeTier`)

**`TickUpPrimeTier`** (`productId: 'prime'`) is the same chrome as **Command**. Without **`licenseKey`**, an evaluation strip is shown. This is separate from the **Prime engine** profile above—you can use Command + `setEngine(TickUpPrime)` or Prime tier + standard engine if you choose.

## Pro features (planned / partial)

The following are **targets** for future releases; verify the current API before relying on them in production:

- **Drawings:** Fibonacci retracement, dedicated trend-angle tool, long/short position overlays with PnL.
- **Indicators:** Ichimoku cloud, volume profile (vertical histogram on the price axis).

Track progress in the repository roadmap and issues.
