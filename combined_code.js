// File: src/components/Canvas/Axes/XAxis.tsx
import React, {useEffect, useRef} from 'react';
import {CanvasSizes} from "../ChartStage";
import {TimeRange} from "../../../types/Graph";
import {TimeDetailLevel} from "../../../types/chartStyleOptions";

interface XAxisProps {
    canvasSizes: CanvasSizes;
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    xAxisHeight: number;
    visibleRange: TimeRange;
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
}

export default function XAxis({
                                  canvasSizes,
                                  xAxisHeight,
                                  visibleRange,
                                  timeDetailLevel,
                                  timeFormat12h,
                                  parentContainerRef ,
                              }: XAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dpr = window.devicePixelRatio || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // Draw X-axis line
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.font = `${12}px Arial`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.stroke();

        // TODO: Uncomment and implement ticks drawing using visibleRange, timeDetailLevel, timeFormat12h
        // const ticks = generateTimeTicks(
        //     visibleRange.start,
        //     visibleRange.end,
        //     width,
        //     timeDetailLevel,
        //     timeFormat12h
        // );
        // ticks.forEach(({ time, label }) => {
        //     const x = ((time - visibleRange.start) / (visibleRange.end - visibleRange.start)) * width;
        //     ctx.beginPath();
        //     ctx.moveTo(x, 0);
        //     ctx.lineTo(x, 5);
        //     ctx.stroke();
        //     ctx.fillText(label, x, 12);
        // });
    }, [xAxisHeight, visibleRange, timeDetailLevel, timeFormat12h, canvasSizes, parentContainerRef]);

    return (
        <canvas
            className="x-canvas relative block bottom-0 left-0 w-full h-full p-0 m-0 bg-white border-none pointer-events-none"
            ref={canvasRef}
            style={{height: xAxisHeight}}
        />
    );
}


// File: src/components/Canvas/Axes/YAxis.tsx
import React, {useEffect, useRef} from 'react';
import {CanvasSizes} from "../ChartStage";

interface YAxisProps {
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    canvasSizes: CanvasSizes;
    yAxisPosition: 'left' | 'right';
    xAxisHeight: number;
    yAxisWidth: number;
    minPrice: number;
    maxPrice: number;
    numberOfYTicks: number;
}

export default function YAxis({
                                  parentContainerRef,
                                  canvasSizes,
                                  yAxisWidth,
                                  xAxisHeight,
                                  yAxisPosition,
                                  minPrice,
                                  maxPrice,
                                  numberOfYTicks
                              }: YAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dpr = window.devicePixelRatio || 1;

    function calculateTicks(): { y: number; value: number }[] {
        const y_axis_height = parentContainerRef?.current?.clientHeight || 0;
        const y_axis_width = yAxisWidth || 40; // Default width if not set
        const step = (maxPrice - minPrice) / (numberOfYTicks - 1);
        //TODO complete this function.
        return []
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const y_axis_canvas_height = canvas.clientHeight;
        const y_axis_canvas_width = canvas.clientWidth; // Default width if not set

        canvas.height = y_axis_canvas_height * dpr;
        canvas.width = y_axis_canvas_width * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.font = `${12 * dpr}px Arial`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = yAxisPosition === 'left' ? 'right' : 'left';

        ctx.beginPath();
        ctx.moveTo(y_axis_canvas_width, (y_axis_canvas_height - xAxisHeight + 1));
        ctx.lineTo(y_axis_canvas_width, 0);
        ctx.stroke();

        // const ticks = calculateTicks();
        // ticks.forEach(({y, value}) => {
        //     ctx.beginPath();
        //     ctx.moveTo(yAxisX, y);
        //     ctx.lineTo(yAxisPosition === 'left' ? yAxisX - 5 : yAxisX + 5, y);
        //     ctx.stroke();
        //
        //     const text = value.toFixed(2);
        //     const textWidth = ctx.measureText(text).width;
        //     const offsetX = yAxisPosition === 'left' ? yAxisX - 10 - textWidth : yAxisX + 10;
        //
        //     ctx.fillText(text, offsetX, y);
        // });
    }, [parentContainerRef, yAxisWidth, minPrice, maxPrice, numberOfYTicks, yAxisPosition, dpr, canvasSizes]);

    return (
        <canvas
            className={`y-canvas block relative left-${yAxisPosition === 'left' ? 0 : 'auto'} right-${yAxisPosition === 'right' ? 0 : 'auto'} top-0 bottom-0 pointer-events-none w-[100%] h-[100%]`}
            ref={canvasRef}
        />
    );
}

// File: src/components/Canvas/ChartCanvas.tsx
import React, {useRef, useEffect} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {TimeRange} from "../../types/Graph";
import type {Candle} from "../../types/Candle";

type DrawingFactoryMap = Partial<Record<Mode, () => any>>;

