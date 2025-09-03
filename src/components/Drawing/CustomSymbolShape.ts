import {IDrawingShape} from "./IDrawingShape";
import {ShapeBaseArgs} from "./types";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {FinalDrawingStyle} from "../../types/Drawings";

export interface CustomSymbolShapeArgs extends ShapeBaseArgs {
    time: number;
    price: number;
    symbol: string;
    size: number;
}

export class CustomSymbolShape implements IDrawingShape {
    constructor(public args: CustomSymbolShapeArgs) {
    }

    /**
     * Draws the symbol on the canvas using a provided style.
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
        const {time, price, symbol, size} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x = timeToX(time, canvasWidth, visibleRange);
        const y = priceToY(price, canvasHeight, visiblePriceRange);


        ctx.fillStyle = style.fillColor !== 'transparent' ? style.fillColor : style.lineColor;
        ctx.font = `${size || 20}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(symbol, x, y);
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {time, price, size} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x = timeToX(time, canvasWidth, visibleRange);
        const y = priceToY(price, canvasHeight, visiblePriceRange);
        const s = size || 20;

        // Bounding box hit test
        return px >= x - s / 2 &&
            px <= x + s / 2 &&
            py >= y - s / 2 &&
            py <= y + s / 2;
    }
}