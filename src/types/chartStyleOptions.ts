// chartStyleOptions.ts

// Candles style
import {AxesPosition} from "./types";
import type {Interval} from "./Interval";
import type {TimeRange} from "./Graph";

export interface CandleStyleOptions {
    upColor?: string;
    downColor?: string;
    borderColor?: string;
    borderWidth?: number;
    bodyWidthFactor?: number;
    spacingFactor?: number;
}

// Grid style
export interface GridStyleOptions {
    gridSpacing?: number;
    lineColor?: string;
    lineWidth?: number;
    lineDash?: number[];
}

// Axes style
export interface AxesStyleOptions {
    axisPosition?: AxesPosition;
    textColor?: string;
    font?: string;
    lineColor?: string;
    lineWidth?: number;
    numberLocale?: string;
    dateLocale?: string;
    numberFractionDigits?: number; // Number of decimal places to format axis values
}

export interface LineOverlayOptions {
    color?: string;
    lineWidth?: number;
    dashed?: boolean;
}


export enum TimeDetailLevel {
    Auto = 'auto',
    Low = 'low',
    Medium = 'medium',
    High = 'high',
}

export enum ChartType {
    Candlestick = 'candlestick',
    Line = 'line',
    Area = 'area',
    Bar = 'bar',
    Histogram = 'histogram',
}


export interface ChartRenderContext {
    allCandles: Interval[];
    visibleStartIndex: number;
    visibleEndIndex: number;
    visibleRange: TimeRange;
    intervalSeconds: number;
}

// --- Nested Style Types ---
export interface CandleStyleOptions {
    bullColor?: string;
    bearColor?: string;
}

export interface LineStyleOptions {
    color?: string;
    lineWidth?: number;
}

export interface AreaStyleOptions {
    fillColor?: string;
    strokeColor?: string;
    lineWidth?: number;
}

export interface HistogramStyleOptions {
    bullColor?: string;
    bearColor?: string;
    opacity?: number;
}

// (Placeholders for your existing types)
export interface GridStyleOptions {
    color?: string;
    lineWidth?: number;
}

export interface AxesStyleOptions {
    labelColor?: string;
    lineColor?: string;
}

// --- Main Combined Interface ---
export interface ChartStyleOptions {
    candles?: CandleStyleOptions;
    line?: LineStyleOptions;
    area?: AreaStyleOptions;
    histogram?: HistogramStyleOptions;
    grid?: GridStyleOptions;
    axes?: AxesStyleOptions;
    backgroundColor?: string;
}