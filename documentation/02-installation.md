# Installation

## Requirements

- **React** 18 or 19  
- **react-dom** 18 or 19  
- **styled-components** 6.x  

These are **peer dependencies**; your app must install them.

## npm

```bash
npm install chartedge react react-dom styled-components
```

## TypeScript

Types ship with the package (`dist/index.d.ts`). Enable `strict` as usual; import types from `chartedge`.

## Bundler notes

- **ESM** entry: `chartedge` → `dist/index.es.js`  
- **CJS** entry: `dist/index.cjs.js`  

Vite, Webpack, and Next.js typically resolve the correct format automatically.

## Styled-components

ChartEdge uses styled-components for layout and themed UI. Ensure your app wraps the tree appropriately (e.g. single `ThemeProvider` if you use one globally; ChartEdge does not require a specific theme object for its internal styled components).

## Verify

```tsx
import { ChartEdgeCommand } from 'chartedge';

export function SmokeTest() {
  return <ChartEdgeCommand style={{ height: 400 }} />;
}
```

You still need to pass `intervalsArray` (can be `[]` for an empty chart). See [Quick start](./03-quick-start.md).
