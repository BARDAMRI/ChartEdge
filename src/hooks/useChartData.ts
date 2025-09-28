import {useMemo} from 'react';
import {IndexRangePair, PriceRange, TimeRange} from "../types/Graph";
import {Interval} from "../types/Interval";
import {ChartRenderContext} from "../types/chartOptions";


export function useChartData(
    intervalsArray: Interval[],
    visibleRange: TimeRange,
    currentPoint: { x: number; y: number } | null,
    canvasWidth: number,
    canvasHeight: number
): { renderContext: ChartRenderContext | null; intervalSeconds: number } {
    const intervalSeconds = useMemo(() => {
        if (intervalsArray.length < 2) return 3600;
        return intervalsArray[1].t - intervalsArray[0].t;
    }, [
        intervalsArray.length,
        intervalsArray[0]?.t,
        intervalsArray[1]?.t,
    ]);

    const visibleCandles = useMemo<IndexRangePair>(() => {
        if (!intervalsArray.length || intervalSeconds <= 0 || visibleRange == null) {
            return { startIndex: 0, endIndex: 0 };
        }
        const { start, end } = visibleRange as TimeRange;
        if (start == null || end == null) {
            return { startIndex: 0, endIndex: 0 };
        }
        const firstTime = intervalsArray[0].t;
        const startIndex = Math.floor((start - firstTime) / intervalSeconds);
        const endIndex = Math.ceil((end - firstTime) / intervalSeconds);
        return {
            startIndex: Math.max(0, startIndex),
            endIndex: Math.min(intervalsArray.length - 1, endIndex),
        };
    }, [
        intervalsArray.length,
        intervalsArray[0]?.t,
        intervalSeconds,
        visibleRange?.start,
        visibleRange?.end,
    ]);

    const visiblePriceRange: PriceRange = (() => {
        const { startIndex, endIndex } = visibleCandles;
        if (startIndex >= endIndex || !intervalsArray.length) {
            return { min: 0, max: 100, range: 100 };
        }
        let min = Infinity;
        let max = -Infinity;
        for (let i = startIndex; i <= endIndex; i++) {
            const c = intervalsArray[i];
            if (!c) continue;
            if (c.l < min) min = c.l;
            if (c.h > max) max = c.h;
        }
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            return { min: 0, max: 100, range: 100 };
        }
        const paddingBase = Math.max(0, max - min);
        const padding = paddingBase * 0.1;
        const finalMin = min - padding;
        const finalMax = max + padding;
        return { min: finalMin, max: finalMax, range: finalMax - finalMin };
    })();

    const renderContext = useMemo<ChartRenderContext | null>(() => {
        if (canvasWidth === 0 || canvasHeight === 0) {
            return null;
        }
        return {
            allIntervals: intervalsArray,
            visibleStartIndex: visibleCandles.startIndex,
            visibleEndIndex: visibleCandles.endIndex,
            visiblePriceRange,
            visibleRange,
            intervalSeconds,
            canvasWidth,
            canvasHeight,
        };
    }, [
        intervalsArray,
        visibleCandles.startIndex,
        visibleCandles.endIndex,
        visiblePriceRange.min,
        visiblePriceRange.max,
        visiblePriceRange.range,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight,
    ]);

    return {renderContext, intervalSeconds};
}