// chartStyleOptions.ts

// Candles style
import {AxesPosition} from "./types";

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

// Main Chart style options
export interface ChartStyleOptions {
    candles?: CandleStyleOptions;
    grid?: GridStyleOptions;
    axes?: AxesStyleOptions;
    lineOverlay?: LineOverlayOptions;
    backgroundColor?: string;
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