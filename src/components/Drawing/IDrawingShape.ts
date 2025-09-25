import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";

export interface IDrawingShape {
    id: string ;
    style: DrawingStyleOptions;
    points: DrawingPoint[];

    /**
     * Draws the shape on the canvas.
     * @param ctx
     * @param renderContext
     * @param visiblePriceRange
     * @param style The final, calculated style object to use for drawing.
     */
    draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void;

    /**
     * Checks if a point (in pixel coordinates) is hitting the shape.
     */
    isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean;

    setPoints(points: DrawingPoint[]): void;

    setPointAt(index: number, point: DrawingPoint): void;

    setFirstPoint(point: DrawingPoint): void;

    addPoint(point: DrawingPoint): void;

    updateLastPoint(point: DrawingPoint): void;

    getPoints(): DrawingPoint[];
}

// Internal counter for unique IDs
let _drawingShapeIdCounter = 0;

/**
 * Helper to generate a unique id string for drawing shapes.
 */
export function generateDrawingShapeId(): string {
    _drawingShapeIdCounter += 1;
    return `drawing-shape-${_drawingShapeIdCounter}`;
}
