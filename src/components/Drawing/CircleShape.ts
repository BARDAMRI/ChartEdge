import {IDrawingShape} from "./IDrawingShape.ts";

export interface CircleShapeArgs {
    centerX: number,
    centerY: number,
    radius: number,
    color?: string,
    lineWidth?: number
}

export class CircleShape implements IDrawingShape {
    constructor(
        public centerX: number,
        public centerY: number,
        public radius: number,
        public color: string = 'black',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    }
}