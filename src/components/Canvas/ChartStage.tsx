import React, {useEffect, useMemo, useRef, useState} from 'react';
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

export interface CanvasSizes {
    width: number;
    height: number;
}

// ⭐ 1. The props interface is now corrected to accept drawing state and setters.
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
    const [canvasSizes, setCanvasSizes] = useState<CanvasSizes>({width: 0, height: 0});
    const containerRef = useRef<HTMLDivElement | null>(null);

    const {min: minPrice, max: maxPrice} = useMemo(() => {
        if (!intervalsArray || intervalsArray.length === 0) {
            return {min: 0, max: 100, range: 100};
        }

        const intervalSeconds = intervalsArray.length > 1 ? intervalsArray[1].t - intervalsArray[0].t : 3600;
        const startIndex = intervalsArray.findIndex(c => c.t + intervalSeconds >= visibleRange.start);
        const endIndex = intervalsArray.findLastIndex(c => c.t <= visibleRange.end);

        const visibleStartIndex = Math.max(0, startIndex);
        const visibleEndIndex = Math.min(intervalsArray.length - 1, endIndex === -1 ? intervalsArray.length - 1 : endIndex);

        return findPriceRange(intervalsArray, visibleStartIndex, visibleEndIndex);
    }, [intervalsArray, visibleRange]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const {width, height} = entry.contentRect;
                setCanvasSizes({width, height});
            }
        });
        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, []);

    // ⭐ 2. The local state for drawings has been removed. We now use the props passed from the parent.

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
                    {/* ⭐ 3. All drawing-related props are correctly passed down to ChartCanvas */}
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