# Products & layout

## Product components

Import from `tickup`:

| Export | `productId` | Side drawing bar | Top bar | Settings entry |
|--------|-------------|------------------|---------|----------------|
| `TickUpPulse` | `pulse` | No | No | No |
| `TickUpFlow` | `flow` | No | Yes | Yes |
| `TickUpCommand` | `command` | Yes | Yes | Yes |
| `TickUpDesk` | `desk` | Yes | Yes | Yes (branding on) |
| `TickUpPrimeTier` | `prime` | Yes | Yes | Yes |

Props types: `TickUpPulseProps`, `TickUpFlowProps`, etc. Product components **omit** `showSidebar`, `showTopBar`, and `showSettingsBar` from their public props; those are fixed per tier.

### Prime tier vs Prime engine

- **`TickUpPrimeTier`** — Same chrome as **Command**; shows an **evaluation strip** when **`licenseKey`** is unset.  
- **`TickUpPrime`** (engine) — Visual profile: set **`chartOptions.base.engine: 'prime'`** or call **`ref.setEngine(TickUpPrime)`**. Usable on **any** tier. See [Prime engine & Pro roadmap](./15-prime-engine-and-pro-roadmap.md).

### Symbol on Pulse (no top bar)

**Pulse** has no symbol field in the toolbar. If you pass a non-empty **`symbol`** (controlled) or **`defaultSymbol`** (fallback when `symbol` is omitted), the stage shows a **compact read-only symbol strip** above the plot (same typography/colors as axis styling). If both resolve to empty after trim, the strip is hidden. See [Toolbar & interactions](./10-toolbar-and-interactions.md).

The same strip appears for **`TickUpHost`** / **`TickUpStage`** whenever **`showTopBar`** is `false` and a symbol string is available — not only for Pulse.

## Custom layout: `TickUpHost`

Use **`TickUpHost`** **without** `productId`:

```tsx
import { TickUpHost } from 'tickup/full';

<TickUpHost
  showSidebar
  showTopBar
  showSettingsBar
  intervalsArray={data}
/>;
```

Then you control which chrome appears. Settings saved in the modal still respect **locked** layout when `productId` is set on other variants.

## Desk specifics

- **Desk** — `showAttribution` (in-chart watermark) is forced **on**.

## Mode provider

The shell wraps children in **`ModeProvider`** internally. If you use **`TickUpStage`** alone (advanced), wrap with `ModeProvider` yourself. See [Exports & advanced](./11-exports-and-advanced.md).
