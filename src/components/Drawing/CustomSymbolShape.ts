import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {CustomSymbolShapeArgs, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";
import {ShapeType} from "./types";


export class CustomSymbolShape implements IDrawingShape {
    public id: string;
    public type = ShapeType.CustomSymbol;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];
    public symbol: string;
    public size: number;

    constructor(public args: CustomSymbolShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.points = args?.points ?? [];
        this.symbol = args.symbol;
        this.size = args.size;
    }

    /**
     * Draws the symbol on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {points, symbol, size} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x = timeToX(points[0].time, canvasWidth, visibleRange);
        const y = priceToY(points[0].price, canvasHeight, visiblePriceRange);


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
        const {points, size} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x = timeToX(points[0].time, canvasWidth, visibleRange);
        const y = priceToY(points[0].price, canvasHeight, visiblePriceRange);
        const s = size || 20;

        // Bounding box hit test
        return px >= x - s / 2 &&
            px <= x + s / 2 &&
            py >= y - s / 2 &&
            py <= y + s / 2;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 1) {
            this.points.push(point);
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points;
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length > 0) {
            this.points[0] = point;
        } else {
            this.points.push(point);
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[this.points.length - 1] = point;
        }
    }
}