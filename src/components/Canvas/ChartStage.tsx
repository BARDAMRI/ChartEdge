import React, {useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle} from 'react';
import {ChartCanvas, ChartCanvasHandle} from './ChartCanvas';
import XAxis from "./Axes/XAxis";
import YAxis from "./Axes/YAxis";
import {
    CanvasAxisContainer,
    CanvasContainer,
    ChartStageContainer, ChartView, LeftBar,
    LeftYAxisContainer,
    RightYAxisContainer, TopBar,
    XAxisContainer
} from '../../styles/ChartStage.styles';
import {PriceRange, TimeRange} from "../../types/Graph";
import {Interval} from "../../types/Interval";
import {ChartOptions, TimeDetailLevel} from "../../types/chartOptions";
import {AxesPosition, DeepRequired, windowSpread} from "../../types/types";
import {useElementSize} from '../../hooks/useElementSize';
import {findPriceRange} from "./utils/helpers";
import {IDrawingShape} from "../Drawing/IDrawingShape";
import {validateAndNormalizeShape} from "../Drawing/drawHelper";


const median = (nums: number[]): number => {
    if (nums.length === 0) return 0;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

function getIntervalSeconds(arr: Interval[], fallbackSeconds = 60): number {
    if (!arr || arr.length <= 1) return Math.max(1, fallbackSeconds);
    const deltas: number[] = [];
    for (let i = 1; i < arr.length; i++) {
        const d = Math.max(0, arr[i].t - arr[i - 1].t);
        deltas.push(d);
    }
    deltas.sort((a, b) => a - b);
    const m = median(deltas);
    return Math.max(1, Math.round(m || fallbackSeconds));
}

function findVisibleIndexRange(arr: Interval[], vrange: TimeRange, intervalSeconds: number): [number, number] {
    const n = arr?.length ?? 0;
    if (n === 0) return [0, 0];
    const half = intervalSeconds / 2;

    let lo = 0, hi = n - 1, start = n;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].t + half >= vrange.start) {
            start = mid;
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }

    lo = 0;
    hi = n - 1;
    let ub = n;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].t + half > vrange.end) {
            ub = mid;
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }

    const end = Math.max(start, ub - 1);
    const s = Math.max(0, Math.min(start, n - 1));
    const e = Math.max(s, Math.min(end, n - 1));
    return [s, e];
}

interface ChartStageProps {
    intervalsArray: Interval[];
    numberOfYTicks: number;
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
    selectedIndex: number | null;
    chartOptions: DeepRequired<ChartOptions>;
    showTopBar?: boolean;
    showLeftBar?: boolean;
}

export interface ChartStageHandle {
    addShape: (shape: IDrawingShape) => void;
    updateShape: (shapeId: string, newShape: IDrawingShape) => void;
    deleteShape: (shapeId: string) => void;
    addInterval: (interval: Interval) => void;
    updateInterval: (index: number, newInterval: Interval) => void;
    deleteInterval: (index: number) => void;
    getViewInfo: () => {
        intervals: Interval[];
        drawings: IDrawingShape[];
        visibleRange: TimeRange & { startIndex: number; endIndex: number };
        visiblePriceRange: PriceRange;
        canvasSize: { width: number; height: number; dpr: number };
    };
    getCanvasSize: () => { width: number; height: number; dpr: number };
    clearCanvas: () => void;
    redrawCanvas: () => void;
    reloadCanvas: () => void;
}

