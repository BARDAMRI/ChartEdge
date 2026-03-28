import {ChartRenderContext} from '../../../types/chartOptions';
import {PriceRange} from '../../../types/Graph';
import {IDrawingShape} from "../../Drawing/IDrawingShape";
import {AngleShape} from '../../Drawing/AngleShape';
import {FinalDrawingStyle} from "../../../types/Drawings";

function resolveFinalStyle(
    shape: IDrawingShape,
    index: number,
    selectedIndex: number | null,
): FinalDrawingStyle | null {
    if (!shape?.style) {
        return null;
    }
    let finalStyle: FinalDrawingStyle = {
        lineColor: shape.style.lineColor as string,
        lineWidth: shape.style.lineWidth as number,
        lineStyle: shape.style.lineStyle as FinalDrawingStyle['lineStyle'],
        fillColor: shape.style.fillColor as string,
    };

    const sel = shape.style.selected;
    if (selectedIndex === index && sel) {
        finalStyle.lineColor = sel.lineColor as string;
        finalStyle.lineWidth = (finalStyle.lineWidth || 1) + (sel.lineWidthAdd || 1) as number;
        finalStyle.lineStyle = (sel.lineStyle || finalStyle.lineStyle) as FinalDrawingStyle['lineStyle'];
        if (sel.fillColor) finalStyle.fillColor = sel.fillColor as string;
    }
    return finalStyle;
}

export function drawDrawings(
    ctx: CanvasRenderingContext2D,
    drawings: IDrawingShape[],
    selectedIndex: number | null,
    renderContext: ChartRenderContext,
    visiblePriceRange: PriceRange,
): void {
    drawings.forEach((shape, index) => {
        const finalStyle = resolveFinalStyle(shape, index, selectedIndex);
        if (!finalStyle) {
            return;
        }
        if (shape instanceof AngleShape) {
            shape.drawGeometry(ctx, renderContext, visiblePriceRange, finalStyle);
        } else {
            shape.draw(ctx, renderContext, visiblePriceRange, finalStyle);
        }
    });

    drawings.forEach((shape, index) => {
        const finalStyle = resolveFinalStyle(shape, index, selectedIndex);
        if (!finalStyle) {
            return;
        }
        if (shape instanceof AngleShape) {
            shape.drawLabelOverlay(ctx, renderContext, visiblePriceRange, finalStyle);
        }
    });
}
