export interface TimeRange {
    start: number;
    end: number;
}

export interface Tick {
    position: number;
    label: string;
}

export interface PriceRange {
    min: number;
    max: number;
    range: number;
}

/**
 * Visible time window (unix **seconds**) with bar index span, plus the price band used for Y scaling.
 * Use `ref.getVisibleRanges()` on the stage or product host (same numbers as `getViewInfo()` / `getChartContext().data`).
 */
export type VisibleViewRanges = {
    time: TimeRange & { startIndex: number; endIndex: number };
    price: PriceRange;
};

export interface DrawTicksOptions {
    tickHeight: number;
    tickColor: string;
    labelColor: string;
    labelFont: string;
    labelOffset: number;
    axisY: number;
}

export type IndexRangePair = {
    startIndex: number;
    endIndex: number;
}
export type ChartDimensionsData = {
    cssWidth: number;
    cssHeight: number;
    dpr: number;
    width: number;
    height: number;
    clientWidth: number;
    clientHeight: number;
}