interface ChartCanvasProps {
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    isDrawing: boolean;
    setIsDrawing: (value: boolean) => void;
    startPoint: { x: number; y: number } | null;
    setStartPoint: (point: { x: number; y: number } | null) => void;
    currentPoint: { x: number; y: number } | null;
    setCurrentPoint: (point: { x: number; y: number } | null) => void;
    drawings: any[];
    setDrawings: (drawings: any[] | ((prev: any[]) => any[])) => void;
    selectedIndex: number | null;
    setSelectedIndex: (index: number | null) => void;
    visibleRange: TimeRange;
    setVisibleRange: (range: TimeRange) => void;
    setCandlesAndVisibleRange: (candles: Candle[], visibleRange: TimeRange) => void;
    xAxisHeight: number;
    padding: number;
    minPrice: number;
    maxPrice: number;
    candlesToUse: Candle[];
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
                                                            parentContainerRef,
                                                            candlesToUse,
                                                            setCandlesAndVisibleRange,
                                                            setVisibleRange,
                                                            visibleRange,
                                                            drawings,
                                                            isDrawing,
                                                            setIsDrawing,
                                                            currentPoint,
                                                            padding,
                                                            setCurrentPoint,
                                                            setDrawings,
                                                            startPoint,
                                                            setStartPoint,
                                                            maxPrice,
                                                            minPrice,
                                                            selectedIndex,
                                                            setSelectedIndex,
                                                            xAxisHeight,
                                                        }) => {
    const mode = useMode().mode;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const defaultVisibleRange: TimeRange = {
        start: oneYearAgo,
        end: now,
    };

    useEffect(() => {
        if (!visibleRange || visibleRange.start === 0 || visibleRange.end === 0) {
            setVisibleRange(defaultVisibleRange);
        }
    }, [candlesToUse, visibleRange, setVisibleRange]);

    useEffect(() => {
        setCandlesAndVisibleRange(candlesToUse, visibleRange || {start: 0, end: Date.now()});
    }, [candlesToUse, visibleRange, setCandlesAndVisibleRange]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (mode === Mode.select) {
            for (let i = 0; i < drawings.length; i++) {
                const d = drawings[i];
                let shape = null;
                if (d.mode === Mode.drawLine) {
                    // @ts-ignore
                    shape = new LineShape(d.args.startX, d.args.startY, d.args.endX, d.args.endY);
                } else if (d.mode === Mode.drawRectangle) {
                    // @ts-ignore
                    shape = new RectangleShape(d.args.x, d.args.y, d.args.width, d.args.height);
                } else if (d.mode === Mode.drawCircle) {
                    // @ts-ignore
                    shape = new CircleShape(d.args.centerX, d.args.centerY, d.args.radius);
                }
                if (shape && shape.isHit(x, y)) {
                    setSelectedIndex(i);
                    return;
                }
            }
            setSelectedIndex(null);
            return;
        }

        if (mode !== Mode.none) {
            setStartPoint({x, y});
            setIsDrawing(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint || mode === Mode.none) return;
        if (!canvasRef.current) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentPoint({x, y});
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint || mode === Mode.none) return;
        if (!canvasRef || !canvasRef.current) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setDrawings(prev => {
            const newDrawing: DrawingFactoryMap = {
                [Mode.drawLine]: () => ({
                    mode: Mode.drawLine,
                    args: {
                        startX: startPoint!.x,
                        startY: startPoint!.y,
                        endX: x,
                        endY: y,
                    },
                }),
                [Mode.drawRectangle]: () => ({
                    mode: Mode.drawRectangle,
                    args: {
                        x: startPoint!.x,
                        y: startPoint!.y,
                        width: x - startPoint!.x,
                        height: y - startPoint!.y,
                    },
                }),
                [Mode.drawCircle]: () => {
                    const dx = x - startPoint!.x;
                    const dy = y - startPoint!.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);
                    return {
                        mode: Mode.drawCircle,
                        args: {
                            centerX: startPoint!.x,
                            centerY: startPoint!.y,
                            radius,
                        },
                    };
                }
            };

            if (mode in newDrawing) {
                return [...prev, newDrawing[mode]!()];
            } else {
                return prev;
            }
        });

        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
    };

    return (
        <div
            className="inner-canvas-container relative"
            style={{width: '100%', height: `calc(100% - ${xAxisHeight}px)`}}
            ref={containerRef}
        >
            <canvas
                className="canvas flex relative w-full h-full p-0 m-0 bg-white border-none pointer-events-auto"
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
        </div>
    );
};

// File: src/components/Canvas/ChartStage.tsx
import React, {useEffect, useRef, useState} from 'react';
import {ChartCanvas} from './ChartCanvas';
import XAxis from "./Axes/XAxis";
import YAxis from "./Axes/YAxis";
import '../../styles/Canvas/ChartStage.scss';
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
                                                          intervalsArray,
                                                          initialYAxisPosition ,
                                                          initialMargin,
                                                          initialNumberOfYTicks,
                                                          initialXAxisHeight,
                                                          initialYAxisWidth,
                                                          initialTimeDetailLevel,
                                                          initialTimeFormat12h,
                                                          visibleRange,
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

        // logger.log('🔷 ResizeObserver attached to element:', {className: element.className});

        return () => {
            logger.log('🔴 Cleaning up ResizeObserver');
            window.removeEventListener('resize', handleWindowResize);
            resizeObserver.disconnect();
        };
    }, []);

    // Log every render
    // logger.log('🔄 ChartStage render:', {
    //     canvasSizes,
    //     containerRefCurrent: !!containerRef.current
    // });

    const [currentPoint, setCurrentPoint] = useState<null | {x: number; y: number}>(null);
    const [drawings, setDrawings] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<null | number>(null);
    const [startPoint, setStartPoint] = useState<null | {x: number; y: number}>(null);

    const setCandlesAndVisibleRange = (newCandles: Candle[], newVisibleRange: TimeRange) => {
        setCandles(newCandles);
        setVisibleRange(newVisibleRange);
    };

    return (
        <div
            ref={containerRef}
            style={{margin: `${margin}px`}}
            className="chart-stage-container flex w-full h-full"
        >
            {yAxisPosition === 'left' && (
                <div className="right-y-axis-container relative flex h-full" style={{width: `${yAxisWidth}px`}}>
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
                </div>
            )}

            <div
                className="canvas-axis-container relative flex h-full"
                style={{
                    width: `${canvasSizes.width - (yAxisWidth + 40)}px`,
                    marginLeft: `${yAxisPosition === 'left' ? 0 : 40}px`,
                    marginRight: `${yAxisPosition === 'right' ? 0 : 40}px`,
                }}
            >
                <div className="canvas-container relative">
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
                </div>
                <div
                    className="x-axis-container absolute bottom-0 left-0 w-full"
                    style={{height: `${xAxisHeight}px`}}
                >
                    <XAxis
                        canvasSizes={canvasSizes}
                        parentContainerRef={containerRef}
                        timeDetailLevel={timeDetailLevel}
                        timeFormat12h={timeFormat12h}
                        visibleRange={visibleRange}
                        xAxisHeight={xAxisHeight}
                    />
                </div>
            </div>

            {yAxisPosition === 'right' && (
                <div className="left-y-axis-container relative flex h-full" style={{width: `${yAxisWidth}px`}}>
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
                </div>
            )}
        </div>
    );
};

