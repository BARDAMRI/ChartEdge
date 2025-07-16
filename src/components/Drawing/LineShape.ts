import {IDrawingShape} from "./IDrawingShape";

export interface LineShapeArgs {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color?: string,
    lineWidth?: number
}

export class LineShape implements IDrawingShape {
    constructor(
        public startX: number,
        public startY: number,
        public endX: number,
        public endY: number,
        public color: string = 'black',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        return this.isPointNearLine(x, y, this.startX, this.startY, this.endX, this.endY, tolerance);
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