import React, {useEffect, useRef, useState} from 'react';
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
import {Candle} from "../../types/Candle";
import {TimeDetailLevel} from "../../types/chartStyleOptions";
import {AxesPosition} from "../../types/types";

export interface CanvasSizes {
    width: number;
    height: number;
}

// Logger utility
class DebugLogger {
    private logs: string[] = [];

    log(message: string, data?: any) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
        this.logs.push(logEntry);
        console.log(message, data);
    }

    getLogs() {
        return this.logs.join('\n\n');
    }

    downloadLogs() {
        const logContent = this.getLogs();
        const blob = new Blob([logContent], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resize-debug-${new Date().toISOString().slice(0, 19)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clear() {
        this.logs = [];
    }
}

const logger = new DebugLogger();

interface ChartStageProps {
    initialCandles: Candle[];
    initialYAxisPosition: AxesPosition;
    initialMargin: number;
    initialNumberOfYTicks: number;
    initialXAxisHeight: number;
    initialYAxisWidth: number;
    initialTimeDetailLevel: TimeDetailLevel;
    initialTimeFormat12h: boolean;
    initialVisibleRange: TimeRange;
}

export const ChartStage: React.FC<ChartStageProps> = ({
                                                          initialCandles,
                                                          initialYAxisPosition,
                                                          initialMargin,
                                                          initialNumberOfYTicks,
                                                          initialXAxisHeight,
                                                          initialYAxisWidth,
                                                          initialTimeDetailLevel,
                                                          initialTimeFormat12h,
                                                          initialVisibleRange,
                                                      }) => {
    const [canvasSizes, setCanvasSizes] = useState<CanvasSizes>({width: 0, height: 0});
    const [logCount, setLogCount] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [candles, setCandles] = useState(initialCandles);
    const [yAxisPosition, setYAxisPosition] = useState(initialYAxisPosition);
    const [margin, setMargin] = useState(initialMargin);
    const [numberOfYTicks, setNumberOfYTicks] = useState(initialNumberOfYTicks);
    const [xAxisHeight, setXAxisHeight] = useState(initialXAxisHeight);
    const [yAxisWidth, setYAxisWidth] = useState(initialYAxisWidth);
    const [timeDetailLevel, setTimeDetailLevel] = useState<TimeDetailLevel>(initialTimeDetailLevel);
    const [timeFormat12h, setTimeFormat12h] = useState(initialTimeFormat12h);
    const [visibleRange, setVisibleRange] = useState<TimeRange>(() => {
        if (initialVisibleRange) return initialVisibleRange;
        const now = Date.now();
        return {start: now - 7 * 24 * 60 * 60 * 1000, end: now}; // default last 7 days
    });

    const [minPrice, maxPrice] = React.useMemo(() => {
        if (!candles || candles.length === 0) return [0, 0];
        const prices = candles.flatMap(c => [c.l, c.h]);
        return [Math.min(...prices), Math.max(...prices)];
    }, [candles]);

    useEffect(() => {
        if (!containerRef.current) return;

        const element = containerRef.current;

        if (!element)
            return;
        // Initial size logging
        const initialRect = element.getBoundingClientRect();
        logger.log('🔷 Initial container size:', {
            width: initialRect.width,
            height: initialRect.height,
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight
        });

        // Log computed styles that might affect sizing
        const computedStyle = window.getComputedStyle(element);
        logger.log('🔷 Container computed styles:', {
            width: computedStyle.width,
            height: computedStyle.height,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight,
            maxWidth: computedStyle.maxWidth,
            maxHeight: computedStyle.maxHeight,
            boxSizing: computedStyle.boxSizing,
            display: computedStyle.display,
            flexGrow: computedStyle.flexGrow,
            flexShrink: computedStyle.flexShrink,
            flexBasis: computedStyle.flexBasis,
            overflow: computedStyle.overflow
        });

        // Check parent chain (up to 3 levels)
        let parent = element.parentElement;
        let level = 1;
        while (parent && level <= 3) {
            const parentRect = parent.getBoundingClientRect();
            const parentStyle = window.getComputedStyle(parent);
            logger.log(`🔷 Parent ${level} (${parent.className}):`, {
                size: {width: parentRect.width, height: parentRect.height},
                minWidth: parentStyle.minWidth,
                maxWidth: parentStyle.maxWidth,
                display: parentStyle.display,
                overflow: parentStyle.overflow,
                flexGrow: parentStyle.flexGrow,
                flexShrink: parentStyle.flexShrink
            });
            parent = parent.parentElement;
            level++;
        }

        const resizeObserver = new ResizeObserver(entries => {
            logger.log('🟢 ResizeObserver triggered!');
            setLogCount(prev => prev + 1);

            for (let entry of entries) {
                const {width, height} = entry.contentRect;
                const {target} = entry;

                logger.log('🟢 ResizeObserver data:', {
                    contentRect: {width, height},
                    borderBoxSize: entry.borderBoxSize?.[0],
                    contentBoxSize: entry.contentBoxSize?.[0],
                    targetClass: (target as HTMLElement).className,
                    currentCanvasSizes: canvasSizes
                });

                // Also log current element measurements
                const currentRect = element.getBoundingClientRect();
                logger.log('🟢 Current element measurements:', {
                    getBoundingClientRect: {width: currentRect.width, height: currentRect.height},
                    clientSize: {width: element.clientWidth, height: element.clientHeight},
                    offsetSize: {width: element.offsetWidth, height: element.offsetHeight}
                });

                setCanvasSizes(prev => {
                    if (prev.width !== width || prev.height !== height) {
                        logger.log('🔄 Updating canvas sizes:', {
                            from: prev,
                            to: {width, height},
                            change: {
                                width: width - prev.width,
                                height: height - prev.height
                            }
                        });
                        return {width, height};
                    }
                    logger.log('🚫 No size change, keeping previous:', prev);
                    return prev;
                });
            }
        });

        // Add window resize listener for comparison
        const handleWindowResize = () => {
            const windowSize = {width: window.innerWidth, height: window.innerHeight};
            const elementRect = element.getBoundingClientRect();
            logger.log('🌍 Window resize:', {
                window: windowSize,
                element: {width: elementRect.width, height: elementRect.height}
            });
            setLogCount(prev => prev + 1);
        };

        window.addEventListener('resize', handleWindowResize);
        resizeObserver.observe(element);

        logger.log('🔷 ResizeObserver attached to element:', {className: element.className});

        return () => {
            logger.log('🔴 Cleaning up ResizeObserver');
            window.removeEventListener('resize', handleWindowResize);
            resizeObserver.disconnect();
        };
    }, []);

    // Log every render
    logger.log('🔄 ChartStage render:', {
        canvasSizes,
        containerRefCurrent: !!containerRef.current
    });

    const [currentPoint, setCurrentPoint] = useState<null | { x: number; y: number }>(null);
    const [drawings, setDrawings] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<null | number>(null);
    const [startPoint, setStartPoint] = useState<null | { x: number; y: number }>(null);

    const setCandlesAndVisibleRange = (newCandles: Candle[], newVisibleRange: TimeRange) => {
        setCandles(newCandles);
        setVisibleRange(newVisibleRange);
    };

    return (
        <ChartStageContainer className={'chart-stage-container'} ref={containerRef} style={{margin: `${margin}px`}}>
            {yAxisPosition === 'left' && (
                <RightYAxisContainer className={'right-axis-container'} style={{width: `${yAxisWidth}px`}}>
                    <YAxis
                        parentContainerRef={containerRef}
                        canvasSizes={canvasSizes}
                        maxPrice={maxPrice}
                        minPrice={minPrice}
                        numberOfYTicks={numberOfYTicks}
                        xAxisHeight={xAxisHeight}
                        yAxisPosition={yAxisPosition}
                        yAxisWidth={yAxisWidth}
                    />
                </RightYAxisContainer>
            )}

            <CanvasAxisContainer className={'canvas-axis-container'}
                style={{
                    width: `${canvasSizes.width - (yAxisWidth + 40)}px`,
                    marginLeft: `${yAxisPosition === 'left' ? 0 : 40}px`,
                    marginRight: `${yAxisPosition === 'right' ? 0 : 40}px`,
                }}
            >
                <CanvasContainer className={'canvas-container'}>
                    <ChartCanvas
                        parentContainerRef={containerRef}
                        candlesToUse={candles}
                        currentPoint={currentPoint}
                        drawings={drawings}
                        isDrawing={isDrawing}
                        maxPrice={maxPrice}
                        minPrice={minPrice}
                        padding={10}
                        selectedIndex={selectedIndex}
                        setCandlesAndVisibleRange={setCandlesAndVisibleRange}
                        setCurrentPoint={setCurrentPoint}
                        setDrawings={setDrawings}
                        setIsDrawing={setIsDrawing}
                        setSelectedIndex={setSelectedIndex}
                        setStartPoint={setStartPoint}
                        setVisibleRange={setVisibleRange}
                        startPoint={startPoint}
                        visibleRange={visibleRange}
                        xAxisHeight={xAxisHeight}
                    />
                </CanvasContainer>

                <XAxisContainer className={'x-axis-container'} style={{height: `${xAxisHeight}px`}}>
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
                <LeftYAxisContainer className={'left-axis-container'} style={{width: `${yAxisWidth}px`}}>
                    <YAxis
                        parentContainerRef={containerRef}
                        canvasSizes={canvasSizes}
                        maxPrice={maxPrice}
                        minPrice={minPrice}
                        numberOfYTicks={numberOfYTicks}
                        xAxisHeight={xAxisHeight}
                        yAxisPosition={yAxisPosition}
                        yAxisWidth={yAxisWidth}
                    />
                </LeftYAxisContainer>
            )}
        </ChartStageContainer>
    );
};