import {IDrawingShape} from "./IDrawingShape";

export interface CustomSymbolShapeArgs {
    x: number,
    y: number,
    symbol: string,
    size: number,
    color: string
}

export class CustomSymbolShape implements IDrawingShape {

    constructor(
        public x: number,
        public y: number,
        public symbol: string = '*',
        public size: number = 24,
        public color: string = 'black') {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px Arial`;
        ctx.fillText(this.symbol, this.x, this.y);
    }

    isHit(x: number, y: number): boolean {
        const halfSize = this.size / 2;
        return (
            x >= this.x - halfSize &&
            x <= this.x + halfSize &&
            y >= this.y - halfSize &&
            y <= this.y + halfSize
        );
    }

}