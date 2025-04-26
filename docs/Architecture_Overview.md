# ChartEdge - Architecture Overview

## Core
- Manages chart lifecycle (init, resize, destroy)
- Handles incoming data (append, update)
- Manages user interactions (pan, zoom, drawing mode)

## Renderer
- Converts logical data into pixel rendering
- Optimized Canvas 2D operations
- Layered drawing: background, grid, data, shapes, overlays

## Shapes Manager
- Manages user-drawn or API-drawn shapes
- Supports static and interactive elements
- Handles rendering and event capturing

## Theme Manager
- Applies themes (light/dark/custom)
- Handles runtime style updates

## Utilities
- Coordinate transformations (time <-> pixel)
- Scaling calculations
- Animation and easing helpers

## Data Flow
External Data -> Core -> Renderer -> Canvas
