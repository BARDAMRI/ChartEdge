# Prime render engine & Pro roadmap

## Prime vs standard

- **`chartOptions.base.engine`** — `'standard'` (default) or **`'prime'`**. Prime enables neon-oriented styling, gradient crosshair / target ring (standard canvas path), and **glass** drawing and settings toolbars when the engine is prime.
- **Dark Prime (default patch)** — **`TickUpPrime`**: dark plot (`base.theme: 'dark'`), cyan grid tint, light axis labels, **`rgba(15, 18, 25, 0.7)`** toolbars + `backdrop-filter`, in-plot watermark **bottom-right** on the main canvas (opacity scales with theme; higher on dark backgrounds). **Standard** engine uses **top-right** for the same mark — implementation detail in the renderer.
- **Light Prime** — **`getTickUpPrimeThemePatch('light')`** or **`createTickUpPrimeEngine('light')`**: `base.theme: 'light'`, white plot background, cyan-tinted grid, dark axis text, same bull/bear accent vocabulary; toolbars use **light frosted glass** (white/translucent surfaces, violet borders) instead of the dark glass sheet.

Exports ( **`tickup`** and **`tickup/full`** ):

| Symbol | Role |
|--------|------|
| **`TickUpPrime`** | `TickUpChartEngine` — **`getChartOptionsPatch()`** returns the **dark** Prime profile. |
| **`getTickUpPrimeThemePatch(theme)`** | `'light' \| 'dark'` → **`DeepPartial<ChartOptions>`** for merging into **`chartOptions`**. |
| **`createTickUpPrimeEngine(theme)`** | `TickUpChartEngine` factory for **`ref.setEngine(...)`** with the same light/dark patch. |
| **`TickUpStandardEngine`** | Resets toward library default **standard** light styling. |

**Important:** If you call **`ref.setEngine(TickUpPrime)`** while the host is **light**, the dark Prime patch will overwrite light chart styling until the next **`chartOptions`** merge. For theme switching, use **`createTickUpPrimeEngine('light' | 'dark')`** and/or merge **`getTickUpPrimeThemePatch(theme)`** into **`chartOptions`** so props and **`setEngine`** agree.

## Toolbar chrome with Prime

- When **`base.engine === 'prime'`** and **`base.theme === 'dark'`**, drawing and settings toolbars use **dark** glass (existing behavior).
- When **`base.engine === 'prime'`** and **`base.theme === 'light'`**, they use **light** glass so controls remain readable on light shells.

Implementation note: canvas watermarks use **`chartOptions.base.theme`** (via stage **`brandTheme`**) to pick **light** vs **dark** transparent mark assets; opacity is slightly higher on dark plots so the mark stays visible.

## Prime **tier** (`TickUpPrimeTier`)

**`TickUpPrimeTier`** (`productId: 'prime'`) is the same chrome as **Command**. Without **`licenseKey`**, an evaluation strip is shown. This is separate from the **Prime engine** profile — you may combine **Command + `setEngine(TickUpPrime)`**, **Prime tier + standard engine**, or **Prime tier + `createTickUpPrimeEngine('light')`**, etc.

## Pro features (planned / partial)

The following are **targets** for future releases; verify the current API before relying on them in production:

- **Drawings:** Fibonacci retracement, dedicated trend-angle tool, long/short position overlays with PnL.
- **Indicators:** Ichimoku cloud, volume profile (vertical histogram on the price axis).

Track progress in the repository roadmap and issues.
