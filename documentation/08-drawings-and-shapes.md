# Drawings & shapes

## Supported shape types (`ShapeType`)

| Type | Points / usage |
|------|----------------|
| **Line** | 2 points: start and end (time/price). |
| **Rectangle** | 2 corners (diagonal). |
| **Circle** | 2 points: center and rim (or bounding logic per implementation). |
| **Triangle** | 3 vertices (polyline workflow may add progressively). |
| **Angle** | Vertex + two rays (two-phase placement in UI). |
| **Arrow** | 2 points: tail and head. |
| **Polyline** | Multiple vertices; double-click to finish in UI. |
| **CustomSymbol** | 1 anchor point + `symbol` string + `size`. |

## Toolbar (Command / Desk / Apex / custom host with sidebar)

The visible **sidebar** exposes these tools only:

| Tool | Mode |
|------|------|
| Line | `drawLine` |
| Rectangle | `drawRectangle` |
| Circle | `drawCircle` |
| Triangle | `drawTriangle` |
| Angle | `drawAngle` |
| Select | `select` |
| Edit | `editShape` |

**Not on the toolbar** (but fully supported via **code**): **Arrow**, **Polyline**, **Custom symbol** (`ShapeType.Arrow` / `Polyline` / `CustomSymbol`). Use `addShape` / `DrawingSpec` for those.

The enum also includes **`Mode.drawText`** for future use; there is no text drawing tool in the default toolbar today.

Click the active tool again to return to default navigation (`Mode.none`).

### Creating shapes with the mouse

1. Choose a draw tool.  
2. Click (and drag or multi-click per tool) on the plot.  
3. Shapes commit when enough points are placed (tool-specific).

**Polyline** (programmatic / custom UI only in the default product): add vertices with clicks; **double-click** finishes the path. **Angle** uses a two-step flow (first ray, then second ray) before committing.

### Select & edit

- **Select** — Click a shape to highlight (top-most hit wins).  
- **Edit** — Adjust handles where implemented.  
- **Double-click** a shape (in select/navigation modes) or **right‑click** a **selected** shape to open **Shape properties** — modal fields include line color/width/style, fill, selection styling, and for custom symbols: text + size (`ShapePropertiesFormState`).

The shell uses the exported **`ShapePropertiesModal`** component wired to `onRequestShapeProperties` on the canvas; you can reuse it in custom hosts.

## Programmatic creation (`DrawingSpec`)

```ts
type DrawingSpec = {
  id?: string;
  type: ShapeType;
  points: DrawingPoint[]; // { time, price } in axis space
  style?: DeepPartial<DrawingStyleOptions>;
  symbol?: string;
  size?: number;
};
```

Minimum points per type are enforced in `drawingFromSpec` (e.g. 2 for line/rect/circle/arrow).

```tsx
chartRef.current?.addShape({
  type: ShapeType.Rectangle,
  points: [{ time: t0, price: p0 }, { time: t1, price: p1 }],
  style: { lineColor: '#0af', fillColor: 'rgba(0,170,255,0.15)' },
});
```

## Programmatic updates

### Full replacement

`updateShape(id, fullSpecOrInstance)` replaces the shape when the second argument is **not** a patch.

### Partial patch (`DrawingPatch`)

```ts
type DrawingPatch = {
  style?: DeepPartial<DrawingStyleOptions>;
  points?: DrawingPoint[];
  symbol?: string;
  size?: number;
};
```

`patchShape(id, patch)` or `updateShape(id, patch)` when `isDrawingPatch(data)` is true.

Triangles and polylines receive special handling for point arrays inside `applyDrawingPatch`.

## Bulk replace

`setDrawingsFromSpecs(specs: DrawingSpec[])` rebuilds the entire overlay stack from JSON-friendly specs (e.g. after loading a layout from your server).

## Query & persistence

- `getDrawings(query?)` — Filter by `types`, `ids`, `idPrefix`, time/price bounds, or custom `predicate`.  
- `shapeToSnapshot` / `queryDrawingsToSnapshots` — Export plain objects for storage.

## Coordinate space

`DrawingPoint` uses **time** (unix seconds) and **price** (Y value), not pixels. The canvas maps these using the current visible ranges.

## Shape properties UI

`ShapePropertiesModal` is exported for advanced hosts who want to embed the same form outside the default flow. The shell wires it from the chart when editing.
