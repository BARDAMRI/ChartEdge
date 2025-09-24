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

    const visiblePriceRange = useMemo<PriceRange>(() => {
        const {startIndex, endIndex} = visibleCandles;
        if (startIndex >= endIndex || !intervalsArray.length) {
            return {min: 0, max: 100, range: 100};
        }

        const candlesOnScreen = intervalsArray.slice(startIndex, endIndex + 1);

        let min = Infinity;
        let max = -Infinity;

        for (const candle of candlesOnScreen) {
            if (candle.l < min) min = candle.l;
            if (candle.h > max) max = candle.h;
        }

        // Add padding
        const padding = (max - min) * 0.1;
        const finalMin = min - padding;
        const finalMax = max + padding;

        // Return the object in the correct structure
        return {
            min: finalMin,
            max: finalMax,
            range: finalMax - finalMin,
        };
    }, [intervalsArray, visibleCandles]);

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
        visibleCandles,
        visiblePriceRange,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight,
    ]);

    return {renderContext, intervalSeconds};
}