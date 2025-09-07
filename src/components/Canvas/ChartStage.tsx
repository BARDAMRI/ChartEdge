import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ChartCanvas} from './ChartCanvas';
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
import {ChartOptions, ChartType, TimeDetailLevel} from "../../types/chartOptions";
import {AxesPosition, DeepRequired, windowSpread} from "../../types/types";
import {useElementSize} from '../../hooks/useElementSize';
import {findPriceRange} from "./utils/helpers";
import {IDrawingShape} from "../Drawing/IDrawingShape";

// --- Simple helpers ---
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

    // lowerBound: first index whose center (t+half) >= vrange.start
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

    // upperBound: first index whose center (t+half) > vrange.end
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
    chartType: ChartType;
    selectedIndex: number | null;
    chartOptions: DeepRequired<ChartOptions>;
    showTopBar?: boolean;
    showLeftBar?: boolean;
}

export const ChartStage: React.FC<ChartStageProps> = ({
                                                          intervalsArray,
                                                          numberOfYTicks,
                                                          timeDetailLevel,
                                                          timeFormat12h,
                                                          chartType,
                                                          selectedIndex,
                                                          chartOptions
                                                          , showTopBar = true
                                                          , showLeftBar = true
                                                      }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const {ref: canvasAreaRef, size: canvasSizes} = useElementSize<HTMLDivElement>();
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

    function updateVisibleRange(newRangeTime: TimeRange) {
        if (!intervalsArray || intervalsArray.length === 0) return;
        // Derive a reasonable intervalSeconds for center-based bounds
        const intervalSeconds = getIntervalSeconds(intervalsArray, 60);
        const [startIndex, endIndex] = findVisibleIndexRange(intervalsArray, newRangeTime, intervalSeconds);
        setVisibleRange({...newRangeTime, startIndex, endIndex});
    }

    useEffect(() => {
        setVisibleRange(prev => {
            if (prev.start === 0 && prev.end === 0 && intervalsArray.length > 0) {
                return {
                    start: intervalsArray[0].t - 60,
                    end: intervalsArray[intervalsArray.length - 1].t + 60,
                    startIndex: 0,
                    endIndex: intervalsArray.length - 1
                };
            } else if (intervalsArray.length === 0) {
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
    }, []);


    useEffect(() => {
        const vr = visibleRange;
        const n = intervalsArray?.length ?? 0;
        if (n === 0) return;
        if (!(vr.end > vr.start)) return; // invalid time window
        if (vr.startIndex > vr.endIndex) return; // nothing visible

        // Clamp indices to data bounds
        const s = Math.max(0, Math.min(vr.startIndex, n - 1));
        const e = Math.max(s, Math.min(vr.endIndex, n - 1));

        // Slight padding on the window to avoid chopping extremes
        const paddedStart = Math.max(0, s - 1);
        const paddedEnd = Math.min(n - 1, e + 1);
        const newPr = findPriceRange(intervalsArray, paddedStart, paddedEnd);

        if (
            newPr.min !== visiblePriceRange.min ||
            newPr.max !== visiblePriceRange.max ||
            newPr.range !== visiblePriceRange.range
        ) {
            setVisiblePriceRange(newPr);
        }
    }, [visibleRange, intervalsArray]);

    const gridRows = useMemo(() => (showTopBar ? `${windowSpread.TOP_BAR_PX}px 1fr` : `1fr`), [showTopBar]);
    const gridCols = useMemo(() => (showLeftBar ? `${windowSpread.LEFT_BAR_PX}px 1fr` : `1fr`), [showLeftBar]);

    return (
        <ChartStageContainer
            ref={containerRef}
            className={"chart-stage-container"}
            style={{
                gridTemplateRows: gridRows,
                gridTemplateColumns: gridCols,
            }}
        >
            {showTopBar && (
                <TopBar
                    className="top-toolbar"
                    style={{gridColumn: showLeftBar ? '1 / span 2' : '1', height: windowSpread.TOP_BAR_PX}}
                />
            )}

            {showLeftBar && (
                <LeftBar
                    className="left-toolbar"
                    style={{gridRow: showTopBar ? 2 : 1, width: windowSpread.LEFT_BAR_PX}}
                />
            )}

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
                                        intervalsArray={intervalsArray}
                                        drawings={drawings}
                                        setDrawings={setDrawings}
                                        selectedIndex={selectedIndex}
                                        visibleRange={visibleRange}
                                        setVisibleRange={updateVisibleRange}
                                        visiblePriceRange={visiblePriceRange}
                                        chartType={chartType}
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
                                        intervalsArray={intervalsArray}
                                        drawings={drawings}
                                        setDrawings={setDrawings}
                                        selectedIndex={selectedIndex}
                                        visibleRange={visibleRange}
                                        setVisibleRange={updateVisibleRange}
                                        visiblePriceRange={visiblePriceRange}
                                        chartType={chartType}
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
};