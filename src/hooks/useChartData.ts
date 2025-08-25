import {useMemo} from 'react';
import {IndexRangePair, TimeRange} from "../types/Graph";
import {Interval} from "../types/Interval";
import {ChartRenderContext} from "../types/chartOptions";

export function useChartData(
    intervalsArray: Interval[],
    visibleRange: TimeRange,
    currentPoint: { x: number; y: number } | null,
    canvasWidth: number,
    canvasHeight: number
): { renderContext: ChartRenderContext | null; hoveredCandle: Interval | null; intervalSeconds: number } {
    const intervalSeconds = useMemo(() => {
        if (intervalsArray.length < 2) return 3600; // Fallback to 1 hour
        return intervalsArray[1].t - intervalsArray[0].t;
    }, [intervalsArray]);

    const visibleCandles = useMemo<IndexRangePair>(() => {
        if (!intervalsArray.length || !visibleRange.end || intervalSeconds <= 0) {
            return {startIndex: 0, endIndex: 0};
        }

        const firstTime = intervalsArray[0].t;
        const startIndex = Math.floor((visibleRange.start - firstTime) / intervalSeconds);
        const endIndex = Math.ceil((visibleRange.end - firstTime) / intervalSeconds);

        return {
            startIndex: Math.max(0, startIndex),
            endIndex: Math.min(intervalsArray.length - 1, endIndex),
        };
    }, [intervalsArray, visibleRange, intervalSeconds]);

    const hoveredCandle = useMemo<Interval | null>(() => {
        if (!currentPoint || !canvasWidth || !intervalsArray.length || isNaN(currentPoint.x)) {
            return null;
        }
        const mouseTime = visibleRange.start + (currentPoint.x / canvasWidth) * (visibleRange.end - visibleRange.start);
        return intervalsArray.find(c => mouseTime >= c.t && mouseTime < c.t + intervalSeconds) || null;
    }, [currentPoint, canvasWidth, visibleRange, intervalsArray, intervalSeconds]);

    const renderContext = useMemo<ChartRenderContext | null>(() => {
        // Don't generate a context if the canvas has no size, to prevent drawing errors.
        if (canvasWidth === 0 || canvasHeight === 0) {
            return null;
        }

        return {
            allIntervals: intervalsArray,
            visibleStartIndex: visibleCandles.startIndex,
            visibleEndIndex: visibleCandles.endIndex,
            visibleRange,
            intervalSeconds,
            canvasWidth,
            canvasHeight,
        };
    }, [
        intervalsArray,
        visibleCandles,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight,
    ]);

    return {renderContext, hoveredCandle, intervalSeconds};
}