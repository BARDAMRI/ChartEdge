import {IDrawingShape} from "./IDrawingShape";
import {ShapeBaseArgs} from "./types";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {FinalDrawingStyle} from "../../types/Drawings";

export interface PolylineShapeArgs extends ShapeBaseArgs {
    points: { time: number; price: number }[];
}

export class Polyline implements IDrawingShape {
    constructor(public args: PolylineShapeArgs) {
    }

    /**
     * Draws the polyline/polygon shape on the canvas using a provided style.
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
        const {points} = this.args;
        if (points.length < 2) return;

        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        // Apply the final calculated style
        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.fillColor;
        if (style.lineStyle === 'dashed') ctx.setLineDash([5, 5]);
        else if (style.lineStyle === 'dotted') ctx.setLineDash([1, 2]);
        else ctx.setLineDash([]);

        const pixelPoints = points.map(p => ({
            x: timeToX(p.time, canvasWidth, visibleRange),
            y: priceToY(p.price, canvasHeight, visiblePriceRange)
        }));

        ctx.beginPath();
        ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
        for (let i = 1; i < pixelPoints.length; i++) {
            ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
        }

        // If it's a polygon (more than 2 points), close the path
        if (points.length > 2) {
            ctx.closePath();
        }

        // Fill the shape if a fill color is provided and is not transparent
        if (style.fillColor !== 'transparent') {
            ctx.fill();
        }

        // Draw the stroke last
        ctx.stroke();
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {points} = this.args;
        if (points.length < 2) return false;

        const {canvasWidth, canvasHeight, visibleRange} = renderContext;
        const tolerance = 6;

        const pixelPoints = points.map(p => ({
            x: timeToX(p.time, canvasWidth, visibleRange),
            y: priceToY(p.price, canvasHeight, visiblePriceRange)
        }));

        // Check for a hit on any of the line segments
        for (let i = 0; i < pixelPoints.length - 1; i++) {
            if (isPointNearLine(px, py, pixelPoints[i].x, pixelPoints[i].y, pixelPoints[i + 1].x, pixelPoints[i + 1].y, tolerance)) {
                return true;
            }
        }

        // If it's a closed polygon, also check the last segment connecting back to the first point
        if (points.length > 2) {
            const lastPoint = pixelPoints[pixelPoints.length - 1];
            const firstPoint = pixelPoints[0];
            if (isPointNearLine(px, py, lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y, tolerance)) {
                return true;
            }
        }

        return false;
    }
}