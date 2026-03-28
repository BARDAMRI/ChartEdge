# Products & layout

## Product components

Import from `chartedge`:

| Export | `productId` | Side drawing bar | Top bar | Settings entry |
|--------|-------------|------------------|---------|----------------|
| `ChartEdgePulse` | `pulse` | No | No | No |
| `ChartEdgeFlow` | `flow` | No | Yes | Yes |
| `ChartEdgeCommand` | `command` | Yes | Yes | Yes |
| `ChartEdgeDesk` | `desk` | Yes | Yes | Yes (branding on) |
| `ChartEdgeApex` | `apex` | Yes | Yes | Yes |

Props types: `ChartEdgePulseProps`, `ChartEdgeFlowProps`, etc. Product components **omit** `showSidebar`, `showTopBar`, and `showSettingsBar` from their public props; those are fixed per tier.

## Custom layout: `ChartEdgeHost` / `SimpleChartEdge`

Use **`ChartEdgeHost`** (alias of **`SimpleChartEdge`**) **without** `productId`:

```tsx
import { ChartEdgeHost } from 'chartedge';

<ChartEdgeHost
  showSidebar
  showTopBar
  showSettingsBar
  intervalsArray={data}
/>;
```

Then you control which chrome appears. Settings saved in the modal still respect **locked** layout when `productId` is set on other variants.

## Desk & Apex specifics

- **Desk** — `showAttribution` (in-chart watermark) is forced **on**.  
- **Apex** — Pass `licenseKey` when licensed; without it, an evaluation banner may appear.

## Mode provider

The shell wraps children in **`ModeProvider`** internally. If you use **`ChartEdgeStage`** alone (advanced), wrap with `ModeProvider` yourself. See [Exports & advanced](./11-exports-and-advanced.md).
