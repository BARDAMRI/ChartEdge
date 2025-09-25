import {Mode} from "../../contexts/ModeContext";
import {
    AngleShapeArgs, ArrowShapeArgs,
    CircleShapeArgs, CustomSymbolShapeArgs,
    DrawingPoint,
    DrawingStyleOptions,
    LineShapeArgs, PolylineShapeArgs,
    RectangleShapeArgs, TriangleShapeArgs
} from "../../types/Drawings";

export type ShapeBaseArgs = {
    points: DrawingPoint[];
}
export type ShapeArgs =
    LineShapeArgs
    | RectangleShapeArgs
    | CircleShapeArgs
    | TriangleShapeArgs
    | AngleShapeArgs
    | PolylineShapeArgs
    | ArrowShapeArgs
    | CustomSymbolShapeArgs;

export type Drawing = {
    mode: Mode;
    args?: ShapeArgs;
    style?: DrawingStyleOptions;
}


export enum ShapeType {
    Line = "Line",
    Rectangle = "Rectangle",
    Circle = "Circle",
    Triangle = "Triangle",
    Angle = "Angle",
    Arrow = "Arrow",
    Polyline = "Polyline",
    CustomSymbol = "CustomSymbol",
}