export const ChartStage = forwardRef<ChartStageHandle, ChartStageProps>(({
                                                                             intervalsArray,
                                                                             numberOfYTicks,
                                                                             timeDetailLevel,
                                                                             timeFormat12h, selectedIndex,
                                                                             chartOptions
                                                                             , showTopBar = true
                                                                             , showLeftBar = true
                                                                         }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const {ref: canvasAreaRef, size: canvasSizes} = useElementSize<HTMLDivElement>();
    const [intervals, setIntervals] = useState<Interval[]>(intervalsArray);
    const [visibleRange, setVisibleRange] = React.useState<TimeRange & {
        startIndex: number,
        endIndex: number
    }>({start: 0, end: 0, startIndex: 0, endIndex: 0});
    const [visiblePriceRange, setVisiblePriceRange] = React.useState<PriceRange>({
        min: Math.min(...intervalsArray.map(inter => inter?.l || 0)),
        max: Math.max(...intervalsArray.map(inter => inter?.h || 0)),
        range: Math.max(...intervalsArray.map(inter => inter?.h || 0)) - Math.min(...intervalsArray.map(inter => inter?.l || 0))
    });
    const [drawings, setDrawings] = useState<IDrawingShape[]>([]);
    const canvasRef = useRef<ChartCanvasHandle | null>(null);

    useEffect(() => {
        setIntervals(intervalsArray);
    }, [intervalsArray]);

    function updateVisibleRange(newRangeTime: TimeRange) {
        if (!intervals || intervals.length === 0) return;
        const intervalSeconds = getIntervalSeconds(intervals, 60);
        const [startIndex, endIndex] = findVisibleIndexRange(intervals, newRangeTime, intervalSeconds);
        setVisibleRange({...newRangeTime, startIndex, endIndex});
    }

    useEffect(() => {
        setVisibleRange(prev => {
            if (prev.start === 0 && prev.end === 0 && intervals.length > 0) {
                return {
                    start: intervals[0].t - 60,
                    end: intervals[intervals.length - 1].t + 60,
                    startIndex: 0,
                    endIndex: intervals.length - 1
                };
            } else if (intervals.length === 0) {
                const d_now = Date.now();
                return {
                    start: Math.floor((d_now - 7 * 24 * 60 * 60 * 1000) / 1000),
                    end: Math.floor(d_now / 1000),
                    startIndex: 0,
                    endIndex: 0
                };
            }
            return prev;
        });
    }, [intervals]);


    useEffect(() => {
        const vr = visibleRange;
        const n = intervals?.length ?? 0;
        if (n === 0) return;
        if (!(vr.end > vr.start)) return;
        if (vr.startIndex > vr.endIndex) return;

        const s = Math.max(0, Math.min(vr.startIndex, n - 1));
        const e = Math.max(s, Math.min(vr.endIndex, n - 1));

        const paddedStart = Math.max(0, s - 1);
        const paddedEnd = Math.min(n - 1, e + 1);
        const newPr = findPriceRange(intervals, paddedStart, paddedEnd);

        if (
            newPr.min !== visiblePriceRange.min ||
            newPr.max !== visiblePriceRange.max ||
            newPr.range !== visiblePriceRange.range
        ) {
            setVisiblePriceRange(newPr);
        }
    }, [visibleRange, intervals]);

    useImperativeHandle(ref, () => ({
        addShape(shape: IDrawingShape) {
            const normalized = validateAndNormalizeShape(shape, chartOptions);
            if (!normalized) return;
            setDrawings(prev => [...prev, normalized]);
        },
        updateShape(shapeId: string, newShape: IDrawingShape) {
            const normalized = validateAndNormalizeShape(newShape, chartOptions);
            if (!normalized) return;
            setDrawings(prev => prev.map(s => s.id === shapeId ? normalized : s));
        },
        deleteShape(shapeId: string) {
            setDrawings(prev => prev.filter(s => s.id !== shapeId));
        },
        addInterval(interval: Interval) {
            setIntervals(prev => {
                const newIntervals = [...prev, interval];
                newIntervals.sort((a, b) => a.t - b.t);
                return newIntervals;
            });
        },
        updateInterval(index: number, newInterval: Interval) {
            setIntervals(prev => {
                if (index < 0 || index >= prev.length) return prev;
                const newIntervals = [...prev];
                newIntervals[index] = newInterval;
                newIntervals.sort((a, b) => a.t - b.t);
                return newIntervals;
            });
        },
        deleteInterval(index: number) {
            setIntervals(prev => {
                if (index < 0 || index >= prev.length) return prev;
                const newIntervals = [...prev];
                newIntervals.splice(index, 1);
                return newIntervals;
            });
        },
        getViewInfo() {
            return {
                intervals,
                drawings,
                visibleRange,
                visiblePriceRange,
                canvasSize: canvasRef.current?.getCanvasSize() ?? {width: 0, height: 0, dpr: 1},
            };
        },
        getCanvasSize() {
            return canvasRef.current?.getCanvasSize() ?? {width: 0, height: 0, dpr: 1};
        },
        clearCanvas() {
            canvasRef.current?.clearCanvas();
            setDrawings([]);
        },
        redrawCanvas() {
            canvasRef.current?.redrawCanvas();
        },
        reloadCanvas() {
            setVisibleRange({
                start: intervals.length > 0 ? intervals[0].t - 60 : 0,
                end: intervals.length > 0 ? intervals[intervals.length - 1].t + 60 : 0,
                startIndex: 0,
                endIndex: intervals.length > 0 ? intervals.length - 1 : 0
            });
            setDrawings([]);
        }
    }));
    
    return (
        <ChartStageContainer
            ref={containerRef}
            className={"chart-stage-container"}
            style={{
                gridTemplateRows: 1,
                gridTemplateColumns: 1,
            }}
        >

            <ChartView
                className="chart-main-cell"
                $yAxisWidth={windowSpread.INITIAL_Y_AXIS_WIDTH}
                $xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                style={{
                    gridRow: showTopBar ? 2 : 1,
                    gridColumn: showLeftBar ? 2 : 1,
                }}
            >
                {chartOptions.axes.yAxisPosition === AxesPosition.left ? (
                    <>
                        <LeftYAxisContainer
                            className="left-y-axis-container"
                            style={{width: `${windowSpread.INITIAL_Y_AXIS_WIDTH}px`}}
                        >
                            <YAxis
                                yAxisPosition={AxesPosition.left}
                                xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                                minPrice={visiblePriceRange.min}
                                maxPrice={visiblePriceRange.max}
                                numberOfYTicks={numberOfYTicks}
                            />
                        </LeftYAxisContainer>

                        <CanvasAxisContainer
                            className="canvas-axis-container"
                        >
                            <CanvasContainer ref={canvasAreaRef} className="canvas-container">
                                {canvasSizes?.width > 0 && canvasSizes?.height > 0 && (
                                    <ChartCanvas
                                        ref={canvasRef}
                                        intervalsArray={intervals}
                                        drawings={drawings}
                                        setDrawings={setDrawings}
                                        selectedIndex={selectedIndex}
                                        visibleRange={visibleRange}
                                        setVisibleRange={updateVisibleRange}
                                        visiblePriceRange={visiblePriceRange}
                                        chartOptions={chartOptions}
                                        canvasSizes={canvasSizes}
                                        windowSpread={windowSpread}
                                    />
                                )}
                            </CanvasContainer>

                            <XAxisContainer className="x-axis-container">
                                <XAxis
                                    canvasSizes={canvasSizes}
                                    parentContainerRef={containerRef}
                                    timeDetailLevel={timeDetailLevel}
                                    timeFormat12h={timeFormat12h}
                                    visibleRange={visibleRange}
                                    xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                                />
                            </XAxisContainer>
                        </CanvasAxisContainer>
                    </>
                ) : (
                    <>
                        <CanvasAxisContainer
                            className="canvas-axis-container"
                            style={{gridColumn: 1, gridRow: '1 / span 2'}}
                        >
                            <CanvasContainer ref={canvasAreaRef} className="canvas-container">
                                {canvasSizes?.width > 0 && canvasSizes?.height > 0 && (
                                    <ChartCanvas
                                        ref={canvasRef}
                                        intervalsArray={intervals}
                                        drawings={drawings}
                                        setDrawings={setDrawings}
                                        selectedIndex={selectedIndex}
                                        visibleRange={visibleRange}
                                        setVisibleRange={updateVisibleRange}
                                        visiblePriceRange={visiblePriceRange}
                                        chartOptions={chartOptions}
                                        canvasSizes={canvasSizes}
                                        windowSpread={windowSpread}
                                    />
                                )}
                            </CanvasContainer>

                            <XAxisContainer className="x-axis-container">
                                <XAxis
                                    canvasSizes={canvasSizes}
                                    parentContainerRef={containerRef}
                                    timeDetailLevel={timeDetailLevel}
                                    timeFormat12h={timeFormat12h}
                                    visibleRange={visibleRange}
                                    xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                                />
                            </XAxisContainer>
                        </CanvasAxisContainer>

                        <RightYAxisContainer
                            className="right-y-axis-container"
                            style={{width: `${windowSpread.INITIAL_Y_AXIS_WIDTH}px`}}
                        >
                            <YAxis
                                yAxisPosition={AxesPosition.right}
                                xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                                minPrice={visiblePriceRange.min}
                                maxPrice={visiblePriceRange.max}
                                numberOfYTicks={numberOfYTicks}
                            />
                        </RightYAxisContainer>
                    </>
                )}
            </ChartView>
        </ChartStageContainer>
    );
});