// drawings.ts

export type DrawingType = 'line' | 'free' | 'rectangle' | 'square' | 'circle';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export type RectangleType = 'rectangle' | 'square'

export interface DrawingBase {
    type: DrawingType;
    color: string;        // Hex color like '#ff0000'
    lineWidth: number;    // Width of the line
    lineStyle: LineStyle; // solid, dashed, or dotted
}

export interface LineDrawing extends DrawingBase {
    type: 'line';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface FreeLineDrawing extends DrawingBase {
    type: 'free';
    points: { x: number; y: number }[];
}

export interface RectangleDrawing extends DrawingBase {
    type: RectangleType;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface CircleDrawing extends DrawingBase {
    type: 'circle';
    centerX: number;
    centerY: number;
    radius: number;
}

export type Drawing = LineDrawing | FreeLineDrawing | RectangleDrawing | CircleDrawing;