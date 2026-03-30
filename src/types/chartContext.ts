import type {ChartType, TimeDetailLevel} from './chartOptions';
import type {AxesPosition, ChartTheme} from './types';

/**
 * Serializable snapshot of chart layout, data window, and interaction state for host-side analysis
 * (sizing, visible ranges, symbol, selection). Obtain via {@link TickUpHostHandle.getChartContext}
 * or {@link TickUpStageHandle.getChartContext}. The **`data`** fields for visible time/price match
 * {@link TickUpHostHandle.getVisibleRanges} / {@link TickUpStageHandle.getVisibleRanges} (`time` ↔ `visibleTime*`, `price` ↔ `visiblePrice*`).
 */
export type ChartContextInfo = {
    /** Toolbar symbol if controlled/initial value is known */
    symbol: string | null;
    chartType: ChartType;
    themeVariant: ChartTheme;
    layout: {
        /** Measured CSS size of the canvas container (the main plot host element). */
        canvasContainer: { width: number; height: number };
        yAxisWidthPx: number;
        xAxisHeightPx: number;
        yAxisPosition: AxesPosition;
    };
    /** Backing canvas pixel dimensions and device pixel ratio (from the chart canvas handle). */
    canvas: { width: number; height: number; dpr: number };
    data: {
        intervalCount: number;
        firstBarTime: number | null;
        lastBarTime: number | null;
        visibleTimeStart: number;
        visibleTimeEnd: number;
        visibleTimeStartIndex: number;
        visibleTimeEndIndex: number;
        visiblePriceMin: number;
        visiblePriceMax: number;
        visiblePriceRange: number;
    };
    drawings: { count: number };
    interaction: {
        /** Drawing index in the internal stack, or null if none selected */
        selectedShapeIndex: number | null;
    };
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
    numberOfYTicks: number;
};
