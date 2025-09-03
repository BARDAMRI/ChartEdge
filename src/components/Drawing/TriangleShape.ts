import { IDrawingShape } from "./IDrawingShape";
import {  ShapeBaseArgs } from "./types";
import { priceToY, timeToX } from "../Canvas/utils/GraphHelpers";
import { ChartRenderContext } from "../../types/chartOptions";
import { PriceRange } from "../../types/Graph";
import {FinalDrawingStyle} from "../../types/Drawings";
import {isPointNearLine} from "../Canvas/utils/helpers";

export interface TriangleShapeArgs extends ShapeBaseArgs {
    startTime: number;
    startPrice: number;
    endTime: number;
    endPrice: number;
}

export class TriangleShape implements IDrawingShape {
    constructor(public args: TriangleShapeArgs) {}

    /**
     * Draws the triangle shape on the canvas using a provided style.
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
        const { startTime, startPrice, endTime, endPrice } = this.args;
        const { canvasWidth, canvasHeight, visibleRange } = renderContext;

        const p1 = { x: timeToX(startTime, canvasWidth, visibleRange), y: priceToY(startPrice, canvasHeight, visiblePriceRange) };
        const p2 = { x: timeToX(endTime, canvasWidth, visibleRange), y: priceToY(endPrice, canvasHeight, visiblePriceRange) };
        const p3 = { x: p1.x, y: p2.y }; // Third point to make a right-angled triangle

        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.fillColor;

        if (style.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === 'dotted') {
            ctx.setLineDash([1, 2]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        if (style?.fillColor !== 'transparent') {
            ctx.fill();
        }
        ctx.stroke();
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const { startTime, startPrice, endTime, endPrice } = this.args;
        const { canvasWidth, canvasHeight, visibleRange } = renderContext;
        const tolerance = 6;

        const p1 = { x: timeToX(startTime, canvasWidth, visibleRange), y: priceToY(startPrice, canvasHeight, visiblePriceRange) };
        const p2 = { x: timeToX(endTime, canvasWidth, visibleRange), y: priceToY(endPrice, canvasHeight, visiblePriceRange) };
        const p3 = { x: p1.x, y: p2.y };

        // Check for a hit on any of the 3 lines of the triangle
        return isPointNearLine(px, py, p1.x, p1.y, p2.x, p2.y, tolerance) ||
               isPointNearLine(px, py, p2.x, p2.y, p3.x, p3.y, tolerance) ||
               isPointNearLine(px, py, p3.x, p3.y, p1.x, p1.y, tolerance);
    }
}