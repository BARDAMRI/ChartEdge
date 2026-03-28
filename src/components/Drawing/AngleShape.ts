import {generateDrawingShapeId, IDrawingShape} from './IDrawingShape';
import {ChartRenderContext} from '../../types/chartOptions';
import {PriceRange} from '../../types/Graph';
import {timeToX, priceToY} from '../Canvas/utils/GraphHelpers';
import {AngleShapeArgs, CanvasPoint, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from '../../types/Drawings';
import {pointerTolerance} from './drawHelper';
import {ShapeType} from './types';

/** Screen-space helpers for vertex V and ray endpoints A, B (angle ∠AVB). */
function toPixel(
    p: DrawingPoint,
    renderContext: ChartRenderContext,
    visiblePriceRange: PriceRange
): CanvasPoint {
    const {canvasWidth, canvasHeight, visibleRange} = renderContext;
    return {
        x: timeToX(p.time, canvasWidth, visibleRange),
        y: priceToY(p.price, canvasHeight, visiblePriceRange),
    };
}

export class AngleShape implements IDrawingShape {
    public id: string;
    public type = ShapeType.Angle;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: AngleShapeArgs, public styleOptions: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOptions;
        this.points = args?.points ?? [];
    }

    /**
     * Strokes only (legs + arc). Labels are drawn via {@link drawLabelOverlay} so they can render
     * after other shapes and stay above crossing lines.
     */
    public drawGeometry(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        if (this.points.length < 2) {
            return;
        }

        ctx.save();
        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        if (style.lineStyle === 'dashed') ctx.setLineDash([5, 5]);
        else if (style.lineStyle === 'dotted') ctx.setLineDash([1, 2]);
        else ctx.setLineDash([]);

        if (this.points.length === 2) {
            const a = toPixel(this.points[0], renderContext, visiblePriceRange);
            const b = toPixel(this.points[1], renderContext, visiblePriceRange);
            if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) {
                ctx.restore();
                return;
            }
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();
            return;
        }

        const V = toPixel(this.points[0], renderContext, visiblePriceRange);
        const A = toPixel(this.points[1], renderContext, visiblePriceRange);
        const B = toPixel(this.points[2], renderContext, visiblePriceRange);

        if (![V.x, V.y, A.x, A.y, B.x, B.y].every(Number.isFinite)) {
            ctx.restore();
            return;
        }

        const leg1 = Math.hypot(A.x - V.x, A.y - V.y);
        const leg2 = Math.hypot(B.x - V.x, B.y - V.y);
        if (leg1 < 2 || leg2 < 2) {
            ctx.restore();
            return;
        }

        ctx.beginPath();
        ctx.moveTo(V.x, V.y);
        ctx.lineTo(A.x, A.y);
        ctx.moveTo(V.x, V.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
        ctx.restore();

        this.drawAngleArcOnly(ctx, A, V, B, style.lineColor);
    }

    /** Degree label + legible backing; call after all shape geometry (see drawDrawings). */
    public drawLabelOverlay(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        if (this.points.length < 3) {
            return;
        }
        const V = toPixel(this.points[0], renderContext, visiblePriceRange);
        const A = toPixel(this.points[1], renderContext, visiblePriceRange);
        const B = toPixel(this.points[2], renderContext, visiblePriceRange);
        if (![V.x, V.y, A.x, A.y, B.x, B.y].every(Number.isFinite)) {
            return;
        }
        const leg1 = Math.hypot(A.x - V.x, A.y - V.y);
        const leg2 = Math.hypot(B.x - V.x, B.y - V.y);
        if (leg1 < 4 || leg2 < 4) {
            return;
        }
        this.drawAngleLabelOnly(ctx, A, V, B, style.lineColor, style.lineWidth);
    }

    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        this.drawGeometry(ctx, renderContext, visiblePriceRange, style);
        this.drawLabelOverlay(ctx, renderContext, visiblePriceRange, style);
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        if (this.points.length < 2) {
            return false;
        }

        if (this.points.length === 2) {
            const a = toPixel(this.points[0], renderContext, visiblePriceRange);
            const b = toPixel(this.points[1], renderContext, visiblePriceRange);
            return (
                this.isPointNearLine(px, py, a.x, a.y, b.x, b.y, pointerTolerance)
            );
        }

        const V = toPixel(this.points[0], renderContext, visiblePriceRange);
        const A = toPixel(this.points[1], renderContext, visiblePriceRange);
        const B = toPixel(this.points[2], renderContext, visiblePriceRange);

        return (
            this.isPointNearLine(px, py, V.x, V.y, A.x, A.y, pointerTolerance) ||
            this.isPointNearLine(px, py, V.x, V.y, B.x, B.y, pointerTolerance)
        );
    }

    private angleArcParams(
        p1: CanvasPoint,
        vertex: CanvasPoint,
        p2: CanvasPoint
    ): { a1: number; delta: number; arcR: number } | null {
        const leg1 = Math.hypot(p1.x - vertex.x, p1.y - vertex.y);
        const leg2 = Math.hypot(p2.x - vertex.x, p2.y - vertex.y);
        if (leg1 < 4 || leg2 < 4) {
            return null;
        }
        let a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        let a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
        if (!Number.isFinite(a1) || !Number.isFinite(a2)) {
            return null;
        }
        const arcR = Math.min(22, leg1 * 0.22, leg2 * 0.22);
        if (arcR < 2) {
            return null;
        }
        const twoPi = Math.PI * 2;
        let delta = a2 - a1;
        while (delta <= -Math.PI) delta += twoPi;
        while (delta > Math.PI) delta -= twoPi;
        if (Math.abs(delta) < 1e-4) {
            return null;
        }
        return {a1, delta, arcR};
    }

    private drawAngleArcOnly(
        ctx: CanvasRenderingContext2D,
        p1: CanvasPoint,
        vertex: CanvasPoint,
        p2: CanvasPoint,
        color: string
    ): void {
        const p = this.angleArcParams(p1, vertex, p2);
        if (!p) {
            return;
        }
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, p.arcR, p.a1, p.a1 + p.delta, p.delta < 0);
        ctx.stroke();
        ctx.restore();
    }

    private drawAngleLabelOnly(
        ctx: CanvasRenderingContext2D,
        p1: CanvasPoint,
        vertex: CanvasPoint,
        p2: CanvasPoint,
        color: string,
        strokeLineWidth: number
    ): void {
        const p = this.angleArcParams(p1, vertex, p2);
        if (!p) {
            return;
        }
        const angleDeg = this.calculateAngle(p1, vertex, p2);
        if (!Number.isFinite(angleDeg)) {
            return;
        }
        const bisect = p.a1 + p.delta / 2;
        const lw = Math.max(1, strokeLineWidth || 1);
        const textRadius = p.arcR + 14 + lw * 0.65;
        const textX = vertex.x + textRadius * Math.cos(bisect);
        const textY = vertex.y + textRadius * Math.sin(bisect);
        if (!Number.isFinite(textX) || !Number.isFinite(textY)) {
            return;
        }

        const text = `${angleDeg.toFixed(1)}°`;
        ctx.save();
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const m = ctx.measureText(text);
        const padX = 6;
        const padY = 4;
        const w = Math.max(m.width, 28) + padX * 2;
        const h = 16 + padY * 2;
        const rx = textX - w / 2;
        const ry = textY - h / 2;

        ctx.fillStyle = 'rgba(252, 252, 255, 0.94)';
        ctx.beginPath();
        const rr = ctx as CanvasRenderingContext2D & {roundRect?: (x: number, y: number, rw: number, rh: number, r: number) => void};
        if (typeof rr.roundRect === 'function') {
            rr.roundRect(rx, ry, w, h, 5);
        } else {
            ctx.rect(rx, ry, w, h);
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.98)';
        ctx.strokeText(text, textX, textY);
        ctx.fillStyle = color;
        ctx.fillText(text, textX, textY);
        ctx.restore();
    }

    private isPointNearLine(
        px: number,
        py: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        tolerance: number
    ): boolean {
        const dx = x2 - x1;
        const dy = y2 - y1;
        if (dx === 0 && dy === 0) return false;

        const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
        const closestX = t < 0 ? x1 : t > 1 ? x2 : x1 + t * dx;
        const closestY = t < 0 ? y1 : t > 1 ? y2 : y1 + t * dy;

        const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
        return distSq <= tolerance ** 2;
    }

    private calculateAngle(p1: CanvasPoint, vertex: CanvasPoint, p2: CanvasPoint): number {
        const v1x = p1.x - vertex.x;
        const v1y = p1.y - vertex.y;
        const v2x = p2.x - vertex.x;
        const v2y = p2.y - vertex.y;
        const angleRad = Math.atan2(v2y, v2x) - Math.atan2(v1y, v1x);
        let angleDeg = Math.abs(angleRad * (180 / Math.PI));
        if (angleDeg > 180) angleDeg = 360 - angleDeg;
        return angleDeg;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 3) {
            this.points.push(point);
        } else {
            this.points[2] = point;
        }
    }

    /** After vertex + first ray are fixed (2 points), track the second ray endpoint. */
    updateSecondRayEnd(point: DrawingPoint): void {
        if (this.points.length < 2) {
            return;
        }
        if (this.points.length === 2) {
            this.points.push(point);
        } else {
            this.points[2] = point;
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points.slice(0, 3);
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    getPoints(): DrawingPoint[] {
        return [...this.points];
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }

    /** Phase 1: vertex (index 0) + first ray end (index 1), same behavior as a 2-point line. */
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
