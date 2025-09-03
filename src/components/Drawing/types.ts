import {Mode} from "../../contexts/ModeContext";
import {LineShapeArgs} from "./LineShape";
import {RectangleShapeArgs} from "./RectangleShape";
import {CircleShapeArgs} from "./CircleShape";
import {TriangleShapeArgs} from "./TriangleShape";
import {AngleShapeArgs} from "./Angleshape";
import {PolylineShapeArgs} from "./Polyline";
import {ArrowShapeArgs} from "./ArrowShape";
import {CustomSymbolShapeArgs} from "./CustomSymbolShape";
import {DrawingStyleOptions} from "../../types/Drawings";

export type ShapeBaseArgs = {
    style?: Partial<Omit<DrawingStyleOptions, 'selected'>>;
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
    args: ShapeArgs;
}