// File: src/components/Canvas/utils/drawCandlesticks.ts
import { Candle } from '../../../types/Candle';

export function drawCandlesticks(
  ctx: CanvasRenderingContext2D,
  candles: Candle[],
  visibleRange: { start: number; end: number },
  padding: number,
  minPrice: number,
  maxPrice: number,
  width: number,
  height: number
): void {
  const drawableWidth = width - 2 * padding;
  const drawableHeight = height - 2 * padding;

  const candleCount = visibleRange.end - visibleRange.start;
  if (candleCount <= 0) return;

  const candleSpacing = drawableWidth / candleCount;
  const candleWidth = candleSpacing * 0.6;

  const priceRange = maxPrice - minPrice;

  const priceToY = (price: number) => {
    return padding + drawableHeight * (1 - (price - minPrice) / priceRange);
  };

  const visibleCandles = candles.slice(visibleRange.start, visibleRange.end);

  visibleCandles.forEach((candle, i) => {
    const x = padding + i * candleSpacing;
    const highY = priceToY(candle.h);
    const lowY = priceToY(candle.l);
    const openY = priceToY(candle.o);
    const closeY = priceToY(candle.c);

    const isUp = candle.c >= candle.o;

    ctx.strokeStyle = isUp ? 'green' : 'red';
    ctx.fillStyle = isUp ? 'green' : 'red';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, highY);
    ctx.lineTo(x + candleWidth / 2, lowY);
    ctx.stroke();

    const bodyY = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(openY - closeY));
    ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
  });
}


// File: src/components/Canvas/utils/drawDrawings.ts


import { Drawing } from '../../Drawing/types';
import { LineShape } from '../../Drawing/LineShape';
import { RectangleShape } from '../../Drawing/RectangleShape';
import { CircleShape } from '../../Drawing/CircleShape';
import { TriangleShape } from '../../Drawing/TriangleShape';
import { Polyline } from '../../Drawing/Polyline';
import { ArrowShape } from '../../Drawing/ArrowShape';
import { CustomSymbolShape } from '../../Drawing/CustomSymbolShape';
import { Mode } from '../../../contexts/ModeContext';
import {AngleShape} from "../../Drawing/Angleshape";

export function drawDrawings(
  ctx: CanvasRenderingContext2D,
  drawings: Drawing[],
  selectedIndex: number | null,
  width: number,
  height: number
): void {
  drawings.forEach((d, index) => {
    ctx.beginPath();
    let shape = null;
    switch (d.mode) {
      case Mode.drawLine:
        shape = new LineShape(
          d.args.startX,
          d.args.startY,
          d.args.endX,
          d.args.endY
        );
        break;
      case Mode.drawRectangle:
        shape = new RectangleShape(
          d.args.x,
          d.args.y,
          d.args.width,
          d.args.height
        );
        break;
      case Mode.drawCircle:
        shape = new CircleShape(
          d.args.centerX,
          d.args.centerY,
          d.args.radius
        );
        break;
      case Mode.drawTriangle:
        shape = new TriangleShape(
          d.args.x1,
          d.args.y1,
          d.args.x2,
          d.args.y2,
          d.args.x3,
          d.args.y3
        );
        break;
      case Mode.drawAngle:
        shape = new AngleShape(
          d.args.x0,
          d.args.y0,
          d.args.x1,
          d.args.y1,
          d.args.x2,
          d.args.y2
        );
        break;
      case Mode.drawPolyline:
        shape = new Polyline(d.args.points);
        break;
      case Mode.drawArrow:
        shape = new ArrowShape(
          d.args.fromX,
          d.args.fromY,
          d.args.toX,
          d.args.toY
        );
        break;
      case Mode.drawCustomSymbol:
        shape = new CustomSymbolShape(
          d.args.x,
          d.args.y,
          d.args.symbol,
          d.args.size,
          d.args.color
        );
        break;
      default:
        break;
    }

    if (shape) {
      if (selectedIndex === index) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
      }
      shape.draw(ctx);
      ctx.stroke();
    }
  });
}

