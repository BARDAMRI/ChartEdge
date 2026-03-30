import {useMemo} from 'react';
import {IndexRangePair, PriceRange, TimeRange} from "../types/Graph";
import {Interval} from "../types/Interval";
import {ChartRenderContext} from "../types/chartOptions";
import {getBarIntervalSeconds} from "../components/Canvas/utils/helpers";

type VisibleRangeInput = TimeRange & Partial<{startIndex: number; endIndex: number}>;

export function useChartData(
    intervalsArray: Interval[],
    visibleRange: VisibleRangeInput,
    currentPoint: { x: number; y: number } | null,
    canvasWidth: number,
    canvasHeight: number
): { renderContext: ChartRenderContext | null; intervalSeconds: number } {
    const intervalSeconds = useMemo(
        () => getBarIntervalSeconds(intervalsArray, 3600),
        [intervalsArray]
    );

    const visibleCandles = useMemo<IndexRangePair>(() => {
        const n = intervalsArray.length;
        if (!n || intervalSeconds <= 0 || visibleRange == null) {
            return {startIndex: 0, endIndex: 0};
        }
        const {start, end} = visibleRange;
        if (start == null || end == null) {
            return {startIndex: 0, endIndex: 0};
        }
        const si = visibleRange.startIndex;
        const ei = visibleRange.endIndex;
        if (
            typeof si === 'number' &&
            typeof ei === 'number' &&
            si >= 0 &&
            ei >= 0 &&
            si <= ei &&
            si < n &&
            ei < n
        ) {
            return {startIndex: si, endIndex: ei};
        }
        const firstTime = intervalsArray[0]!.t;
        const startIndex = Math.floor((start - firstTime) / intervalSeconds);
        const endIndex = Math.ceil((end - firstTime) / intervalSeconds);
        return {
            startIndex: Math.max(0, startIndex),
            endIndex: Math.min(n - 1, endIndex),
        };
    }, [
        intervalsArray,
        intervalSeconds,
        visibleRange.start,
        visibleRange.end,
        visibleRange.startIndex,
        visibleRange.endIndex,
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