import {IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle, RectangleShapeArgs} from "../../types/Drawings";
import {pointerTolerance} from "./drawHelper";


export class RectangleShape implements IDrawingShape {
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: RectangleShapeArgs, public styleOverride: DrawingStyleOptions) {
        this.style = styleOverride;
        this.points = args?.points ?? [];
    }

    /**
     * Draws the rectangle shape on the canvas using a provided style.
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


        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);


        const width = x2 - x1;
        const height = y2 - y1;

        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.fillColor;

        if (style.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === 'dotted') {
            ctx.setLineDash([1, 2]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        if (style?.fillColor !== 'transparent') {
            ctx.fillRect(x1, y1, width, height);
        }
        ctx.strokeRect(x1, y1, width, height);
    }

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


        // Check for a hit on any of the 4 lines of the rectangle
        return isPointNearLine(px, py, x1, y1, x2, y1, pointerTolerance) ||
            isPointNearLine(px, py, x2, y1, x2, y2, pointerTolerance) ||
            isPointNearLine(px, py, x2, y2, x1, y2, pointerTolerance) ||
            isPointNearLine(px, py, x1, y2, x1, y1, pointerTolerance);
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

    setPoints(points: DrawingPoint[]): void {
        if (points.length >= 2) {
            this.points = [points[0], points[1]];
        }
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