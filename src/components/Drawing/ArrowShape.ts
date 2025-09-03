import {IDrawingShape} from "./IDrawingShape";
import {ShapeBaseArgs} from "./types";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {timeToX, priceToY} from "../Canvas/utils/GraphHelpers";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {FinalDrawingStyle} from "../../types/Drawings";

export interface ArrowShapeArgs extends ShapeBaseArgs {
    startTime: number;
    startPrice: number;
    endTime: number;
    endPrice: number;
}

export class ArrowShape implements IDrawingShape {
    constructor(public args: ArrowShapeArgs) {
    }

    /**
     * Draws the arrow shape on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for y-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {startTime, startPrice, endTime, endPrice} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const fromX = timeToX(startTime, canvasWidth, visibleRange);
        const fromY = priceToY(startPrice, canvasHeight, visiblePriceRange);
        const toX = timeToX(endTime, canvasWidth, visibleRange);
        const toY = priceToY(endPrice, canvasHeight, visiblePriceRange);

        // Apply the final calculated style
        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.lineColor; // Arrowhead fill matches the line color
        if (style.lineStyle === 'dashed') ctx.setLineDash([5, 5]);
        else if (style.lineStyle === 'dotted') ctx.setLineDash([1, 2]);
        else ctx.setLineDash([]);

        // Draw the main line of the arrow
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Draw the arrowhead
        const headLength = 8 + (style.lineWidth - 1) * 2; // Make arrowhead scale with line width
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Checks if a point (in pixel coordinates) is hitting the shape's line.
     */
    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {startTime, startPrice, endTime, endPrice} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;
        const tolerance = 6;

        const x1 = timeToX(startTime, canvasWidth, visibleRange);
        const y1 = priceToY(startPrice, canvasHeight, visiblePriceRange);
        const x2 = timeToX(endTime, canvasWidth, visibleRange);
        const y2 = priceToY(endPrice, canvasHeight, visiblePriceRange);

        return isPointNearLine(px, py, x1, y1, x2, y2, tolerance);
    }

}