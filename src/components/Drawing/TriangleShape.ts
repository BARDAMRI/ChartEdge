import {IDrawingShape} from "./IDrawingShape";

export interface TriangleShapeArgs {
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color?: string,
    lineWidth?: number
}


export class TriangleShape implements IDrawingShape {

    constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public x3: number,
        public y3: number,
        public color: string = 'black',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineTo(this.x3, this.y3);
        ctx.closePath();
        ctx.stroke();
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        return (
            this.isPointNearLine(x, y, this.x1, this.y1, this.x2, this.y2, tolerance) ||
            this.isPointNearLine(x, y, this.x2, this.y2, this.x3, this.y3, tolerance) ||
            this.isPointNearLine(x, y, this.x3, this.y3, this.x1, this.y1, tolerance)
        );
    }

    private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
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