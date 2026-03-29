# TickUp Charts — system requirements

## 1. Purpose

Deliver fast, interactive **React** charts for trading and analytics: OHLCV on **HTML5 Canvas 2D**, optional volume histogram, drawings, overlays, and streaming updates.

## 2. Runtime & framework

| Requirement | Detail |
|-------------|--------|
| **Node** | >= 18 (see root `package.json` **`engines`**) |
| **React** | 18+ or 19+ (**peer**) |
| **React DOM** | Matching major (**peer**) |
| **styled-components** | 6.x (**peer**) |
| **Browsers** | Modern evergreen (Chrome, Firefox, Safari, Edge) |

## 3. Technical stack (repository)

| Area | Choice |
|------|--------|
| Language | **TypeScript** (`strict`) |
| Build | **Vite** (library mode), **TypeScript** declaration emit |
| UI styling | **styled-components** + chart options-driven colors |
| Unit tests | **Jest** (see root `npm test`) |
| Bundled deps | e.g. **date-fns**, **lucide-react** (see `package.json` **`dependencies`**) |

## 4. Functional capabilities (current)

- Line / candlestick / area / bar; pan & zoom; crosshair & tooltip  
- Volume histogram; grid; light/dark/grey theming  
- Drawings (toolbar + API); settings modal  
- Live **`applyLiveData`**; overlay indicators  
- Tiered shells: **Pulse, Flow, Command, Desk** (+ **Host** / **Stage** for custom layouts)

## 5. Non-functional

- Target smooth interaction on typical desktop dashboards; very large series depend on device and bar count  
- **Tree-shaking** friendly ESM entry (`tickup` vs `tickup/full`)  
- Public API typed with **`.d.ts`** published under `dist/`

## 6. Limitations

- **2D Canvas** only (no WebGL core path)  
- No server-side data store — host supplies **`intervalsArray`** or pushes via ref API  
- **Prime** tier (`TickUpPrimeTier`) and **Prime engine** (`TickUpPrime`) are documented in **`documentation/15-prime-engine-and-pro-roadmap.md`**; the reference example may omit the tier row (see root **README**)

## 7. Documentation sources

- **`documentation/`** (root) — primary integration reference, included on npm  
- **`docs/`** (this folder) — supplementary; **`docs/internal/`** not on npm  
