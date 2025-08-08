import {IDrawingShape} from "./IDrawingShape";

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
        ctx.stroke();

        // Draw dashed line from (x0,y0) to (x0+10,y0)
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(this.x0, this.y0);
        ctx.lineTo(this.x0 + 30, this.y0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw arc for angle visualization
        const radius = 20;
        const v1 = {x: this.x1 - this.x0, y: this.y1 - this.y0};
        const v2 = {x: this.x2 - this.x0, y: this.y2 - this.y0};

        const angle1 = Math.atan2(v1.y, v1.x);
        const angle2 = Math.atan2(v2.y, v2.x);

        const anticlockwise = this.y1 > this.y0;
        ctx.setLineDash([3, 2]);
        ctx.lineDashOffset = 0;
        ctx.beginPath();
        ctx.arc(this.x0, this.y0, radius, angle1, angle2, anticlockwise);
        ctx.stroke();

        // Draw angle text
        const angle = this.calculateAngle();
        const midAngle = (angle1 + angle2) / 2;
        const textX = this.x0 + 40;
        const textY = this.y0
        ctx.fillStyle = this.color;
        ctx.font = '14px sans-serif';
        ctx.fillText(angle + '°', textX, textY);
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        return this.isPointNearLine(x, y, this.x0, this.y0, this.x1, this.y1, tolerance) ||
            this.isPointNearLine(x, y, this.x0, this.y0, this.x2, this.y2, tolerance);
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

    private calculateAngle(): number {
        const v1 = {x: this.x1 - this.x0, y: this.y1 - this.y0};
        const v2 = {x: this.x2 - this.x0, y: this.y2 - this.y0};
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const cos = dot / (mag1 * mag2);
        const angleRad = Math.acos(cos);
        const angleDeg = angleRad * (180 / Math.PI);
        const signedDeg = v2.y < v1.y ?  -angleDeg : angleDeg;
        return parseFloat(signedDeg.toFixed(1)) || 0;
    }
}