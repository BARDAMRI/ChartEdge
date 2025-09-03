import {ChartRenderContext, ChartOptions} from '../../../types/chartOptions';
import {PriceRange} from '../../../types/Graph';
import {Mode} from '../../../contexts/ModeContext';
import {Drawing} from "../../Drawing/types";
import {IDrawingShape} from "../../Drawing/IDrawingShape";
import {LineShape, LineShapeArgs} from '../../Drawing/LineShape';
import {RectangleShape, RectangleShapeArgs} from '../../Drawing/RectangleShape';
import {CircleShape, CircleShapeArgs} from '../../Drawing/CircleShape';
import {TriangleShape, TriangleShapeArgs} from '../../Drawing/TriangleShape';
import {ArrowShape, ArrowShapeArgs} from '../../Drawing/ArrowShape';
import {Polyline, PolylineShapeArgs} from '../../Drawing/Polyline';
import {CustomSymbolShape, CustomSymbolShapeArgs} from '../../Drawing/CustomSymbolShape';
import {DeepRequired} from "../../../types/types";
import {FinalDrawingStyle} from "../../../types/Drawings";
import {AngleShape, AngleShapeArgs} from "../../Drawing/Angleshape";

export function drawDrawings(
    ctx: CanvasRenderingContext2D,
    drawings: Drawing[],
    selectedIndex: number | null,
    renderContext: ChartRenderContext,
    visiblePriceRange: PriceRange,
    chartOptions: DeepRequired<ChartOptions>
): void {
    const defaultStyles = chartOptions.base.style.drawings;

    drawings.forEach((d, index) => {
        let shape: IDrawingShape | null = null;

        // Create the correct shape instance based on the mode
        switch (d.mode) {
            case Mode.drawLine:
                shape = new LineShape(d.args as LineShapeArgs);
                break;
            case Mode.drawRectangle:
                shape = new RectangleShape(d.args as RectangleShapeArgs);
                break;
            case Mode.drawCircle:
                shape = new CircleShape(d.args as CircleShapeArgs);
                break;
            case Mode.drawTriangle:
                shape = new TriangleShape(d.args as TriangleShapeArgs);
                break;
            case Mode.drawAngle:
                shape = new AngleShape(d.args as AngleShapeArgs);
                break;
            case Mode.drawArrow:
                shape = new ArrowShape(d.args as ArrowShapeArgs);
                break;
            case Mode.drawPolyline:
                shape = new Polyline(d.args as PolylineShapeArgs);
                break;
            case Mode.drawCustomSymbol:
                shape = new CustomSymbolShape(d.args as CustomSymbolShapeArgs);
                break;
            default:
                break;
        }

        if (shape) {
            // --- Cascading Style Logic ---

            // 1. Start with the global default style
            let finalStyle: FinalDrawingStyle = {
                lineColor: defaultStyles.lineColor as string,
                lineWidth: defaultStyles.lineWidth as number,
                lineStyle: defaultStyles.lineStyle as FinalDrawingStyle['lineStyle'],
                fillColor: defaultStyles.fillColor as string
            };

            // 2. Override with shape-specific style, if it exists
            if (d.args.style) {
                finalStyle = {...finalStyle, ...d.args.style};
            }

            // 3. Override again with the "selected" style if the shape is selected
            if (selectedIndex === index) {
                finalStyle.lineColor = defaultStyles.selected.lineColor as string;
                finalStyle.lineWidth = (finalStyle.lineWidth || 1) + (defaultStyles.selected.lineWidthAdd || 1) as number;
                finalStyle.lineStyle = (defaultStyles.selected.lineStyle || finalStyle.lineStyle) as FinalDrawingStyle['lineStyle'];
                if (defaultStyles.selected.fillColor) finalStyle.fillColor = defaultStyles.selected.fillColor as string;
            }

            // 4. Pass the final calculated style to the shape's draw method
            // The shape is now fully responsible for its own rendering.
            shape.draw(ctx, renderContext, visiblePriceRange, finalStyle);
        }
    });
}