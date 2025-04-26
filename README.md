# ChartEdge

A high-performance, lightweight, and flexible charting library for the modern web. 🚀

## Features
- Ultra-fast Canvas 2D rendering.
- Supports line and candlestick charts.
- Real-time data updates and streaming support.
- Pan, zoom, and tooltip/fixed box interactions.
- Customizable themes (light, dark, grey, custom).
- Static and (future) interactive drawings: lines, rectangles, circles, angles, text.

## Quick Start

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
Full documentation is available in the [docs/](./docs/) folder.

## Roadmap
See the [Project Roadmap](./docs/Project_Roadmap.pdf) for upcoming features and phases.

## License
MIT License