// File: src/components/Canvas/utils/drawOverlay.ts
import { Mode } from '../../../contexts/ModeContext';

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  mode: Mode,
  isDrawing: boolean,
  startPoint: { x: number; y: number } | null,
  currentPoint: { x: number; y: number } | null,
  width: number,
  height: number
) {
  if (!isDrawing || !startPoint || !currentPoint) return;

  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  switch (mode) {
    case Mode.drawLine:
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      break;

    case Mode.drawRectangle:
      ctx.rect(
        Math.min(startPoint.x, currentPoint.x),
        Math.min(startPoint.y, currentPoint.y),
        Math.abs(currentPoint.x - startPoint.x),
        Math.abs(currentPoint.y - startPoint.y)
      );
      break;

    case Mode.drawCircle:
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      break;

    default:
      ctx.setLineDash([]);
      return;
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

// File: src/components/Canvas/utils/generateTimeTicks.ts
import { Tick } from "../../../types/Graph";

type TimeDetailLevel = 'auto' | 'low' | 'medium' | 'high';

export function generateTimeTicks(
    startTime: number,
    endTime: number,
    canvasWidth: number,
    timeDetailLevel: TimeDetailLevel,
    timeFormat12h: boolean,
    minPixelPerTick = 60,
): Tick[] {
    const ticks: Tick[] = [];
    const rangeMs = endTime - startTime;

    // Calculate time span in days
    const timeSpanDays = rangeMs / (24 * 60 * 60 * 1000);

    // Determine appropriate tick interval based on time span
    let interval: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
    let intervalStep = 1;

    if (timeSpanDays > 365 * 2) {
        interval = 'year';
        intervalStep = Math.ceil(timeSpanDays / 365 / 10); // Show approximately 10 years
    } else if (timeSpanDays > 60) {
        interval = 'month';
        intervalStep = Math.ceil(timeSpanDays / 30 / 12); // Show approximately 12 months
    } else if (timeSpanDays > 10) {
        interval = 'day';
        intervalStep = Math.ceil(timeSpanDays / 10); // Show approximately 10 days
    } else if (timeSpanDays > 1) {
        interval = 'hour';
        intervalStep = Math.ceil(timeSpanDays * 24 / 12); // Show approximately 12 hours
    } else if (timeSpanDays > 0.04) { // ~1 hour
        interval = 'minute';
        intervalStep = Math.ceil(timeSpanDays * 24 * 60 / 15); // Show approximately every 15 minutes
    } else {
        interval = 'second';
        intervalStep = Math.ceil(timeSpanDays * 24 * 60 * 60 / 15); // Show approximately every 15 seconds
    }

    // Override with user-selected detail level if not auto
    if (timeDetailLevel !== 'auto') {
        switch (timeDetailLevel) {
            case 'low':
                if (interval === 'year') intervalStep = Math.max(intervalStep, 2);
                else if (interval === 'month') interval = 'year';
                else if (interval === 'day') interval = 'month';
                else if (interval === 'hour') interval = 'day';
                else if (interval === 'minute') interval = 'hour';
                else interval = 'minute';
                break;
            case 'medium':
                // Keep default interval but maybe adjust step
                break;
            case 'high':
                if (interval === 'year') interval = 'month';
                else if (interval === 'month') interval = 'day';
                else if (interval === 'day') interval = 'hour';
                else if (interval === 'hour') interval = 'minute';
                else if (interval === 'minute') interval = 'second';
                intervalStep = 1;
                break;
        }
    }

    // Calculate max ticks based on canvas width
    const maxTicks = Math.floor(canvasWidth / minPixelPerTick);

    // Generate ticks based on interval
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Function to get next tick date based on interval
    function getNextTickDate(date: Date): Date {
        const newDate = new Date(date);
        switch (interval) {
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + intervalStep);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + intervalStep);
                break;
            case 'day':
                newDate.setDate(newDate.getDate() + intervalStep);
                break;
            case 'hour':
                newDate.setHours(newDate.getHours() + intervalStep);
                break;
            case 'minute':
                newDate.setMinutes(newDate.getMinutes() + intervalStep);
                break;
            case 'second':
                newDate.setSeconds(newDate.getSeconds() + intervalStep);
                break;
        }
        return newDate;
    }

    // Function to format date based on interval
    function formatTickLabel(date: Date): string {
        switch (interval) {
            case 'year':
                return date.getFullYear().toString();
            case 'month':
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });
            case 'day':
                return date.toLocaleString('default', { day: '2-digit', month: 'short' });
            case 'hour':
                return date.toLocaleString('default', { hour12: timeFormat12h, hour: '2-digit', minute: '2-digit' });
            case 'minute':
                return date.toLocaleString('default', { hour12: timeFormat12h, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            case 'second':
                return date.toLocaleString('default', { hour12: timeFormat12h, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    }
    
    // Find first tick (align to interval boundary)
    let currentDate = new Date(startDate);
    switch (interval) {
        case 'year':
            currentDate = new Date(currentDate.getFullYear(), 0, 1);
            break;
        case 'month':
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            break;
        case 'day':
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            break;
        case 'hour':
            currentDate = new Date(
                currentDate.getFullYear(), 
                currentDate.getMonth(), 
                currentDate.getDate(), 
                currentDate.getHours()
            );
            break;
        case 'minute':
            currentDate = new Date(
                currentDate.getFullYear(), 
                currentDate.getMonth(), 
                currentDate.getDate(), 
                currentDate.getHours(),
                Math.floor(currentDate.getMinutes() / intervalStep) * intervalStep
            );
            break;
        case 'second':
            currentDate = new Date(
                currentDate.getFullYear(), 
                currentDate.getMonth(), 
                currentDate.getDate(), 
                currentDate.getHours(),
                currentDate.getMinutes(),
                Math.floor(currentDate.getSeconds() / intervalStep) * intervalStep
            );
            break;
    }
    
    // If first tick is before start time, move to next tick
    if (currentDate.getTime() < startTime) {
        currentDate = getNextTickDate(currentDate);
    }
    
    // Generate ticks until we reach end time
    while (currentDate.getTime() <= endTime) {
        const tickTime = currentDate.getTime();
        const label = formatTickLabel(currentDate);
        
        ticks.push({ time: tickTime, label });
        currentDate = getNextTickDate(currentDate);
        
        // Safety check to prevent infinite loops
        if (ticks.length > 100) break;
    }
    
    // Ensure we don't have too many ticks for the available width
    if (ticks.length > maxTicks) {
        // Sample ticks evenly
        const step = Math.ceil(ticks.length / maxTicks);
        return ticks.filter((_, i) => i % step === 0);
    }
    
    return ticks;
}


// File: src/components/Canvas/utils/generateTicks.ts
import {
  startOfHour,
  startOfDay,
  startOfMonth,
  startOfYear,
  addHours,
  addDays,
  addMonths,
  addYears,
  format,
  differenceInHours,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';

interface TimeRange {
  start: number; // UNIX timestamp in milliseconds
  end: number;
}

interface Tick {
  position: number; // x axis position in pixels
  label: string;    //  label text to display
}

interface DrawTicksOptions {
  tickHeight?: number;      // tick height in pixels
  tickColor?: string;       // tick line color
  labelColor?: string;      // text color for labels
  labelFont?: string;       // text font for labels
  labelOffset?: number;     // distance from tick to label in pixels
  axisY?: number;          // y position of the axis line in pixels
}

export function generateAndDrawTimeTicks(
  canvas: HTMLCanvasElement,
  timeRange: TimeRange,
  numberOfXTicks: number,           // number of max ticks on the X axis
  timeFormat: string,              // the format of the time labels, e.g. 'DD/MM/YYYY HH:mm'
  timeFormat12h: boolean,          // the time format is 12h or 24h
  xAxisHeight: number,             // X axis height in pixels
  strokeStyle: string,             // line color for the ticks and labels
  timeDetailLevel: 'auto' | 'low' | 'medium' | 'high', // time detail level
  options: DrawTicksOptions = {}
): Tick[] {
  const { start, end } = timeRange;
  const canvasWidth = canvas.width;

  if (start >= end || canvasWidth <= 0 || numberOfXTicks <= 0) {
    return [];
  }

  const {
    tickHeight = 10,
    tickColor = strokeStyle,
    labelColor = strokeStyle,
    labelFont = '12px Arial',
    labelOffset = 15,
    axisY = canvas.height - xAxisHeight
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('cannot receive canvas context');
  }

  const durationMs = end - start;

  const startDate = new Date(start);
  const endDate = new Date(end);

  // check if the timeDetailLevel is set, otherwise determine it automatically
  let intervalFn: (date: Date, amount: number) => Date;
  let startOfFn: (date: Date) => Date;
  let diffFn: (dateLeft: Date, dateRight: Date) => number;
  let formatStr: string;

  const durationHours = differenceInHours(endDate, startDate);

  // choosing the appropriate time detail level based on the duration
  if (timeDetailLevel === 'high' || (timeDetailLevel === 'auto' && durationHours <= 12)) {
    // high detail - ticks every hour
    intervalFn = addHours;
    startOfFn = startOfHour;
    diffFn = differenceInHours;
    formatStr = timeFormat12h ? 'h:mm a' : 'HH:mm';
  } else if (timeDetailLevel === 'medium' || (timeDetailLevel === 'auto' && durationHours <= 24 * 7)) {
    // medium detail - ticks every day
    intervalFn = addDays;
    startOfFn = startOfDay;
    diffFn = differenceInDays;
    // use 'MMM DD' if the format includes 'DD', otherwise use 'MMM d'
    formatStr = timeFormat.includes('DD') ? 'MMM DD' : 'MMM d';
  } else if (timeDetailLevel === 'low' || (timeDetailLevel === 'auto' && durationHours <= 24 * 365)) {
    // low detail - ticks every month
    intervalFn = addMonths;
    startOfFn = startOfMonth;
    diffFn = differenceInMonths;
    formatStr = timeFormat.includes('YYYY') ? 'MMM YYYY' : 'MMM yyyy';
  } else {
    // minimal detail - ticks every year
    intervalFn = addYears;
    startOfFn = startOfYear;
    diffFn = differenceInYears;
    formatStr = timeFormat.includes('YYYY') ? 'YYYY' : 'yyyy';
  }

  // calculate the total number of units between start and end
  const totalUnits = diffFn(endDate, startDate);

  // if no units to display, return an empty array
  if (totalUnits <= 0) {
    return [];
  }

  // setting the step size for the ticks
  const step = Math.max(1, Math.ceil(totalUnits / numberOfXTicks));

  // creating an array to hold the ticks
  const ticks: Tick[] = [];

  // start from the first tick date
  let currentTickDate = startOfFn(startDate);

  // if the current tick date is before the start, move it to the first valid tick
  if (currentTickDate.getTime() < start) {
    currentTickDate = intervalFn(currentTickDate, step);
  }

  // creating ticks until we reach the end date
  while (currentTickDate.getTime() <= end) {
    const tickTime = currentTickDate.getTime();

    // calculating the position of the tick on the canvas
    const pos = ((tickTime - start) / durationMs) * canvasWidth;

    // only add the tick if it is within the canvas width
    if (pos >= 0 && pos <= canvasWidth) {
      const label = format(currentTickDate, formatStr);
      ticks.push({ position: pos, label });
    }

    // moving to the next tick date
    currentTickDate = intervalFn(currentTickDate, step);
  }

  // in case no ticks were generated, add the start and end dates as ticks
  if (ticks.length === 0) {
    ticks.push(
      { position: 0, label: format(startDate, formatStr) },
      { position: canvasWidth, label: format(endDate, formatStr) }
    );
  }

  // drawing the ticks on the canvas
  drawTicks(ctx, ticks, axisY, tickHeight, tickColor, labelColor, labelFont, labelOffset);

  return ticks;
}

function drawTicks(
  ctx: CanvasRenderingContext2D,
  ticks: Tick[],
  axisY: number,
  tickHeight: number,
  tickColor: string,
  labelColor: string,
  labelFont: string,
  labelOffset: number
): void {
  // drawing the axis line
  ctx.strokeStyle = tickColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, axisY);
  ctx.lineTo(ctx.canvas.width, axisY);
  ctx.stroke();

  // drawing each tick and its label
  ticks.forEach(tick => {
    ctx.strokeStyle = tickColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tick.position, axisY);
    ctx.lineTo(tick.position, axisY + tickHeight);
    ctx.stroke();

    ctx.fillStyle = labelColor;
    ctx.font = labelFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(tick.label, tick.position, axisY + labelOffset);
  });
}

// File: src/components/Drawing/Angleshape.ts
import {IDrawingShape} from "./IDrawingShape";

export interface AngleShapeArgs {
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color?: string,
    lineWidth?: number
}


export class AngleShape implements IDrawingShape {

    constructor(
        public x0: number,
        public y0: number,
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public color: string = 'teal',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.x0, this.y0);
        ctx.lineTo(this.x1, this.y1);
        ctx.moveTo(this.x0, this.y0);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
        const angleDeg = this.calculateAngle();
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        return this.isPointNearLine(x, y, this.x0, this.y0, this.x1, this.y1, tolerance) ||
            this.isPointNearLine(x, y, this.x0, this.y0, this.x2, this.y2, tolerance);
    }

    private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return (dx * dx + dy * dy) <= tolerance * tolerance;
    }

    private calculateAngle(): number {
        const v1 = {x: this.x1 - this.x0, y: this.y1 - this.y0};
        const v2 = {x: this.x2 - this.x0, y: this.y2 - this.y0};
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const cos = dot / (mag1 * mag2);
        return Math.acos(cos) * (100 / Math.PI);
    }
}

