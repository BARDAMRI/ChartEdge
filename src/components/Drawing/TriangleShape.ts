import {IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle, TriangleShapeArgs} from "../../types/Drawings";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {pointerTolerance, pointInTriangle} from "./drawHelper";
import {c} from "vite/dist/node/types.d-aGj9QkWt";


export class TriangleShape implements IDrawingShape {

    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: TriangleShapeArgs, public styleOverride: DrawingStyleOptions) {

        this.style = styleOverride;
        this.points = args?.points ?? [];
        this.recalculateThirdVertex();

    }

    /**
     * Draws the triangle shape on the canvas using a provided style.
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


        const p1 = {
            x: timeToX(this.points[0].time, canvasWidth, visibleRange),
            y: priceToY(this.points[0].price, canvasHeight, visiblePriceRange)
        };
        const p2 = {
            x: timeToX(this.points[1].time, canvasWidth, visibleRange),
            y: priceToY(this.points[1].price, canvasHeight, visiblePriceRange)
        };

        const p3 = {
            x: timeToX(this.points[2].time, canvasWidth, visibleRange),
            y: priceToY(this.points[2].price, canvasHeight, visiblePriceRange)
        };


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
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

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

        const a = {
            x: timeToX(this.points[0].time, canvasWidth, visibleRange),
            y: priceToY(this.points[0].price, canvasHeight, visiblePriceRange),
        };
        const b = {
            x: timeToX(this.points[1].time, canvasWidth, visibleRange),
            y: priceToY(this.points[1].price, canvasHeight, visiblePriceRange),
        };
        const c = {
            x: timeToX(this.points[2].time, canvasWidth, visibleRange),
            y: priceToY(this.points[2].price, canvasHeight, visiblePriceRange),
        };

        if (
            isPointNearLine(px, py, a.x, a.y, b.x, b.y, pointerTolerance) ||
            isPointNearLine(px, py, b.x, b.y, c.x, c.y, pointerTolerance) ||
            isPointNearLine(px, py, c.x, c.y, a.x, a.y, pointerTolerance)
        ) {
            return true;
        }

        return pointInTriangle(px, py, a, b, c);
    }

    recalculateThirdVertex(): void {
        if (this.points.length < 2) return;

        const xmin = Math.min(this.points[0].time, this.points[1].time);
        const xmax = Math.max(this.points[0].time, this.points[1].time);
        const ymin = Math.min(this.points[0].price, this.points[1].price);
        const ymax = Math.max(this.points[0].price, this.points[1].price);

        const dx = this.points[1].time - this.points[0].time;
        const dy = this.points[1].price - this.points[0].price;
        const isLeftToRight = dx >= 0;
        const isUp = dy > 0;
        let rx: number, ry: number;

        if (isLeftToRight) {
            rx = xmax;
            ry = isUp ? ymax : ymin;
        } else {
            rx = xmin;
            ry = isUp ? ymax : ymin;
        }

        if (this.points.length === 2) {
            this.points.push({time: rx, price: ry});
        } else {
            this.points[2] = {time: rx, price: ry};
        }
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point;
            this.recalculateThirdVertex();
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points.slice(0, 2);
        this.recalculateThirdVertex();

    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index < 0 || index > 1) return;
        this.points[index] = point;
        this.recalculateThirdVertex();
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {

        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
            this.recalculateThirdVertex();
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
            this.recalculateThirdVertex();
        }
    }


}