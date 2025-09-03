import {IDrawingShape} from "./IDrawingShape";
import {ShapeBaseArgs} from "./types";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {FinalDrawingStyle} from "../../types/Drawings";

export interface RectangleShapeArgs extends ShapeBaseArgs {
    startTime: number;
    startPrice: number;
    endTime: number;
    endPrice: number;
}

export class RectangleShape implements IDrawingShape {
    constructor(public args: RectangleShapeArgs) {
    }

    /**
     * Draws the rectangle shape on the canvas using a provided style.
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

        const x = timeToX(startTime, canvasWidth, visibleRange);
        const y = priceToY(startPrice, canvasHeight, visiblePriceRange);
        const x2 = timeToX(endTime, canvasWidth, visibleRange);
        const y2 = priceToY(endPrice, canvasHeight, visiblePriceRange);

        const width = x2 - x;
        const height = y2 - y;

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
        if (style?.fillColor !== 'transparent') {
            ctx.fillRect(x, y, width, height);
        }
        ctx.strokeRect(x, y, width, height);
    }

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

        // Check for a hit on any of the 4 lines of the rectangle
        return isPointNearLine(px, py, x1, y1, x2, y1, tolerance) ||
            isPointNearLine(px, py, x2, y1, x2, y2, tolerance) ||
            isPointNearLine(px, py, x2, y2, x1, y2, tolerance) ||
            isPointNearLine(px, py, x1, y2, x1, y1, tolerance);
    }

}