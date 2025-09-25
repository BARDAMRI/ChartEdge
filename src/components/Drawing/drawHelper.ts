import {
    AngleShapeArgs, ArrowShapeArgs,
    CanvasPoint, CircleShapeArgs, CustomSymbolShapeArgs,
    DrawingStyleOptions,
    LineShapeArgs, PolylineShapeArgs,
    RectangleShapeArgs, TriangleShapeArgs
} from "../../types/Drawings";
import {Drawing, ShapeType} from "./types";
import {Mode} from "../../contexts/ModeContext";
import {LineShape} from "./LineShape";
import {RectangleShape} from "./RectangleShape";
import {CircleShape} from "./CircleShape";
import {TriangleShape} from "./TriangleShape";
import {ArrowShape} from "./ArrowShape";
import {Polyline} from "./Polyline";
import {CustomSymbolShape} from "./CustomSymbolShape";
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {AngleShape} from "./AngleShape";
import {deepMerge} from "../../utils/deepMerge";
import {DeepRequired} from "../../types/types";
import {ChartOptions} from "../../types/chartOptions";


export const pointerTolerance = 5; // pixels
export function pointInTriangle(
    px: number,
    py: number,
    a: CanvasPoint,
    b: CanvasPoint,
    c: CanvasPoint
): boolean {
    const v0x = c.x - a.x, v0y = c.y - a.y;
    const v1x = b.x - a.x, v1y = b.y - a.y;
    const v2x = px - a.x, v2y = py - a.y;

    const den = v0x * v1y - v1x * v0y;
    if (den === 0) return false;

    const u = (v2x * v1y - v1x * v2y) / den;
    const v = (v0x * v2y - v2x * v0y) / den;

    return u >= 0 && v >= 0 && (u + v) <= 1;
}


export function createShape(newDraw: Drawing): IDrawingShape {
    let shape: IDrawingShape;
    const shapeId = generateDrawingShapeId();
    switch (newDraw.mode) {
        case Mode.drawLine:
            shape = new LineShape(newDraw.args as LineShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawRectangle:
            shape = new RectangleShape(newDraw.args as RectangleShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawCircle:
            shape = new CircleShape(newDraw.args as CircleShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawTriangle:
            shape = new TriangleShape(newDraw.args as TriangleShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawAngle:
            shape = new AngleShape(newDraw.args as AngleShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawArrow:
            shape = new ArrowShape(newDraw.args as ArrowShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawPolyline:
            shape = new Polyline(newDraw.args as PolylineShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawCustomSymbol:
            shape = new CustomSymbolShape(newDraw.args as CustomSymbolShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        default:
            shape = new CustomSymbolShape(newDraw.args as CustomSymbolShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
    }

    return shape;
}


export function validateAndNormalizeShape(
    shape: any,
    chartOptions: DeepRequired<ChartOptions>
): IDrawingShape | null {
    if ('type' in shape) {
        if (!Object.values(ShapeType).includes(shape.type)) {
            console.warn("Invalid shape type passed:", shape);
            return null;
        }
    }

    // Check points
    if (!Array.isArray(shape.points)) {
        console.warn("Invalid shape: missing points", shape);
        return null;
    }

    // Normalize style
    const defaultStyle = chartOptions.base.style.drawings as DrawingStyleOptions;
    if (shape.style) {
        shape.style = deepMerge(defaultStyle as DeepRequired<DrawingStyleOptions>, shape.style);
    } else {
        shape.style = defaultStyle;
    }

    return shape;
}