import {IDrawingShape} from "./IDrawingShape.ts";

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
}