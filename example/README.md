# TickUp Charts — example playground

Local Vite app that exercises **`tickup/full`**: interactive **`TickUpDemo`** (theme System/Light/Dark, Prime + standard engines aligned via **`createTickUpPrimeEngine`**, live data from `data-generator.ts`) and a multi-tier showcase in `App.tsx`.

## Build

From the **repository root** (library must be built first):

```bash
npm run build:example
```

Or manually:

```bash
cd ..
npm run build
cd example
npm install
npm run build
```

Output is `example/dist/`. Dev server: `npm run dev` from `example/`.

Vite resolves `tickup` / `tickup/full` via aliases to `../dist/*.es.js` when needed; `public/` assets are read from the root `public/` folder.
