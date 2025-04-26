import {ChartStyleOptions} from "./chartStyleOptions";

// Enum for Axis position
export enum AxesPosition {
    left = 'left',
    right = 'right',
}

// Base chart options
interface BaseChartOptions {
    theme?: 'light' | 'dark' | 'grey' | string;
    showOverlayLine?: boolean;
    style?: Partial<ChartStyleOptions>;
}

// Line chart data point
export interface LineData {
    time: number;
    value: number;
}

// Candlestick chart data point (full)
export interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

// Candlestick chart data point (compact)
export interface CandleDataCompact {
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
}

// Line chart options
export interface LineChartOptions extends BaseChartOptions {
    type: 'line';
    data: LineData[];
}

// Candlestick chart options
export interface CandleChartOptions extends BaseChartOptions {
    type: 'candlestick';
    data: (CandleData | CandleDataCompact)[];
}

// Unified ChartOptions type
export type ChartOptions = LineChartOptions | CandleChartOptions;