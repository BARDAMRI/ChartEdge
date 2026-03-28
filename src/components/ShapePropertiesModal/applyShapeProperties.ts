import {CustomSymbolShape} from '../Drawing/CustomSymbolShape';
import {IDrawingShape} from '../Drawing/IDrawingShape';
import {DrawingStyleOptions} from '../../types/Drawings';

export type ShapePropertiesFormState = {
    lineColor: string;
    lineWidth: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    fillColor: string;
    selectedLineColor: string;
    selectedLineWidthAdd: number;
    selectedLineStyle: 'solid' | 'dashed' | 'dotted';
    selectedFillColor: string;
    symbolText: string;
    symbolSize: number;
};

export function shapeToFormState(shape: IDrawingShape): ShapePropertiesFormState {
    const s = shape.style;
    const sel = s.selected || ({} as DrawingStyleOptions['selected']);
    const isSym = shape instanceof CustomSymbolShape;
    return {
        lineColor: s.lineColor,
        lineWidth: s.lineWidth,
        lineStyle: s.lineStyle,
        fillColor: s.fillColor,
        selectedLineColor: sel.lineColor ?? s.lineColor,
        selectedLineWidthAdd: sel.lineWidthAdd ?? 1,
        selectedLineStyle: sel.lineStyle ?? s.lineStyle,
        selectedFillColor: sel.fillColor ?? '',
        symbolText: isSym ? shape.symbol : '',
        symbolSize: isSym ? shape.size : 20,
    };
}

export function applyShapePropertiesForm(shape: IDrawingShape, f: ShapePropertiesFormState): void {
    const selected: DrawingStyleOptions['selected'] = {
        lineColor: f.selectedLineColor,
        lineWidthAdd: f.selectedLineWidthAdd,
        lineStyle: f.selectedLineStyle,
    };
    const sf = f.selectedFillColor.trim();
    if (sf) {
        selected.fillColor = sf;
    }
    shape.style = {
        ...shape.style,
        lineColor: f.lineColor,
        lineWidth: f.lineWidth,
        lineStyle: f.lineStyle,
        fillColor: f.fillColor,
        selected,
    };

    if (shape instanceof CustomSymbolShape) {
        const text = (f.symbolText || '?').trim() || '?';
        const size = Math.max(8, Math.min(120, f.symbolSize || 20));
        shape.symbol = text;
        shape.size = size;
        const pts = shape.getPoints();
        shape.args = {
            points: pts.length ? pts : shape.args?.points ?? [],
            symbol: text,
            size,
        };
    }
}
