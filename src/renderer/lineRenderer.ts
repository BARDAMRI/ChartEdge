// Define a simple Point interface with x and y coordinates
interface Point {
    x: number;
    y: number;
}

// Define optional options for customizing line rendering
interface LineRendererOptions {
    color?: string;      // Line color
    lineWidth?: number;  // Line width
}

// LineRenderer class responsible for drawing lines between points
export class LineRenderer {
    private ctx: CanvasRenderingContext2D;

    // Constructor accepts a CanvasRenderingContext2D to draw on
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Draw straight lines connecting given points
     */
    draw(points: Point[], options?: LineRendererOptions) {
        if (points.length < 2) {
            return; // Need at least two points to draw a line
        }

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y); // Start drawing at the first point

        // Draw straight lines connecting all subsequent points
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }

        // Set stroke style and width based on options, or use defaults
        this.ctx.strokeStyle = options?.color || '#333';
        this.ctx.lineWidth = options?.lineWidth || 2;
        this.ctx.stroke(); // Actually draw the line
    }

    /**
     * Draw smooth curves (quadratic Bezier) connecting given points
     */
    drawSmooth(points: Point[], options?: LineRendererOptions) {
        if (points.length < 2) {
            return; // Need at least two points to draw
        }

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);

        // Draw quadratic curves between points
        for (let i = 1; i < points.length - 1; i++) {
            const midX = (points[i].x + points[i + 1].x) / 2;
            const midY = (points[i].y + points[i + 1].y) / 2;

            this.ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }

        // Draw last straight segment
        const last = points[points.length - 1];
        this.ctx.lineTo(last.x, last.y);

        this.ctx.strokeStyle = options?.color || '#333';
        this.ctx.lineWidth = options?.lineWidth || 2;
        this.ctx.stroke();
    }
}