// File: src/components/Drawing/ArrowShape.ts
import {IDrawingShape} from "./IDrawingShape";

export interface ArrowShapeArgs {
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color?: string,
    lineWidth?: number
}

export class ArrowShape implements IDrawingShape {

    constructor(
        public fromX: number,
        public fromY: number,
        public toX: number,
        public toY: number,
        public color: string = 'black',
        public lineWidth: number = 2
    ) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const headLength = 10;
        const dx = this.toX - this.fromX;
        const dy = this.toY - this.fromY;
        const angle = Math.atan2(dy, dx);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.fromX, this.fromY);
        ctx.lineTo(this.toX, this.toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.toX, this.toY);
        ctx.lineTo(this.toX - headLength * Math.cos(angle - Math.PI / 6), this.toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(this.toX - headLength * Math.cos(angle + Math.PI / 6), this.toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(this.toX, this.toY);
        ctx.fillStyle = this.color;
        ctx.fill();

    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        return this.isPointNearLine(x, y, this.fromX, this.fromY, this.toX, this.toY, tolerance);
    }

    private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return (dx * dx + dy * dy) <= tolerance * tolerance;
    }

}

// File: src/components/Drawing/CircleShape.ts
import {IDrawingShape} from "./IDrawingShape";

export interface CircleShapeArgs {
    centerX: number,
    centerY: number,
    radius: number,
    color?: string,
    lineWidth?: number
}

