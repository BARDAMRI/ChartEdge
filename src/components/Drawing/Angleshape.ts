import {IDrawingShape} from "./IDrawingShape.ts";

export interface AngleShapeArgs {
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color?: string,
    lineWidth?: number
}


export class AngleShape implements IDrawingShape {

    constructor(
        public x0: number,
        public y0: number,
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public color: string = 'teal',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.x0, this.y0);
        ctx.lineTo(this.x1, this.y1);
        ctx.moveTo(this.x0, this.y0);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
        const angleDeg = this.calculateAngle();
    }

    private calculateAngle(): number {
        const v1 = {x: this.x1 - this.x0, y: this.y1 - this.y0};
        const v2 = {x: this.x2 - this.x0, y: this.y2 - this.y0};
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const cos = dot / (mag1 * mag2);
        return Math.acos(cos) * (100 / Math.PI);
    }
}