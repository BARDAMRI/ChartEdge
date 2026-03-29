# Runbook: TickUp Prime tier & engine (collaborators)

## Tier (`TickUpPrimeTier`)

- **Component:** `src/components/TickUpProducts.tsx` — `TickUpPrimeTier` → `TickUpHost` with `productId="prime"`.
- **Eval strip:** `src/components/TickUpHost.tsx` when `productId === 'prime' && !licenseKey`.
- **Exports:** `src/full.ts` — `TickUpPrimeTier`, `TickUpPrimeTierProps`.
- **Product id:** `src/types/tickupProducts.ts` — `'prime'` in `TickUpProductId`.

## Engine (`TickUpPrime`)

- **Patch:** `src/engines/prime/TickUpPrime.ts` — `getChartOptionsPatch()` sets `base.engine: 'prime'` and neon styling.
- **Runtime:** `ref.setEngine(TickUpPrime)` on `TickUpHostHandle` merges the patch into live options.
- **Canvas:** `isPrimeEngine` in `PrimeRenderer.ts` drives glow, crosshair, watermark placement in `GraphDraw` / `ChartCanvas`.

## Reference example

To demo the Prime tier in `example/`, add `'prime'` to tier keys and a row that renders `TickUpPrimeTier` (mirror Command). To demo the engine only, pass `chartOptions={{ base: { engine: 'prime' } }}` or call `setEngine` from a ref effect.