export class CircleShape implements IDrawingShape {
    constructor(
        public centerX: number,
        public centerY: number,
        public radius: number,
        public color: string = 'black',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    }

    isHit(x: number, y: number): boolean {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius + this.lineWidth / 2;
    }
}

// File: src/components/Drawing/CustomSymbolShape.ts
import {IDrawingShape} from "./IDrawingShape";

export interface CustomSymbolShapeArgs {
    x: number,
    y: number,
    symbol: string,
    size: number,
    color: string
}

export class CustomSymbolShape implements IDrawingShape {

    constructor(
        public x: number,
        public y: number,
        public symbol: string = '*',
        public size: number = 24,
        public color: string = 'black') {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px Arial`;
        ctx.fillText(this.symbol, this.x, this.y);
    }

    isHit(x: number, y: number): boolean {
        const halfSize = this.size / 2;
        return (
            x >= this.x - halfSize &&
            x <= this.x + halfSize &&
            y >= this.y - halfSize &&
            y <= this.y + halfSize
        );
    }

}

// File: src/components/Drawing/IDrawingShape.ts
export interface IDrawingShape {
    draw(ctx: CanvasRenderingContext2D): void;
    isHit(x: number, y: number): boolean;
}

// File: src/components/Drawing/LineShape.ts
import {IDrawingShape} from "./IDrawingShape";

export interface LineShapeArgs {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color?: string,
    lineWidth?: number
}

export class LineShape implements IDrawingShape {
    constructor(
        public startX: number,
        public startY: number,
        public endX: number,
        public endY: number,
        public color: string = 'black',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        return this.isPointNearLine(x, y, this.startX, this.startY, this.endX, this.endY, tolerance);
    }

    private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return (dx * dx + dy * dy) <= tolerance * tolerance;
    }
}

// File: src/components/Drawing/Polyline.ts
import {IDrawingShape} from "./IDrawingShape";

interface Point {
    x: number,
    y: number
}

export interface PolylineShapeArgs {
    points: Point[],
    color?: string,
    lineWidth?: number
}


export class Polyline implements IDrawingShape {

    constructor(
        public points: Point[],
        public color: string = 'navy',
        public lineWidth: number = 2
    ) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.points?.length < 2) return;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        this.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            if (this.isPointNearLine(x, y, p1.x, p1.y, p2.x, p2.y, tolerance)) {
                return true;
            }
        }
        return false;
    }

    private isPointNearLine(
        px: number, py: number,
        x1: number, y1: number,
        x2: number, y2: number,
        tolerance: number
    ): boolean {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return (dx * dx + dy * dy) <= tolerance * tolerance;
    }
}

// File: src/components/Drawing/RectangleShape.ts
import {IDrawingShape} from "./IDrawingShape";

export interface RectangleShapeArgs {
    x: number,
    y: number,
    width: number,
    height: number,
    color?: string,
    lineWidth?: number
}


export class RectangleShape implements IDrawingShape {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public color: string = 'blue',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    isHit(x: number, y: number): boolean {
        return (
            x >= this.x &&
            x <= this.x + this.width &&
            y >= this.y &&
            y <= this.y + this.height
        );
    }
}

// File: src/components/Drawing/TriangleShape.ts
import {IDrawingShape} from "./IDrawingShape";

export interface TriangleShapeArgs {
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color?: string,
    lineWidth?: number
}


export class TriangleShape implements IDrawingShape {

    constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public x3: number,
        public y3: number,
        public color: string = 'black',
        public lineWidth: number = 2) {
    }

    draw(ctx: CanvasRenderingContext2D): void {

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineTo(this.x3, this.y3);
        ctx.closePath();
        ctx.stroke();
    }

    isHit(x: number, y: number): boolean {
        const tolerance = 6;
        return (
            this.isPointNearLine(x, y, this.x1, this.y1, this.x2, this.y2, tolerance) ||
            this.isPointNearLine(x, y, this.x2, this.y2, this.x3, this.y3, tolerance) ||
            this.isPointNearLine(x, y, this.x3, this.y3, this.x1, this.y1, tolerance)
        );
    }

    private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return (dx * dx + dy * dy) <= tolerance * tolerance;
    }
}

// File: src/components/Drawing/types.ts
import {Mode} from "../../contexts/ModeContext";

export type Drawing = {
    mode: Mode;
    args: any;
}

// File: src/components/SimpleChartEdge.tsx
import React from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import '../styles/App.scss';
import {Candle} from "../types/Candle";
import {TimeRange} from "../types/Graph";
import {AxesPosition} from "../types/types";
import {TimeDetailLevel} from "../types/chartStyleOptions";
import {ModeProvider} from "../contexts/ModeContext";


export type SimpleChartEdgeProps = {
    initialCandles?: Candle[];                      // Optional array of candles data
    initialYAxisPosition?: AxesPosition;            // Optional enum for Y axis position (left/right)
    initialMargin?: number;                          // Optional margin value
    initialNumberOfYTicks?: number;                  // Optional number of ticks on Y axis
    initialXAxisHeight?: number;                     // Optional height of X axis
    initialYAxisWidth?: number;                      // Optional width of Y axis
    initialTimeDetailLevel?: TimeDetailLevel;       // Optional time detail enum (auto, low, medium, high)
    initialTimeFormat12h?: boolean;                  // Optional flag for 12h or 24h time format
    initialVisibleRange?: TimeRange;                 // Optional visible range for the time axis
}

export const SimpleChartEdge: React.FC<SimpleChartEdgeProps> = ({
                                                                    initialCandles = [],
                                                                    initialYAxisPosition = AxesPosition.left,
                                                                    initialMargin = 20,
                                                                    initialNumberOfYTicks = 5,
                                                                    initialXAxisHeight = 40,
                                                                    initialYAxisWidth = 50,
                                                                    initialTimeDetailLevel = TimeDetailLevel.Auto,
                                                                    initialTimeFormat12h = false,
                                                                    initialVisibleTimeRange = {
                                                                        start: Date.now() - 7 * 24 * 60 * 60 * 1000,
                                                                        end: Date.now()
                                                                    },
                                                                }) => {
    return (
        <ModeProvider>
        <div className={'main-app-window flex flex-col h-full w-full p-0 m-0'}>
            <div className={'settings-area'}>
                <SettingsToolbar/>
            </div>
            <div className={'lower-container flex flex-1'}>
                <div className={'toolbar-area'}>
                    <Toolbar/>
                </div>
                <div className={'chart-stage-area flex-1 h-full'}>
                    <ChartStage
                        initialCandles={initialCandles}
                        initialYAxisPosition={initialYAxisPosition}
                        initialMargin={initialMargin}
                        initialNumberOfYTicks={initialNumberOfYTicks}
                        initialXAxisHeight={initialXAxisHeight}
                        initialYAxisWidth={initialYAxisWidth}
                        initialTimeDetailLevel={initialTimeDetailLevel}
                        initialTimeFormat12h={initialTimeFormat12h}
                        initialVisibleRange={initialVisibleRange}
                    />
                </div>
            </div>
        </div>
        </ModeProvider>
    );
};

// File: src/components/Toolbar/ModeButton.tsx


import React from 'react';
import { Mode } from '../../contexts/ModeContext';

interface ModeButtonProps {
  mode: Mode;
  currentMode: Mode;
  onClick: (mode: Mode) => void;
  label: string;
}

const ModeButton: React.FC<ModeButtonProps> = ({ mode, currentMode, onClick, label }) => {
  const selected = mode === currentMode;
  return (
    <button
      className={selected ? 'selected' : ''}
      onClick={() => onClick(mode)}
    >
      {label}
    </button>
  );
};

export default ModeButton;

// File: src/components/Toolbar/SettingsToolbar.tsx
import React from 'react';
import '../../styles/SettingsToolbar.scss';

export const SettingsToolbar: React.FC = () => {
    const handleDownload = () => {
        const canvas = document.querySelector('canvas'); // Ensure the tag name is lowercase
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error('Canvas element not found or invalid.');
            return;
        }
        const link = document.createElement('a');
        link.download = 'chart-snapshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const openSettingsMenu = () => {
        // This function should open the settings menu.
        // You can implement this based on your application's requirements.
        console.log('Opening settings menu...');
    }

    // add the styles using daisy-ui to all elements.
    //style all options in the select elements and all buttons with daisy ui styles.
    // I want this to look like a modern trading platform toolbar with a light theme.
    return (
        <div className={'settings-toolbar'}>
            <input type="text" placeholder="Symbol"/>
            <select>
                <option value="1m">1 Min</option>
                <option value="5m">5 Min</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
            </select>
            <select>
                <option value="50">50 Bars</option>
                <option value="100">100 Bars</option>
                <option value="200">200 Bars</option>
            </select>
            <select>
                <option value="candlestick">Candlestick</option>
                <option value="line">Line</option>
            </select>
            <button onClick={handleDownload}>📸 Snapshot</button>
            <button>⚙️ Settings</button>
        </div>
    );
};

// File: src/components/Toolbar/Toolbar.tsx
import React from 'react';
import { Mode, useMode } from '../../contexts/ModeContext';
import ModeButton from './ModeButton';
import '../../styles/Toolbar.scss';

export const Toolbar: React.FC = () => {
  const { mode, setMode } = useMode();

  return (
    <div className={'toolbar-container'}>
      <div className={'toolbar'}>
        <ModeButton mode={Mode.drawLine} currentMode={mode} onClick={setMode} label="D Line" />
        <ModeButton mode={Mode.drawRectangle} currentMode={mode} onClick={setMode} label="D Rect" />
        <ModeButton mode={Mode.drawCircle} currentMode={mode} onClick={setMode} label="D Cir" />
        <ModeButton mode={Mode.drawTriangle} currentMode={mode} onClick={setMode} label="D Triangle" />
        <ModeButton mode={Mode.drawAngle} currentMode={mode} onClick={setMode} label="D Angle" />
        <ModeButton mode={Mode.select} currentMode={mode} onClick={setMode} label="Select" />
        <ModeButton mode={Mode.editShape} currentMode={mode} onClick={setMode} label="Edit" />
      </div>
    </div>
  );
};

// File: src/contexts/ModeContext.tsx
import React, {createContext, useContext, useState} from 'react';

export enum Mode {
    none,
    drawLine,
    drawRectangle,
    drawCircle,
    drawTriangle,
    drawAngle,
    select,
    editShape,
    drawPolyline,
    drawArrow,
    drawCustomSymbol,
    drawText
}

interface ModeContextProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextProps | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [mode, setModeState] = useState<Mode>(Mode.none);

    const setMode = (newMode: Mode) => {
        setModeState(prev => (prev === newMode ? Mode.none : newMode));
    };

    return (
        <ModeContext.Provider value={{mode, setMode}}>
            {children}
        </ModeContext.Provider>
    );
};

export const useMode = (): ModeContextProps => {
    const context = useContext(ModeContext);
    if (!context) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};

// File: src/index.ts
import './styles.scss'
export type {SimpleChartEdgeProps} from './components/SimpleChartEdge';
export type {Candle} from './types/Candle';
export type {TimeRange} from './types/Graph';
export {AxesPosition} from './types/types';
export  {TimeDetailLevel} from './types/chartStyleOptions';
export {SimpleChartEdge} from './components/SimpleChartEdge';
export {ModeProvider, useMode} from './contexts/ModeContext';

// File: src/main.tsx
import './styles/index.css'; //

import React from 'react';
import ReactDOM from 'react-dom/client';
import {SimpleChartEdge} from './components/SimpleChartEdge';
import {ModeProvider} from './contexts/ModeContext';

const root = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <ModeProvider>
            <SimpleChartEdge/>
        </ModeProvider>
    </React.StrictMode>
);

// File: src/styles/App.scss


html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
}

.main-app-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
}


.lower-container {
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
}

.toolbar-area {
  flex: 0 0 auto;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
}


.chart-stage-area {
  flex: 1 1 auto;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}


.settings-area {
  display: flex;
  flex-direction: row;
  height: 30px;
  width: 100%;
}

// File: src/styles/Canvas/Axes.scss


// File: src/styles/Canvas/ChartCanvas.scss

canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}


// File: src/styles/Canvas/ChartStage.scss

.chart-stage-container {
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.canvas-axis-container {
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  min-width: 0;
  min-height: 0;
  position: relative;
  box-sizing: border-box;
}

.left-y-axis-container,
.right-y-axis-container {
  flex: 0 0 auto;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}

.x-axis-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  box-sizing: border-box;
}

.canvas-container {
  flex: 1 1 auto;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}

// File: src/styles/Canvas/Grid.scss


// File: src/styles/Drawing.scss


// File: src/styles/Overlays.scss


// File: src/styles/SettingsToolbar.scss

.settings-toolbar {
  background: #ddd;
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: start;
  align-content: center;
  align-items: center;


  input, select, button {
    height: 100%;
    border-radius: 3px;
    border-width: 1px;
    width: fit-content;
    font-size: 11px;
    padding: 0 5px;
  }

  input {
    height: calc(100% - 2px);
    width: 100px;
  }

}

// File: src/styles/Toolbar.scss
@use '../styles/variables' as v;

.toolbar-container {
  display: flex;
  flex-grow: 0;
  flex-shrink: 0;
  width: 40px;
  background-color: #ddd;
  height: 100%;
}

.toolbar {
  width: 40px;
  height: 100%;
  display: grid;
  grid-column: 1;
  grid-auto-flow: row;
  grid-template-rows: auto;
  grid-template-columns: auto;
  align-content: start;
  justify-content: center;

  button {
    display: flex;
    min-height: 40px;
    width: 100%;
    flex-grow: 1;
    padding: 0;
    overflow: hidden;
    text-align: center;
    font-size: 10px;
    justify-content: center;
    align-content: center;

    &.selected {
      background-color: #333;
      color: #fff;
      border-left: 3px solid #007bff;
    }
  }
}

// File: src/styles/_variables.scss


// File: src/styles/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

// File: src/styles.scss
@use './styles/index';
@use './styles/App';
@use './styles/Drawing';
@use './styles/Toolbar';
@use './styles/SettingsToolbar';
@use './styles/Overlays';
@use './styles/Canvas/Axes';
@use './styles/Canvas/ChartCanvas';
@use './styles/Canvas/ChartStage';
@use './styles/Canvas/Grid';

// File: src/types/Candle.ts
export interface Candle {
    t: number; // timestamp
    o: number; // open
    c: number; // close
    l: number; // low
    h: number; // high
}

export interface CandleWithIndex extends Candle {
    index: number; // index in the original array
}

// File: src/types/Graph.ts
export interface Tick {
    time: number;
    label: string;
}

export interface TimeRange {
    start: number;
    end: number;
}

// File: src/types/chartStyleOptions.ts
// chartStyleOptions.ts

// Candles style
import {AxesPosition} from "./types";

export interface CandleStyleOptions {
    upColor?: string;
    downColor?: string;
    borderColor?: string;
    borderWidth?: number;
    bodyWidthFactor?: number;
    spacingFactor?: number;
}

// Grid style
export interface GridStyleOptions {
    gridSpacing?: number;
    lineColor?: string;
    lineWidth?: number;
    lineDash?: number[];
}

// Axes style
export interface AxesStyleOptions {
    axisPosition?: AxesPosition;
    textColor?: string;
    font?: string;
    lineColor?: string;
    lineWidth?: number;
    numberLocale?: string;
    dateLocale?: string;
    numberFractionDigits?: number; // Number of decimal places to format axis values
}

export interface LineOverlayOptions {
    color?: string;
    lineWidth?: number;
    dashed?: boolean;
}

// Main Chart style options
export interface ChartStyleOptions {
    candles?: CandleStyleOptions;
    grid?: GridStyleOptions;
    axes?: AxesStyleOptions;
    lineOverlay?: LineOverlayOptions;
    backgroundColor?: string;
}


export enum TimeDetailLevel {
    Auto = 'auto',
    Low = 'low',
    Medium = 'medium',
    High = 'high',
}

// File: src/types/types.ts
import {ChartStyleOptions} from "./chartStyleOptions";

// Enum for Axis position
export enum AxesPosition {
    left = 'left',
    right = 'right',
}

// Base chart options
interface BaseChartOptions {
    theme?: 'light' | 'dark' | 'grey' | string;
    showOverlayLine?: boolean;
    style?: Partial<ChartStyleOptions>;
}

// Line chart data point
export interface LineData {
    time: number;
    value: number;
}

// Candlestick chart data point (full)
export interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

// Candlestick chart data point (compact)
export interface CandleDataCompact {
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
}

// Line chart options
export interface LineChartOptions extends BaseChartOptions {
    type: 'line';
    data: LineData[];
}

// Candlestick chart options
export interface CandleChartOptions extends BaseChartOptions {
    type: 'candlestick';
    data: (CandleData | CandleDataCompact)[];
}

// Unified ChartOptions type
export type ChartOptions = LineChartOptions | CandleChartOptions;

// File: src/vite-env.d.ts
/// <reference types="vite/client" />


