import {IDrawingShape} from "./IDrawingShape.ts";

interface Point {
    x: number,
    y: number
}

export interface PolylineShapeArgs {
    points: Point[],
    color?: string,
    lineWidth?: number
}


export class Polyline implements IDrawingShape {

    constructor(
        public points: Point[],
        public color: string = 'navy',
        public lineWidth: number = 2
    ) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.points?.length < 2) return;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        this.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
    }

}