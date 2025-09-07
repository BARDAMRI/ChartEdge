import {IDrawingShape} from "./IDrawingShape";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {timeToX, priceToY} from "../Canvas/utils/GraphHelpers";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {ArrowShapeArgs, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";
import {pointerTolerance} from "./drawHelper";


export class ArrowShape implements IDrawingShape {
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: ArrowShapeArgs, public styleOverride: DrawingStyleOptions) {
        this.style = styleOverride;
        this.points = args?.points ?? [];
    }

    /**
     * Draws the arrow shape on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        if (this.points.length < 2) {
            return;
        }
        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        // Apply the final calculated style
        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.lineColor; // Arrowhead fill matches the line color
        if (style.lineStyle === 'dashed') ctx.setLineDash([5, 5]);
        else if (style.lineStyle === 'dotted') ctx.setLineDash([1, 2]);
        else ctx.setLineDash([]);

        // Draw the main line of the arrow
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw the arrowhead
        const headLength = 8 + (style.lineWidth - 1) * 2; // Make arrowhead scale with line width
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Checks if a point (in pixel coordinates) is hitting the shape's line.
     */
    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        return isPointNearLine(px, py, x1, y1, x2, y2, pointerTolerance);
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point; // Update the end point if already two points exist
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points.slice(0, 2); // Ensure only two points are kept
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

}