import {IDrawingShape} from "./IDrawingShape.ts";

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
}