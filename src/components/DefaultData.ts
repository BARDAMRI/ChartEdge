import {AxesPosition, DeepRequired} from "../types/types";
import {
    AreaStyleOptions, AxesStyleOptions,
    BarStyleOptions,
    CandleStyleOptions, ChartOptions, ChartType, GridStyleOptions,
    HistogramStyleOptions,
    LineStyleOptions, StyleOptions
} from "../types/chartOptions";
import {OverlayOptions} from "../types/overlay";
import {DrawingStyleOptions} from "../types/Drawings";

const CANDLES_DEFAULT_STYLE: DeepRequired<CandleStyleOptions> = {
    bullColor: "#26a69a",
    bearColor: "#ef5350",
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderColor: "#333333",
    borderWidth: 1,
    bodyWidthFactor: 0.6,
    spacingFactor: 0.2,
}
const LINE_DEFAULT_STYLE: DeepRequired<LineStyleOptions> = {
    color: "#2962ff",
    lineWidth: 2,
}
const AREA_DEFAULT_STYLE: DeepRequired<AreaStyleOptions> = {
    fillColor: "rgba(41, 98, 255, 0.2)",
    strokeColor: "rgba(41, 98, 255, 1)",
    lineWidth: 2,
}
const HISTOGRAM_DEFAULT_STYLE: DeepRequired<HistogramStyleOptions> = {
    bullColor: "#26a69a",
    bearColor: "#ef5350",
    opacity: 0.5,
    heightRatio: 0.3,
}
const BAR_DEFAULT_STYLE: DeepRequired<BarStyleOptions> = {
    bullColor: "#26a69a",
    bearColor: "#ef5350",
    opacity: 0.7,
}
const GRID_DEFAULT_STYLE: DeepRequired<GridStyleOptions> = {
    color: "#e0e0e0",
    lineWidth: 1,
    gridSpacing: 50,
    lineColor: "#e0e0e0",
    lineDash: [],
}
const OVERLAY_DEFAULT_STYLE: DeepRequired<OverlayOptions> = {
    lineColor: "#ff9800", // Orange
    lineWidth: 1,
    lineStyle: "solid",
}
const AXES_DEFAULT_STYLE: DeepRequired<AxesStyleOptions> = {
    axisPosition: AxesPosition.left,
    textColor: "#424242",
    font: "12px Arial",
    lineColor: "#9e9e9e",
    lineWidth: 1,
    numberLocale: "en-US",
    dateLocale: "en-US",
    numberFractionDigits: 2,
}
const DRAWINGS_DEFAULT_STYLE: DeepRequired<DrawingStyleOptions> = {
    lineColor: "#2196f3", // A nice blue
    lineWidth: 2,
    lineStyle: "solid",
    fillColor: "rgba(33, 150, 243, 0.2)", // Semi-transparent version of the line color
    selected: {
        lineColor: "#ff9800", // Orange for highlight, consistent with overlays
        lineWidthAdd: 1, // Make the line thicker when selected
        lineStyle: "dashed", // Make the line dashed to indicate selection
        fillColor: "rgba(255, 152, 0, 0.3)", // Semi-transparent orange fill
    },
}
const DEFAULT_STYLES: DeepRequired<StyleOptions> = {
    candles: CANDLES_DEFAULT_STYLE,
    line: LINE_DEFAULT_STYLE,
    area: AREA_DEFAULT_STYLE,
    histogram: HISTOGRAM_DEFAULT_STYLE,
    bar: BAR_DEFAULT_STYLE,
    grid: GRID_DEFAULT_STYLE,
    overlay: OVERLAY_DEFAULT_STYLE,
    axes: AXES_DEFAULT_STYLE,
    drawings: DRAWINGS_DEFAULT_STYLE,
    backgroundColor: "#ffffff",
    showGrid: true,
};
export const DEFAULT_GRAPH_OPTIONS: DeepRequired<ChartOptions> = {
    base: {
        chartType: ChartType.Candlestick,
        theme: 'light',
        showOverlayLine: false,
        showHistogram: true,
        style: DEFAULT_STYLES,
        overlays: [],
        overlayKinds: [],
    },
    axes: {
        yAxisPosition: AxesPosition.left,
        currency: 'USD',
        numberOfYTicks: 5,
    }
};
