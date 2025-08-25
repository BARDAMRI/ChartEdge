import {ChartStyleOptions} from "./chartStyleOptions";

export enum AxesPosition {
    left,
    right,
}

export enum AlignOptions {
    left = 'left',
    center = 'center',
    right = 'right',
}

// Base chart options
interface BaseChartOptions {
    theme: 'light' | 'dark' | 'grey' | string;
    showOverlayLine: boolean;
    showHistogram: boolean;
    histogramHeightRatio: number; // Ratio of histogram height to chart height
    histogramOpacity: number;
    style: ChartStyleOptions;
}


// Candlestick chart data point (compact)
export interface CandleDataCompact {
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
}

export type AxesOptions = {
    yAxisPosition: AxesPosition;
    currency: string;
    numberOfYTicks: number;
}

export type ChartOptions = {
    base: BaseChartOptions;
    axes: AxesOptions;
}