import {IDrawingShape} from "./IDrawingShape";

export interface CircleShapeArgs {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color?: string,
    lineWidth?: number
}

export class CircleShape implements IDrawingShape {
    constructor(
        public startX: number,
        public startY: number,
        public endX: number,
        public endY: number,
        public color: string = 'black',
        public lineWidth: number = 2
    ) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const centerX = (this.startX + this.endX) / 2;
        const centerY = (this.startY + this.endY) / 2;
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    isHit(x: number, y: number): boolean {
        const centerX = (this.startX + this.endX) / 2;
        const centerY = (this.startY + this.endY) / 2;
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;

        const dxHit = x - centerX;
        const dyHit = y - centerY;
        return Math.sqrt(dxHit * dxHit + dyHit * dyHit) <= radius + this.lineWidth / 2;
    }
}