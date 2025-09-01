export interface TimeRange {
    start: number;
    end: number;
}

export interface Tick {
    position: number; // x axis position in pixels
    label: string;    //  label text to display
}

export interface PriceRange {
    min: number;      // minimum price in the range
    max: number;      // maximum price in the range
    range: number;    // total range (max - min)
}

export interface DrawTicksOptions {
    tickHeight: number;      // tick height in pixels
    tickColor: string;       // tick line color
    labelColor: string;      // text color for labels
    labelFont: string;       // text font for labels
    labelOffset: number;     // distance from tick to label in pixels
    axisY: number;          // y position of the axis line in pixels
}

export type IndexRangePair = {
    startIndex: number;
    endIndex: number;
}
export type ChartDimensionsData = {
    cssWidth: number;      // width of the chart in CSS pixels
    cssHeight: number;     // height of the chart in CSS pixels
    dpr: number;           // device pixel ratio
    width: number;        // width of the chart in device pixels
    height: number;       // height of the chart in device pixels
    clientWidth: number;   // width of the chart container in CSS pixels
    clientHeight: number;  // height of the chart container in CSS pixels
}