import {IDrawingShape} from "./IDrawingShape.ts";

export interface ArrowShapeArgs {
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color?: string,
    lineWidth?: number
}

export class ArrowShape implements IDrawingShape {

    constructor(
        public fromX: number,
        public fromY: number,
        public toX: number,
        public toY: number,
        public color: string = 'black',
        public lineWidth: number = 2
    ) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const headLength = 10;
        const dx = this.toX - this.fromX;
        const dy = this.toY - this.fromY;
        const angle = Math.atan2(dy, dx);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.fromX, this.fromY);
        ctx.lineTo(this.toX, this.toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.toX, this.toY);
        ctx.lineTo(this.toX - headLength * Math.cos(angle - Math.PI / 6), this.toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(this.toX - headLength * Math.cos(angle + Math.PI / 6), this.toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(this.toX, this.toY);
        ctx.fillStyle = this.color;
        ctx.fill();

    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        return this.isPointNearLine(x, y, this.fromX, this.fromY, this.toX, this.toY, tolerance);
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