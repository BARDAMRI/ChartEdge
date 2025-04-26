# Basic Usage

Here’s a simple example of how to initialize a ChartEdge chart:

```typescript
import { ChartManager } from 'chartedge';

const container = document.getElementById('chart-container');
const chart = new ChartManager(container, { showOverlayLine: true });
chart.setData([
  { time: 1627686000000, close: 145 },
  { time: 1627689600000, close: 148 },
]);
```

Full API documentation will be expanded as ChartEdge grows.
