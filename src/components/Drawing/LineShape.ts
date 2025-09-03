import {IDrawingShape} from "./IDrawingShape";
import {ShapeBaseArgs} from "./types";
import {timeToX, priceToY} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {FinalDrawingStyle} from "../../types/Drawings";
import {isPointNearLine} from "../Canvas/utils/helpers";

export interface LineShapeArgs extends ShapeBaseArgs {
    startTime: number;
    startPrice: number;
    endTime: number;
    endPrice: number;
}

export class LineShape implements IDrawingShape {
    constructor(public args: LineShapeArgs) {
    }

    /**
     * Draws the line shape on the canvas using a provided style.
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

        const x1 = timeToX(startTime, canvasWidth, visibleRange);
        const y1 = priceToY(startPrice, canvasHeight, visiblePriceRange);
        const x2 = timeToX(endTime, canvasWidth, visibleRange);
        const y2 = priceToY(endPrice, canvasHeight, visiblePriceRange);

        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;

        if (style.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === 'dotted') {
            ctx.setLineDash([1, 2]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
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

        return isPointNearLine(px, py, x1, y1, x2, y2, tolerance);
    }

}