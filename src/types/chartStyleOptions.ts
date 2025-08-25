// chartStyleOptions.ts

// Candles style
import {AxesPosition} from "./types";
import type {Interval} from "./Interval";
import type {TimeRange} from "./Graph";

export enum TimeDetailLevel {
    Auto = 'auto',
    Low = 'low',
    Medium = 'medium',
    High = 'high',
}

export enum ChartType {
    Candlestick,
    Line,
    Area,
    Bar,
    // Histogram , // // moved to another canvas
}


export interface ChartRenderContext {
    allIntervals: Interval[];
    visibleStartIndex: number;
    visibleEndIndex: number;
    visibleRange: TimeRange;
    intervalSeconds: number;
}

// --- Nested Style Types ---
export interface CandleStyleOptions {
    bullColor: string;
    bearColor: string;
    upColor: string;
    downColor: string;
    borderColor: string;
    borderWidth: number;
    bodyWidthFactor: number;
    spacingFactor: number;
}

export interface LineStyleOptions {
    color: string;
    lineWidth: number;
}

export interface AreaStyleOptions {
    fillColor: string;
    strokeColor: string;
    lineWidth: number;
}

export interface HistogramStyleOptions {
    bullColor: string;
    bearColor: string;
    opacity: number;
}

export interface BarStyleOptions {
    bullColor: string;
    bearColor: string;
    opacity: number;
}

export interface GridStyleOptions {
    color: string;
    lineWidth: number;
    gridSpacing: number;
    lineColor: string;
    lineDash: number[];
}

export interface AxesStyleOptions {
    axisPosition: AxesPosition;
    textColor: string;
    font: string;
    lineColor: string;
    lineWidth: number;
    numberLocale: string;
    dateLocale: string;
    numberFractionDigits: number; // Number of decimal places to format axis values
}

// --- Main Combined Interface ---
export type ChartStyleOptions = {
    candles: CandleStyleOptions;
    line: LineStyleOptions;
    area: AreaStyleOptions;
    histogram: HistogramStyleOptions;
    bar: BarStyleOptions;
    grid: GridStyleOptions;
    axes: AxesStyleOptions;
    backgroundColor: string;
}