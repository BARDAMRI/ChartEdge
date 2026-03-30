# Runbook: TickUp Prime tier & engine (collaborators)

## Tier (`TickUpPrimeTier`)

- **Component:** `src/components/TickUpProducts.tsx` — `TickUpPrimeTier` → `TickUpHost` with `productId="prime"`.
- **Eval strip:** `src/components/TickUpHost.tsx` when `productId === 'prime' && !licenseKey`.
- **Exports:** `src/full.ts` — `TickUpPrimeTier`, `TickUpPrimeTierProps`.
- **Product id:** `src/types/tickupProducts.ts` — `'prime'` in `TickUpProductId`.

## Engine (`TickUpPrime`)

- **Patch:** `src/engines/prime/TickUpPrime.ts` — `TickUpPrime.getChartOptionsPatch()` sets `base.engine: 'prime'` and the **dark** neon plot. **`getTickUpPrimeThemePatch('light' | 'dark')`** and **`createTickUpPrimeEngine(theme)`** align Prime with the host; light Prime uses **`base.theme: 'light'`** and light frosted toolbars in the stage.
- **Runtime:** `ref.setEngine(TickUpPrime)` or `ref.setEngine(createTickUpPrimeEngine('light'))` on `TickUpHostHandle` merges the patch into live options.
- **Canvas:** `isPrimeEngine` in `PrimeRenderer.ts` drives glow, crosshair, watermark placement in `GraphDraw` / `ChartCanvas`.

## Reference example

To demo the Prime tier in `example/`, add `'prime'` to tier keys and a row that renders `TickUpPrimeTier` (mirror Command). To demo the engine only, pass `chartOptions={{ base: { engine: 'prime' } }}` or call `setEngine` from a ref effect.
