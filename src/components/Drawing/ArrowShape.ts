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

}