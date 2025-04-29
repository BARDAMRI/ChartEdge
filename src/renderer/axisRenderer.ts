// AxisRenderer is responsible for rendering the Y and X axes labels and axis lines

import {AxesPosition} from "../types/types.ts";

export class AxisRenderer {
    private ctx: CanvasRenderingContext2D;

    // Constructor receives the canvas rendering context
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Draws the axes (Y and X) on the canvas, including labels and lines.
     * @param minTime - Minimum time (in milliseconds)
     * @param maxTime - Maximum time (in milliseconds)
     * @param scaledMin - Minimum scaled price
     * @param scaledMax - Maximum scaled price
     * @param canvasWidth - Width of the drawable canvas area (excluding padding)
     * @param canvasHeight - Height of the drawable canvas area (excluding padding)
     * @param originX - X coordinate of the drawable area origin
     * @param originY - Y coordinate of the drawable area origin
     * @param gridSpacing - Spacing between grid lines (default: 80 pixels)
     * @param textColor - Color used for axis text labels
     * @param font - Font style used for axis labels
     * @param lineColor - Color used for the axis lines
     * @param lineWidth - Width of the axis lines
     * @param axisPosition - Position of Y axis ('left' or 'right')
     * @param numberLocale - Locale for formatting numbers (e.g., 'en-US')
     * @param dateLocale - Locale for formatting timestamps (e.g., 'en-GB')
     * @param numberFractionDigits - Number of fraction digits for number formatting (default: 2)
     */
    drawAxes(
        minTime: number,
        maxTime: number,
        scaledMin: number,
        scaledMax: number,
        canvasWidth: number,
        canvasHeight: number,
        originX: number,
        originY: number,
        gridSpacing: number = 80,
        textColor: string = '#131722',
        font: string = '10px Arial',
        lineColor: string = '#131722',
        lineWidth: number = 1.5,
        axisPosition: AxesPosition = AxesPosition.right,
        numberLocale: string = 'en-US',
        dateLocale: string = 'en-US',
        numberFractionDigits: number = 2
    ): void {
        this.ctx.save(); // Save the current canvas state

        // Set text and line styles
        this.ctx.font = font;
        this.ctx.fillStyle = textColor;
        this.ctx.textBaseline = 'middle'; // Center text vertically

        // Calculate number of grid lines horizontally and vertically
        const horizontalLines = Math.floor(canvasHeight / gridSpacing);
        const verticalLines = Math.floor(canvasWidth / gridSpacing);

        const axisPadding = 5; // Space between axis line and labels
        const axisOffset = 5;  // Additional offset for label positioning

        // Formatter for Y-axis numeric values
        const numberFormatter = new Intl.NumberFormat(numberLocale, {
            minimumFractionDigits: numberFractionDigits,
            maximumFractionDigits: numberFractionDigits,
        });

        // Formatter for X-axis date values
        const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
            hour: '2-digit',
            minute: '2-digit',
        });

        // Adjust text alignment based on Y axis position
        if (axisPosition === AxesPosition.right) {
            this.ctx.textAlign = 'left';
        } else {
            this.ctx.textAlign = 'right';
        }

        // Draw Y axis labels
        for (let i = 0; i <= horizontalLines; i++) {
            const y = originY + gridSpacing * i;
            const value = scaledMax - ((scaledMax - scaledMin) / horizontalLines) * i;
            const formattedValue = numberFormatter.format(value);

            const xPosition = axisPosition === AxesPosition.right
                ? originX + canvasWidth + axisOffset + axisPadding
                : originX - axisOffset - axisPadding;

            this.ctx.fillText(formattedValue, xPosition, y);
        }

        // Draw X axis labels
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        for (let i = 0; i <= verticalLines; i++) {
            const x = originX + gridSpacing * i;
            const timestamp = minTime + ((maxTime - minTime) / verticalLines) * i;
            const date = new Date(timestamp);
            const label = dateFormatter.format(date);

            this.ctx.fillText(label, x, originY + canvasHeight + axisPadding);
        }

        // Draw Y axis line
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        const yAxisX = axisPosition === AxesPosition.right ? originX + canvasWidth : originX;
        this.ctx.moveTo(yAxisX, originY);
        this.ctx.lineTo(yAxisX, originY + canvasHeight);
        this.ctx.stroke();

        // Draw X axis line
        this.ctx.beginPath();
        this.ctx.moveTo(originX, originY + canvasHeight);
        this.ctx.lineTo(originX + canvasWidth, originY + canvasHeight);
        this.ctx.stroke();

        this.ctx.restore(); // Restore the previous canvas state
    }
}