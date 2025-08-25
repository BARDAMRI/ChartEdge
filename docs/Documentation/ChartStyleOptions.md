# ChartOptions

ChartOptions is a configuration object that centralizes all the design and visual settings of a ChartEdge chart.

It allows full and easy control over every visual parameter of the chart — both at the code level and dynamically via a future UI.

---

## Full Structure

| Section         | Purpose                                  |
|-----------------|------------------------------------------|
| [backgroundColor](#backgroundcolor) | Canvas background color |
| [grid](#grid)               | Settings for grid lines       |
| [axes](#axes)               | Settings for the X and Y axes |
| [candles](#candles)         | Settings for candlestick charts |
| [lineOverlay](#lineoverlay) | Settings for overlay lines    |
| [padding](#padding)         | Settings for safety margins   |

---

## backgroundColor

| Field | Type | Description |
|------|------|-------------|
| `backgroundColor` | `string` | Sets the background color of the entire canvas. |

Example:  
`#ffffff` (white), `#1e1e1e` (dark grey)

---

## grid

| Field | Type | Description |
|------|------|-------------|
| `lineColor` | `string` | Color of grid lines. |
| `lineWidth` | `number` | Width of grid lines (in pixels). |
| `horizontalLines` | `number` | Number of horizontal grid lines. |
| `verticalLines` | `number` | Number of vertical grid lines. |
| `showGrid` | `boolean` | Whether to display grid lines. |
| `lineDash` | `number[]` | Dash pattern for lines (e.g., `[5,5]` for dashed lines). |

---

## axes

| Field | Type | Description |
|------|------|-------------|
| `textColor` | `string` | Color of axis label text. |
| `font` | `string` | Font used for axis labels (e.g., `10px Arial`). |
| `lineColor` | `string` | Color of the axis lines. |
| `lineWidth` | `number` | Width of the axis lines (in pixels). |
| `showAxes` | `boolean` | Whether to display the axes. |
| `axisPosition` | `'left'` or `'right'` | Side of the Y-axis. |

---

## candles

| Field | Type | Description |
|------|------|-------------|
| `upColor` | `string` | Color of a bullish (rising) candle body. |
| `downColor` | `string` | Color of a bearish (falling) candle body. |
| `borderColor` | `string` | Color of the candle border. |
| `borderWidth` | `number` | Width of the candle border (in pixels). |
| `bodyWidthFactor` | `number` | Ratio of the body width relative to the total available width. |

---

## lineOverlay

| Field | Type | Description |
|------|------|-------------|
| `color` | `string` | Color of the overlay line. |
| `lineWidth` | `number` | Width of the overlay line (in pixels). |
| `dashed` | `boolean` | Whether the overlay line is dashed. |

---

## padding

| Field | Type | Description |
|------|------|-------------|
| `type` | `'percent'` or `'pixels'` | How the padding is calculated. |
| `value` | `number` | The padding value (either % or pixels depending on type). |

---

## Key Notes

- Every field has a default value.
- Many settings can be changed dynamically during runtime.
- All canvas rendering is based on `styleOptions`, not hardcoded values.
- Adding new style options in the future is designed to be simple and non-breaking.

---

# 🚀 Example Usage

```typescript
const customStyle: ChartOptions = {
    backgroundColor: '#ffffff',
    grid: {
        lineColor: 'rgba(200,200,200,0.4)',
        lineWidth: 1,
        horizontalLines: 5,
        verticalLines: 5,
        showGrid: true,
        lineDash: [],
    },
    axes: {
        textColor: '#666',
        font: '10px Arial',
        lineColor: '#666',
        lineWidth: 1.5,
        showAxes: true,
        axisPosition: 'right',
    },
    candles: {
        upColor: '#4caf50',
        downColor: '#f44336',
        borderColor: '#333',
        borderWidth: 1,
        bodyWidthFactor: 0.7,
    },
    lineOverlay: {
        color: '#007bff',
        lineWidth: 1,
        dashed: false,
    },
    padding: {
        type: 'percent',
        value: 2,
    }
};