// chartOptions.ts

import {AxesOptions, AxesPosition, ChartTheme} from "./types";
import type {Interval} from "./Interval";
import type {TimeRange} from "./Graph";
import {OverlayCalcSpec, OverlayKind, OverlayOptions, OverlayWithCalc} from "./overlay";
import {DrawingStyleOptions} from "./Drawings";

export enum TimeDetailLevel {
    Auto = 'auto',
    Low = 'low',
    Medium = 'medium',
    High = 'high',
}

export enum ChartType {
    Candlestick = 'Candlestick',
    Line = 'Line',
    Area = 'Area',
    Bar = 'Bar',
}


export interface ChartRenderContext {
    allIntervals: Interval[];
    visibleStartIndex: number;
    visibleEndIndex: number;
    visibleRange: TimeRange;
    intervalSeconds: number;
    canvasWidth: number;
    canvasHeight: number;
}

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
    heightRatio: number;
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

export type StyleOptions = {
    candles: CandleStyleOptions;
    line: LineStyleOptions;
    area: AreaStyleOptions;
    histogram: HistogramStyleOptions;
    bar: BarStyleOptions;
    grid: GridStyleOptions;
    overlay: OverlayOptions;
    axes: AxesStyleOptions;
    drawings: DrawingStyleOptions;
    showGrid: boolean;
    backgroundColor: string;
}

interface BaseChartOptions {
    chartType?: ChartType;
    theme: ChartTheme;
    showOverlayLine: boolean;
    showHistogram: boolean;
    style: StyleOptions;
    overlays?: OverlayWithCalc[];
    overlayKinds?: (OverlayKind | OverlayCalcSpec)[];
}

export type ChartOptions = {
    base: BaseChartOptions;
    axes: AxesOptions;
}
