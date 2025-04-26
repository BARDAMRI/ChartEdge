// GridRenderer is responsible for drawing horizontal and vertical grid lines in the chart background
export class GridRenderer {
    private ctx: CanvasRenderingContext2D;

    // Constructor that receives the canvas rendering context
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Draws the grid lines on the canvas.
     * @param minTime - Minimum time (currently unused but reserved for future extensions)
     * @param maxTime - Maximum time (currently unused but reserved for future extensions)
     * @param scaledMin - Minimum scaled value (currently unused directly here)
     * @param scaledMax - Maximum scaled value (currently unused directly here)
     * @param canvasWidth - Width of the canvas
     * @param canvasHeight - Height of the canvas
     * @param gridSpacing - Distance in pixels between grid lines (default 80)
     * @param lineWidth - Width of the grid lines (default 1)
     * @param lineColor - Color of the grid lines (default rgba(200, 200, 200, 0.4))
     * @param lineDash - Array defining the dash pattern of the grid lines (default solid lines)
     */
    drawGrid(
        minTime: number,
        maxTime: number,
        scaledMin: number,
        scaledMax: number,
        canvasWidth: number,
        canvasHeight: number,
        originX: number,
        originY: number,
        gridSpacing: number = 80,
        lineWidth: number = 1,
        lineColor: string = 'rgba(200, 200, 200, 0.4)',
        lineDash: number[] = []
    ) {
        this.ctx.save(); // Save the current canvas state

        // Set the grid line style
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.setLineDash(lineDash);

        const horizontalLines = Math.floor(canvasHeight / gridSpacing);
        const verticalLines = Math.floor(canvasWidth / gridSpacing);

        // Draw horizontal grid lines (Y axis)
        for (let i = 0; i <= horizontalLines; i++) {
            const y = gridSpacing * i;
            this.ctx.beginPath();
            this.ctx.moveTo(originX, originY + y);
            this.ctx.lineTo(originX + canvasWidth, originY + y);
            this.ctx.stroke();
        }

        // Draw vertical grid lines (X axis)
        for (let i = 0; i <= verticalLines; i++) {
            const x = gridSpacing * i;
            this.ctx.beginPath();
            this.ctx.moveTo(originX + x, originY);
            this.ctx.lineTo(originX + x, originY + canvasHeight);
            this.ctx.stroke();
        }

        this.ctx.restore(); // Restore the previous canvas state
    }
}