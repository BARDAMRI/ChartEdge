import {
    AngleShapeArgs, ArrowShapeArgs,
    CanvasPoint, CircleShapeArgs, CustomSymbolShapeArgs,
    DrawingPoint,
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
import {DeepPartial, DeepRequired} from "../../types/types";
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
            console.warn('[ChartEdge] createShape: unsupported mode, using empty line placeholder', newDraw.mode);
            shape = new LineShape({points: []}, newDraw.style as DrawingStyleOptions, shapeId);
            break;
    }

    return shape;
}

/** Plain-object description for creating drawings from host code (see {@link drawingFromSpec}). */
export type DrawingSpec = {
    id?: string;
    type: ShapeType;
    points: DrawingPoint[];
    style?: DeepPartial<DrawingStyleOptions>;
    symbol?: string;
    size?: number;
};

/** Partial update applied in-place to an existing drawing (geometry, style, or custom symbol fields). */
export type DrawingPatch = {
    style?: DeepPartial<DrawingStyleOptions>;
    points?: DrawingPoint[];
    symbol?: string;
    size?: number;
};

export type DrawingInput = IDrawingShape | DrawingSpec;

function minPointsRequired(type: ShapeType): number {
    switch (type) {
        case ShapeType.CustomSymbol:
            return 1;
        case ShapeType.Line:
        case ShapeType.Rectangle:
        case ShapeType.Circle:
        case ShapeType.Arrow:
            return 2;
        case ShapeType.Triangle:
        case ShapeType.Angle:
        case ShapeType.Polyline:
            return 2;
        default:
            return 1;
    }
}

/**
 * Builds a drawing class instance from a plain spec (type + points + optional style).
 * Use with {@link ChartStageHandle.addShape} / {@link SimpleChartEdgeHandle.addShape} or {@link setDrawingsFromSpecs}.
 */
export function drawingFromSpec(
    spec: DrawingSpec,
    chartOptions: DeepRequired<ChartOptions>
): IDrawingShape | null {
    const need = minPointsRequired(spec.type);
    if (!Array.isArray(spec.points) || spec.points.length < need) {
        console.warn('[ChartEdge] drawingFromSpec: not enough points for', spec.type, spec);
        return null;
    }
    const defaultStyle = chartOptions.base.style.drawings as DrawingStyleOptions;
    const style = deepMerge(
        defaultStyle as DeepRequired<DrawingStyleOptions>,
        (spec.style ?? {}) as DrawingStyleOptions
    );
    const id = spec.id ?? generateDrawingShapeId();
    const pts = [...spec.points];

    switch (spec.type) {
        case ShapeType.Line:
            return new LineShape({points: pts}, style, id);
        case ShapeType.Rectangle:
            return new RectangleShape({points: pts}, style, id);
        case ShapeType.Circle:
            return new CircleShape({points: pts}, style, id);
        case ShapeType.Triangle:
            return new TriangleShape({points: pts}, style, id);
        case ShapeType.Angle:
            return new AngleShape({points: pts}, style, id);
        case ShapeType.Arrow:
            return new ArrowShape({points: pts}, style, id);
        case ShapeType.Polyline:
            return new Polyline({points: pts}, style, id);
        case ShapeType.CustomSymbol:
            return new CustomSymbolShape(
                {
                    points: pts,
                    symbol: spec.symbol ?? '?',
                    size: spec.size ?? 20,
                },
                style,
                id
            );
        default:
            console.warn('[ChartEdge] drawingFromSpec: unsupported type', spec.type);
            return null;
    }
}

/** True when the payload should be treated as a partial patch (not a full replacement spec). */
export function isDrawingPatch(data: unknown): data is DrawingPatch {
    if (!data || typeof data !== 'object') return false;
    const o = data as Record<string, unknown>;
    if (typeof o.draw === 'function') return false;
    if (o.type != null && Array.isArray(o.points)) return false;
    return 'style' in o || 'points' in o || 'symbol' in o || 'size' in o;
}

/** Mutates {@code shape} in place: merges style, replaces points (and args) where needed, updates custom symbol fields. */
export function applyDrawingPatch(shape: IDrawingShape, patch: DrawingPatch): void {
    if (patch.style && Object.keys(patch.style).length > 0) {
        shape.style = deepMerge(shape.style as any, patch.style as any) as DrawingStyleOptions;
    }

    if (patch.points && patch.points.length > 0) {
        const next = [...patch.points];
        if (shape.type === ShapeType.Triangle) {
            const tri = shape as TriangleShape;
            if (next.length >= 3) {
                tri.points = next;
                tri.args.points = [...next];
            } else {
                tri.setPoints(next);
            }
        } else if (shape.type === ShapeType.Polyline) {
            const pl = shape as Polyline;
            pl.points.length = 0;
            pl.points.push(...next);
            pl.args.points = pl.points;
        } else {
            shape.points = next;
            const args = (shape as { args?: { points?: DrawingPoint[] } }).args;
            if (args && typeof args === 'object' && Array.isArray(args.points)) {
                args.points = next;
            }
        }
    }

    if (shape.type === ShapeType.CustomSymbol) {
        const cs = shape as CustomSymbolShape;
        if (patch.symbol !== undefined) {
            cs.symbol = patch.symbol;
            cs.args.symbol = patch.symbol;
        }
        if (patch.size !== undefined) {
            cs.size = patch.size;
            cs.args.size = patch.size;
        }
    }
}


export function validateAndNormalizeShape(
    shape: any,
    chartOptions: DeepRequired<ChartOptions>
): IDrawingShape | null {
    if (shape && typeof shape === 'object' && typeof shape.draw === 'function' && typeof shape.id === 'string') {
        if (!Array.isArray(shape.points)) {
            console.warn('Invalid shape instance: missing points', shape);
            return null;
        }
        const defaultStyle = chartOptions.base.style.drawings as DrawingStyleOptions;
        shape.style = deepMerge(defaultStyle as DeepRequired<DrawingStyleOptions>, shape.style ?? {});
        if (shape.type === ShapeType.Polyline) {
            const pl = shape as Polyline;
            pl.args.points = pl.points;
        } else {
            const args = shape.args as { points?: DrawingPoint[] } | undefined;
            if (args && typeof args === 'object' && Array.isArray(shape.points)) {
                args.points = [...shape.points];
            }
        }
        return shape as IDrawingShape;
    }

    if (shape && typeof shape === 'object' && shape.type && Array.isArray(shape.points)) {
        if (!Object.values(ShapeType).includes(shape.type)) {
            console.warn('Invalid shape type passed:', shape.type);
            return null;
        }
        return drawingFromSpec(
            {
                id: shape.id,
                type: shape.type as ShapeType,
                points: shape.points,
                style: shape.style,
                symbol: shape.symbol,
                size: shape.size,
            },
            chartOptions
        );
    }

    console.warn('Invalid shape: pass an IDrawingShape instance or DrawingSpec { type, points, ... }', shape);
    return null;
}