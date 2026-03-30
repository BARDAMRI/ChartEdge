import {ShapeBaseArgs} from "../components/Drawing/types";
import {StrokeLineStyle} from "./overlay";

export interface DrawingPoint {
    time: number;
    price: number;
}

export interface CanvasPoint {
    x: number;
    y: number;
}


export interface DrawingStyleOptions {
    lineColor: string;
    lineWidth: number;
    lineStyle: StrokeLineStyle;
    fillColor: string; // such as 'rgba(255, 0, 0, 0.2)'

    selected: {
        lineColor: string;
        lineWidthAdd?: number;
        lineStyle?: StrokeLineStyle;
        fillColor?: string;
    }
}

export type FinalDrawingStyle = {
    lineColor: string;
    lineWidth: number;
    lineStyle: StrokeLineStyle;
    fillColor: string | 'transparent';
};


export interface AngleShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface PolylineShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface LineShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface RectangleShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface CircleShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface TriangleShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface ArrowShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface CustomSymbolShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
    symbol: string;
    size: number;
}