import {IDrawingShape} from "./IDrawingShape.ts";

interface Point {
    x: number,
    y: number
}

export interface PolylineShapeArgs {
    points: Point[],
    color?: string,
    lineWidth?: number
}


export class Polyline implements IDrawingShape {

    constructor(
        public points: Point[],
        public color: string = 'navy',
        public lineWidth: number = 2
    ) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.points?.length < 2) return;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        this.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            if (this.isPointNearLine(x, y, p1.x, p1.y, p2.x, p2.y, tolerance)) {
                return true;
            }
        }
        return false;
    }

    private isPointNearLine(
        px: number, py: number,
        x1: number, y1: number,
        x2: number, y2: number,
        tolerance: number
    ): boolean {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return (dx * dx + dy * dy) <= tolerance * tolerance;
    }
}