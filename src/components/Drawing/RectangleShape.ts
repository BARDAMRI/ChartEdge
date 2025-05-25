import {IDrawingShape} from "./IDrawingShape.ts";

export interface RectangleShapeArgs {
    x: number,
    y: number,
    width: number,
    height: number,
    color?: string,
    lineWidth?: number
}


export class RectangleShape implements IDrawingShape {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public color: string = 'blue',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    isHit(x: number, y: number): boolean {
        return (
            x >= this.x &&
            x <= this.x + this.width &&
            y >= this.y &&
            y <= this.y + this.height
        );
    }
}