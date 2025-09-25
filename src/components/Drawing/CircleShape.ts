import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {CircleShapeArgs, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";
import {pointerTolerance} from "./drawHelper";
import {ShapeType} from "./types";


export class CircleShape implements IDrawingShape {
    public id: string;
    public type = ShapeType.Circle;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: CircleShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.points = args?.points ?? [];
    }

    /**
     * Draws the circle/ellipse shape on the canvas using a provided style.
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

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;

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
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

        if (style?.fillColor !== 'transparent') {
            ctx.fill();
        }
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

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;

        if (radiusX === 0 || radiusY === 0) return false;

        // Check if the point is on the boundary of the ellipse
        const normalized = ((px - centerX) / radiusX) ** 2 + ((py - centerY) / radiusY) ** 2;
        return normalized >= 1 - pointerTolerance && normalized <= 1 + pointerTolerance;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points.slice(0, 2);
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