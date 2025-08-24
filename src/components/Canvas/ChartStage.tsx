import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {ChartCanvas} from './ChartCanvas';
import XAxis from "./Axes/XAxis";
import YAxis from "./Axes/YAxis";
import {
    ChartStageContainer,
    CanvasAxisContainer,
    CanvasContainer,
    LeftYAxisContainer,
    RightYAxisContainer,
    XAxisContainer
} from '../../styles/ChartStage.styles';
import {TimeRange} from "../../types/Graph";
import {Interval} from "../../types/Interval";
import {ChartStyleOptions, ChartType, TimeDetailLevel} from "../../types/chartStyleOptions";
import {AxesPosition} from "../../types/types";
import {findPriceRange} from "./utils/GraphDraw";
import {DrawingPoint} from '../../types/Drawings';
import { useElementSize } from '../../hooks/useElementSize';
export interface CanvasSizes {
    width: number;
    height: number;
}

interface ChartStageProps {
    intervalsArray: Interval[];
    yAxisPosition: AxesPosition;
    numberOfYTicks: number;
    xAxisHeight: number;
    yAxisWidth: number;
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
    visibleRange: TimeRange;
    setVisibleRange: (range: TimeRange) => void;
    chartType: ChartType;
    styleOptions: ChartStyleOptions;
    drawings: any[];
    isDrawing: boolean;
    selectedIndex: number | null;
    startPoint: DrawingPoint | null;
    setDrawings: (drawings: any[] | ((prev: any[]) => any[])) => void;
    setIsDrawing: (value: boolean) => void;
    setSelectedIndex: (index: number | null) => void;
    setStartPoint: (point: DrawingPoint | null) => void;
}

export const ChartStage: React.FC<ChartStageProps> = ({
                                                          intervalsArray,
                                                          yAxisPosition,
                                                          numberOfYTicks,
                                                          xAxisHeight,
                                                          yAxisWidth,
                                                          timeDetailLevel,
                                                          timeFormat12h,
                                                          visibleRange,
                                                          setVisibleRange,
                                                          chartType,
                                                          styleOptions,
                                                          drawings,
                                                          isDrawing,
                                                          selectedIndex,
                                                          startPoint,
                                                          setDrawings,
                                                          setIsDrawing,
                                                          setSelectedIndex,
                                                          setStartPoint,
                                                      }) => {
    const {ref: containerRef, size: canvasSizes} = useElementSize<HTMLDivElement>();

    const {min: minPrice, max: maxPrice} = useMemo(() => {
        const arr = intervalsArray ?? [];
        const n = arr.length;
        if (n === 0) return {min: 0, max: 100, range: 100};

        // Robust intervalSeconds (median of deltas)
        const deltas: number[] = [];
        for (let i = 1; i < n; i++) deltas.push(arr[i].t - arr[i - 1].t);
        deltas.sort((a, b) => a - b);
        const intervalSeconds = deltas.length
            ? deltas[Math.floor(deltas.length / 2)]
            : 3600;

        // Clip visible window to data bounds
        const dataStart = arr[0].t;
        const dataEnd = arr[n - 1].t + intervalSeconds;
        const clipStart = Math.max(visibleRange.start, dataStart);
        const clipEnd = Math.min(visibleRange.end, dataEnd);
        if (clipEnd <= clipStart) return findPriceRange(arr, 0, 0); // or early default

        const center = (i: number) => arr[i].t + intervalSeconds / 2;

        // lowerBound: first i with center(i) >= clipStart
        let lo = 0, hi = n - 1, startIdx = n;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (center(mid) >= clipStart) {
                startIdx = mid;
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        }

        // upperBound: first i with center(i) > clipEnd  → endIdx = ub - 1
        lo = 0;
        hi = n - 1;
        let ub = n;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (center(mid) > clipEnd) {
                ub = mid;
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        }
        const endIdx = Math.max(startIdx, ub - 1);

        const visibleStartIndex = Math.max(0, Math.min(startIdx, n - 1));
        const visibleEndIndex = Math.max(visibleStartIndex, Math.min(endIdx, n - 1));

        return findPriceRange(arr, Math.max(0, visibleStartIndex - 1), Math.min(n - 1, visibleEndIndex + 1));
    }, [intervalsArray, visibleRange]);

    return (
        <ChartStageContainer ref={containerRef}>
            {yAxisPosition === 'left' && (
                <RightYAxisContainer style={{width: `${yAxisWidth}px`}}>
                    <YAxis
                        yAxisPosition={yAxisPosition}
                        xAxisHeight={xAxisHeight}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        numberOfYTicks={numberOfYTicks}
                    />
                </RightYAxisContainer>
            )}

            <CanvasAxisContainer>
                <CanvasContainer>
                    <ChartCanvas
                        intervalsArray={intervalsArray}
                        drawings={drawings}
                        isDrawing={isDrawing}
                        selectedIndex={selectedIndex}
                        setDrawings={setDrawings}
                        setIsDrawing={setIsDrawing}
                        setSelectedIndex={setSelectedIndex}
                        setVisibleRange={setVisibleRange}
                        setStartPoint={setStartPoint}
                        startPoint={startPoint}
                        visibleRange={visibleRange}
                        xAxisHeight={xAxisHeight}
                        chartType={chartType}
                        styleOptions={styleOptions}
                    />
                </CanvasContainer>

                <XAxisContainer style={{height: `${xAxisHeight}px`}}>
                    <XAxis
                        canvasSizes={canvasSizes}
                        parentContainerRef={containerRef}
                        timeDetailLevel={timeDetailLevel}
                        timeFormat12h={timeFormat12h}
                        visibleRange={visibleRange}
                        xAxisHeight={xAxisHeight}
                    />
                </XAxisContainer>
            </CanvasAxisContainer>

            {yAxisPosition === 'right' && (
                <LeftYAxisContainer style={{width: `${yAxisWidth}px`}}>
                    <YAxis
                        yAxisPosition={yAxisPosition}
                        xAxisHeight={xAxisHeight}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        numberOfYTicks={numberOfYTicks}
                    />
                </LeftYAxisContainer>
            )}
        </ChartStageContainer>
    );
};