import {IDrawingShape} from "./IDrawingShape";
import {timeToX, priceToY} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle, LineShapeArgs} from "../../types/Drawings";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {pointerTolerance} from "./drawHelper";

export class LineShape implements IDrawingShape {

    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];


    constructor(public args: LineShapeArgs, public styleOverride: DrawingStyleOptions) {
        this.style = styleOverride;
        this.points = args?.points ?? [];
    }

    /**
     * Draws the line shape on the canvas using a provided style.
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

        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;

        if (style.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === 'dotted') {
            ctx.setLineDash([1, 2]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
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

        return isPointNearLine(px, py, x1, y1, x2, y2, pointerTolerance);
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            console.warn("LineShape can only have two points.");
        }
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index < 0) {
            throw new Error("Index out of bounds");
        }
        if (index == this.points.length - 1) {
            this.points[index] = point;
        } else if (index === this.points.length + 1) {
            this.addPoint(point);
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    updateLastPoint(point: DrawingPoint): void {
        // Updating the seconds point of the line or adding it if it doesn't exist
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }


}