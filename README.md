# ChartEdge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

High-performance **React** financial charts: Canvas 2D OHLCV, pan/zoom, drawings, live data merge, and tiered product layouts.

## Features

- **Chart types:** candlestick, line, area, bar  
- **Canvas 2D** rendering (no WebGL requirement)  
- **Live data:** `applyLiveData` with replace / append / prepend / merge-by-time  
- **Drawings:** lines, rectangles, circles, triangles, angles, arrows, polylines, custom symbols — toolbar + full imperative API  
- **Settings modal:** axes, colors, grid, histogram, regional formats, hover/crosshair/tooltip toggles  
- **Products:** Pulse (minimal), Flow (top bar), Command / Desk / Apex (full trader UI)  
- **Snapshots & export:** PNG capture helpers, CSV export from toolbar  
- **Theming:** light/dark shell toggle, chart themes, in-chart watermark (Desk)

## Who is ChartEdge for?

Developers building trading terminals, analytics dashboards, and embeddable market widgets who want a **React + styled-components** chart with a real drawing and streaming story.

## Quick setup

### 1. Install

```bash
npm install chartedge react react-dom styled-components
```

React 18+, React DOM, and styled-components 6.x are **peer dependencies**.

### 2. Render a chart

```tsx
import { useRef } from 'react';
import { ChartEdgeCommand, type SimpleChartEdgeHandle } from 'chartedge';

const data = [
  { t: 1700000000, o: 100, h: 102, l: 99, c: 101, v: 1200 },
  { t: 1700000060, o: 101, h: 103, l: 100, c: 102, v: 900 },
];

export function App() {
  const ref = useRef<SimpleChartEdgeHandle>(null);
  return (
    <div style={{ height: 480, width: '100%' }}>
      <ChartEdgeCommand ref={ref} intervalsArray={data} defaultSymbol="DEMO" />
    </div>
  );
}
```

Use **`ChartEdgePulse`** for plot+axes only, or **`ChartEdgeHost`** (`SimpleChartEdge`) without `productId` for custom toolbars.

### 3. Documentation

Full guides (glossary, API, live data, drawings, settings, exports) live in **[`documentation/`](./documentation/README.md)**.

| Start here | Link |
|------------|------|
| Documentation hub | [documentation/README.md](./documentation/README.md) |
| Quick start | [documentation/03-quick-start.md](./documentation/03-quick-start.md) |
| Imperative API | [documentation/06-imperative-api.md](./documentation/06-imperative-api.md) |
| Live updates | [documentation/07-data-and-live-updates.md](./documentation/07-data-and-live-updates.md) |

Legacy / supplementary material may also appear under [`docs/`](./docs/).

## Roadmap

See [`docs/Project_Roadmap/`](./docs/Project_Roadmap/) or project issues for upcoming work.

## License

MIT License

---

MIT License (with additional restrictions)

Copyright (c) 2025 ChartEdge

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

ADDITIONAL CONDITIONS:

- Commercial use of ChartEdge is only permitted with explicit prior written permission from the authors.
- This restriction applies to both direct use and integration into commercial products.
- For commercial licensing options, please contact: [bardamri1702@gmail.com]
