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
        public startX: number,
        public startY: number,
        public endX: number,
        public endY: number,
        public color: string = 'black',
        public lineWidth: number = 2
    ) {}

    draw(ctx: CanvasRenderingContext2D): void {
        const x1 = this.startX;
        const y1 = this.endY;
        const x2 = this.endX;
        const y2 = this.endY;
        const x3 = (this.startX + this.endX) / 2;
        const y3 = this.startY;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.stroke();
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        const x1 = this.startX;
        const y1 = this.endY;
        const x2 = this.endX;
        const y2 = this.endY;
        const x3 = (this.startX + this.endX) / 2;
        const y3 = this.startY;

        return (
            this.isPointNearLine(x, y, x1, y1, x2, y2, tolerance) ||
            this.isPointNearLine(x, y, x2, y2, x3, y3, tolerance) ||
            this.isPointNearLine(x, y, x3, y3, x1, y1, tolerance)
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