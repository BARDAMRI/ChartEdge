import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle, TriangleShapeArgs} from "../../types/Drawings";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {pointerTolerance, pointInTriangle} from "./drawHelper";
import {ShapeType} from "./types";
import {StrokeLineStyle} from "../../types/overlay";


export class TriangleShape implements IDrawingShape {

    public id: string;
    public type = ShapeType.Triangle;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];
    public args: TriangleShapeArgs;

    constructor(argsIn: TriangleShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.args = {points: []};
        this.points = argsIn?.points ? [...argsIn.points] : [];
        if (this.points.length < 3) {
            this.recalculateThirdVertex();
        }
        this.args.points = [...this.points];
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

        if (this.points.length < 3) {
            return;
        }

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

        if (style.lineStyle === StrokeLineStyle.dashed) {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === StrokeLineStyle.dotted) {
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
        if (this.points.length < 3) {
            return false;
        }
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

    /** Visible time span (sec) and price range — set from chart before dragging so the third vertex is not collinear with the base. */
    private normTimeSpan = 3600;
    private normPriceSpan = 1;

    setNormalizationSpans(visibleTimeSec: number, priceRange: number): void {
        this.normTimeSpan = Math.max(Math.abs(visibleTimeSec) || 3600, 1e-9);
        this.normPriceSpan = Math.max(Math.abs(priceRange) || 1, 1e-9);
    }

    recalculateThirdVertex(): void {
        if (this.points.length < 2) return;

        const t0 = this.points[0].time;
        const t1 = this.points[1].time;
        const p0 = this.points[0].price;
        const p1 = this.points[1].price;
        const dt = t1 - t0;
        const dp = p1 - p0;

        const vt = dt / this.normTimeSpan;
        const vp = dp / this.normPriceSpan;
        const vlen = Math.hypot(vt, vp);

        let thirdT: number;
        let thirdP: number;

        if (vlen < 1e-12) {
            thirdT = t0 + this.normTimeSpan * 0.04;
            thirdP = p0 + this.normPriceSpan * 0.04;
        } else {
            const pxt = -vp / vlen;
            const pyp = vt / vlen;
            const h = Math.max(0.1, Math.min(0.55, vlen * 0.5));
            const midT = (t0 + t1) / 2;
            const midP = (p0 + p1) / 2;
            thirdT = midT + pxt * h * this.normTimeSpan;
            thirdP = midP + pyp * h * this.normPriceSpan;
        }

        if (this.points.length === 2) {
            this.points.push({time: thirdT, price: thirdP});
        } else {
            this.points[2] = {time: thirdT, price: thirdP};
        }
        this.args.points = [...this.points];
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
            this.args.points = [...this.points];
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
            this.args.points = [...this.points];
        } else {
            this.points[0] = point;
            this.recalculateThirdVertex();
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
            this.args.points = [...this.points];
        } else if (this.points.length === 1) {
            this.points.push(point);
            this.args.points = [...this.points];
        } else {
            this.points[1] = point;
            this.recalculateThirdVertex();
        }
    }


}