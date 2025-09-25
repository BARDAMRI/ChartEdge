import {ChartRenderContext} from '../../../types/chartOptions';
import {PriceRange} from '../../../types/Graph';
import {IDrawingShape} from "../../Drawing/IDrawingShape";
import {FinalDrawingStyle} from "../../../types/Drawings";

export function drawDrawings(
    ctx: CanvasRenderingContext2D,
    drawings: IDrawingShape[],
    selectedIndex: number | null,
    renderContext: ChartRenderContext,
    visiblePriceRange: PriceRange,
): void {

    drawings.forEach((shape, index) => {

        if (shape) {
            // 1. Start with the global default style
            let finalStyle: FinalDrawingStyle = {
                lineColor: shape.style.lineColor as string,
                lineWidth: shape.style.lineWidth as number,
                lineStyle: shape.style.lineStyle as FinalDrawingStyle['lineStyle'],
                fillColor: shape.style.fillColor as string
            };

            // 3. Override again with the "selected" style if the shape is selected
            if (selectedIndex === index) {
                finalStyle.lineColor = shape.style.selected.lineColor as string;
                finalStyle.lineWidth = (finalStyle.lineWidth || 1) + (shape.style.selected.lineWidthAdd || 1) as number;
                finalStyle.lineStyle = (shape.style.selected.lineStyle || finalStyle.lineStyle) as FinalDrawingStyle['lineStyle'];
                if (shape.style.selected.fillColor) finalStyle.fillColor = shape.style.selected.fillColor as string;
            }

            shape?.draw(ctx, renderContext, visiblePriceRange, finalStyle);
        }
    });
}
