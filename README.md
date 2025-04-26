# ChartEdge
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A high-performance, lightweight, and flexible charting library for the modern web. 🚀

## Features
- Ultra-fast Canvas 2D rendering.
- Supports line and candlestick charts.
- Real-time data updates and streaming support.
- Pan, zoom, and tooltip/fixed box interactions.
- Customizable themes (light, dark, grey, custom).
- Static and (future) interactive drawings: lines, rectangles, circles, angles, text.

## Who is ChartEdge for?

ChartEdge is built for:

- Developers building modern trading and finance applications.
- Teams looking for high-performance, lightweight charting solutions.
- Projects that require customizable and visually appealing data visualizations.
- Anyone needing real-time, flexible, and extensible charts for the modern web.

## Why ChartEdge?

- 🚀 Optimized for real-time, high-frequency data streams.
- 🎨 Fully customizable chart elements, from grid lines to candle styles.
- ⚡ Blazing-fast rendering using pure Canvas 2D — no WebGL dependency.
- 🧩 Modular design: use only the components you need.
- 🔮 Ready for advanced features like drawing tools and technical analysis.
- 🌎 Built to serve both financial professionals and general data visualization needs.

## Quick Start

> ⚡ **Tip:** ChartEdge is extremely lightweight — your first chart can be up and running in less than a minute!

### Installation
```bash
npm install chartedge
```

### Basic Usage
```javascript
import { createChart } from 'chartedge';

const chart = createChart(document.getElementById('container'), {
  type: 'candlestick',
  theme: 'dark',
  data: [...],
});
```

### Live Data Update
```javascript
chart.appendData([{ time: Date.now(), value: 135.4 }]);
```

## Documentation

The full documentation is available inside the [Documentation Folder](./docs/Documentation/SUMMARY.md).

| Section | Link |
|---------|------|
| Introduction | [📖 Read](./docs/Documentation/Introduction.md) |
| Installation Guide | [📥 Install](./docs/Documentation/Installation.md) |
| Usage Instructions | [⚙️ Usage](./docs/Documentation/Usage.md) |
| Chart Style Options | [🎨 Style Options](./docs/Documentation/ChartStyleOptions.md) |
| Project Roadmap | [🛤️ Roadmap](./docs/Documentation/Roadmap.md) |
| Vision | [🌟 Vision](./docs/Documentation/VISION.md) |
| Terms of Use | [📜 Terms](./docs/Documentation/Terms_of_Use.md) |
| Contributing | [🤝 Contribute](./docs/Documentation/CONTRIBUTING.md) |

## Roadmap
See the [Project Roadmap](docs/Project_Roadmap/Project_Roadmap.pdf) for upcoming features and phases.

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
