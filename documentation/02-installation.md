# Installation

## Requirements

- **React** 18 or 19  
- **react-dom** 18 or 19  
- **styled-components** 6.x  

These are **peer dependencies**; your app must install them.

## npm

```bash
npm install tickup react react-dom styled-components
```

## TypeScript

Types ship with the package (`dist/index.d.ts`). Enable `strict` as usual; import types from `tickup`.

## Bundler notes

- **ESM** entry: `tickup` → `dist/index.es.js`  
- **CJS** entry: `dist/index.cjs.js`  

Vite, Webpack, and Next.js typically resolve the correct format automatically.

## Styled-components

TickUp uses styled-components for layout and themed UI. Ensure your app wraps the tree appropriately (e.g. single `ThemeProvider` if you use one globally; TickUp does not require a specific theme object for its internal styled components).

## Verify

```tsx
import { TickUpCommand } from 'tickup/full';

export function SmokeTest() {
  return <TickUpCommand style={{ height: 400 }} />;
}
```

You still need to pass `intervalsArray` (can be `[]` for an empty chart). See [Quick start](./03-quick-start.md).
