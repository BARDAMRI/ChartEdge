import {IDrawingShape} from "./IDrawingShape";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {timeToX, priceToY} from "../Canvas/utils/GraphHelpers";
import {AngleShapeArgs, CanvasPoint, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";
import {pointerTolerance} from "./drawHelper";

export class AngleShape implements IDrawingShape {

    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: AngleShapeArgs, public styleOptions: DrawingStyleOptions) {
        this.style = styleOptions;
        this.points = args.points ?? [];
    }

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

        const p1: CanvasPoint = {x: x1, y: y1};
        const p2: CanvasPoint = {x: x2, y: y2};
        const vertex: CanvasPoint = {x: p2.x, y: p1.y};

        // Apply the final calculated style
        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        if (style.lineStyle === 'dashed') ctx.setLineDash([5, 5]);
        else if (style.lineStyle === 'dotted') ctx.setLineDash([1, 2]);
        else ctx.setLineDash([]);

        // Draw the main angle lines
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(vertex.x, vertex.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Draw the visuals (arc and text)
        this.drawAngleVisuals(ctx, p1, vertex, p2, style.lineColor);
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const p1 = {
            x: timeToX(this.points[0].time, canvasWidth, visibleRange),
            y: priceToY(this.points[0].price, canvasHeight, visiblePriceRange)
        };
        const p2 = {
            x: timeToX(this.points[1].time, canvasWidth, visibleRange),
            y: priceToY(this.points[1].price, canvasHeight, visiblePriceRange)
        };
        const vertex = {x: p2.x, y: p1.y};

        return this.isPointNearLine(px, py, p1.x, p1.y, vertex.x, vertex.y, pointerTolerance) ||
            this.isPointNearLine(px, py, vertex.x, vertex.y, p2.x, p2.y, pointerTolerance);
    }

    private drawAngleVisuals(ctx: CanvasRenderingContext2D, p1: CanvasPoint, vertex: CanvasPoint, p2: CanvasPoint, color: string) {
        const radius = 25;

        const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);

        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, radius, angle1, angle2);
        ctx.stroke();

        const angleDeg = this.calculateAngle(p1, vertex, p2);
        const midAngle = (angle1 + angle2) / 2;
        const textRadius = radius + 15;
        const textX = vertex.x + textRadius * Math.cos(midAngle);
        const textY = vertex.y + textRadius * Math.sin(midAngle);

        ctx.fillStyle = color;
        ctx.font = '12px sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(angleDeg.toFixed(1) + '°', textX, textY);
    }

    private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
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
        const v1 = {x: p1.x - vertex.x, y: p1.y - vertex.y};
        const v2 = {x: p2.x - vertex.x, y: p2.y - vertex.y};
        const angleRad = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
        let angleDeg = Math.abs(angleRad * (180 / Math.PI));
        if (angleDeg > 180) angleDeg = 360 - angleDeg;
        return angleDeg;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points;
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }

    }

    getPoints(): DrawingPoint[] {
        return [];
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