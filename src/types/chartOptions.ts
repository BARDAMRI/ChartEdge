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

export interface TradingSession {
    dayOfWeek: number; // 0-6, where 0 is Sunday
    start: string; // 'HH:mm' format
    end: string; // 'HH:mm' format
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

export type NumberNotation = 'standard' | 'scientific' | 'compact';
export type CurrencyDisplay = 'symbol' | 'narrowSymbol' | 'code' | 'name';

export interface AxesStyleOptions {
    axisPosition: AxesPosition;
    textColor: string;
    font: string;
    lineColor: string;
    lineWidth: number;
    locale: string;
    language: string;
    numberFractionDigits: number; // Number of decimal places to format axis values
    decimalSeparator: string;
    thousandsSeparator: string;
    dateFormat: string;
    numberNotation?: NumberNotation;
    currency?: string;
    useCurrency?: boolean;
    currencyDisplay?: CurrencyDisplay;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    maximumSignificantDigits?: number;
    tickSize?: number;
    autoPrecision?: boolean;
    unit?: string;
    unitPlacement?: 'prefix' | 'suffix';
    timezone?: string; // e.g., 'America/New_York', 'Asia/Jerusalem'
    exchange?: string; // e.g., 'NYSE', 'TASE'
    tradingSessions?: TradingSession[];
    holidays?: string[]; // ISO 'YYYY-MM-DD'
    displayCurrency?: string;
    conversionRate?: number;
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
