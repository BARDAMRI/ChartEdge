import {IDrawingShape} from "./IDrawingShape";
import {ShapeBaseArgs} from "./types";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {FinalDrawingStyle} from "../../types/Drawings";

export interface CircleShapeArgs extends ShapeBaseArgs {
    startTime: number;
    startPrice: number;
    endTime: number;
    endPrice: number;
}

export class CircleShape implements IDrawingShape {
    constructor(public args: CircleShapeArgs) {
    }

    /**
     * Draws the circle/ellipse shape on the canvas using a provided style.
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

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;

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
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

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
        // Approximate hit test for an ellipse
        const {startTime, startPrice, endTime, endPrice} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;
        const tolerance = 0.1; // Tolerance for ellipse boundary (10%)

        const x1 = timeToX(startTime, canvasWidth, visibleRange);
        const y1 = priceToY(startPrice, canvasHeight, visiblePriceRange);
        const x2 = timeToX(endTime, canvasWidth, visibleRange);
        const y2 = priceToY(endPrice, canvasHeight, visiblePriceRange);

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;

        if (radiusX === 0 || radiusY === 0) return false;

        // Check if the point is on the boundary of the ellipse
        const normalized = ((px - centerX) / radiusX) ** 2 + ((py - centerY) / radiusY) ** 2;
        return normalized >= 1 - tolerance && normalized <= 1 + tolerance;
    }
}