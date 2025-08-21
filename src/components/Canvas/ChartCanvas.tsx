import {DrawingPoint} from "../../types/Drawings";
import React, {useRef, useEffect, useState} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {TimeRange} from "../../types/Graph";
import type {Interval} from "../../types/Interval";
import {StyledCanvas, InnerCanvasContainer, HoverTooltip} from '../../styles/ChartCanvas.styles';
import {ChartType} from '../../types/chartStyleOptions';
import {parseInterval} from "./utils/RangeCalculators";
import {
    Candlesticks,
    drawAreaChart,
    drawBarChart,
    drawCandlestickChart,
    drawHistogramChart,
    drawLineChart, IndexRangePair
} from "./utils/GraphDraw";
import {drawDrawings} from './utils/drawDrawings';
import {LineShape} from '../Drawing/LineShape';
import {RectangleShape} from "../Drawing/RectangleShape";
import {CircleShape} from "../Drawing/CircleShape";
import {TriangleShape} from "../Drawing/TriangleShape";
import {AngleShape} from "../Drawing/Angleshape";
import {
    startOfHour
} from 'date-fns';

type DrawingFactoryMap = Partial<Record<Mode, () => any>>;

interface ChartCanvasProps {
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    intervalsArray: Interval[];
    drawings: any[];
    isDrawing: boolean;
    selectedIndex: number | null;
    setDrawings: (drawings: any[] | ((prev: any[]) => any[])) => void;
    setIsDrawing: (value: boolean) => void;
    setSelectedIndex: (index: number | null) => void;
    startPoint: DrawingPoint | null;
    setStartPoint: (point: DrawingPoint | null) => void;
    visibleRange: TimeRange;
    setVisibleRange: (range: TimeRange) => void;
    xAxisHeight: number;
    chartType: ChartType;
    interval?: string;
}


export const ChartCanvas: React.FC<ChartCanvasProps> = ({
                                                            parentContainerRef,
                                                            intervalsArray,
                                                            visibleRange,
                                                            setVisibleRange,
                                                            drawings,
                                                            isDrawing,
                                                            setIsDrawing,
                                                            setDrawings,
                                                            startPoint,
                                                            setStartPoint,
                                                            selectedIndex,
                                                            setSelectedIndex,
                                                            xAxisHeight,
                                                            chartType,
                                                            interval,
                                                        }) => {
    const mode = useMode().mode;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [currentPoint, setCurrentPoint] = useState<null | { x: number; y: number }>(null);
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<number | null>(null);
    const [visibleCandles, setVisibleCandles] = useState<IndexRangePair>({
        startIndex: 0,
        endIndex: intervalsArray.length - 1
    });
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!e) return;
        const rect = containerRef.current!.getBoundingClientRect();
        if (!rect) return;

        if (isPanning && panStartRef.current !== null) {
            const deltaX = e.clientX - panStartRef.current;
            const candleWidth = canvasRef.current!.clientWidth / (visibleCandles.endIndex - visibleCandles.startIndex);
            const offsetCandles = Math.round(-deltaX / candleWidth);

            if (offsetCandles !== 0) {
                const intervalMs = parseInterval(intervalsArray.length > 2 ? intervalsArray[1].t - intervalsArray[0].t : 1000, interval);
                const offsetTime = offsetCandles * (intervalMs * 0.3);

                // don't setVisibleRange if the start less than the minimal t value or if the end is greater than the maximal t value + candle width.

                if (visibleRange.start + offsetTime < intervalsArray[visibleCandles.startIndex].t ||
                    visibleRange.end + offsetTime > intervalsArray[visibleCandles.endIndex].t + candleWidth) {
                    return;
                }
                // Update the visible range based on the offset
                setVisibleRange({
                    start: visibleRange.start + offsetTime,
                    end: visibleRange.end + offsetTime,
                });

                panStartRef.current = e.clientX;
            }
        }

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setCurrentPoint({x: mouseX, y: mouseY});
    };

    const handleMouseLeave = () => {
        setCurrentPoint(null);
    };


    const hoveredCandle = React.useMemo(() => {
        if (
            !currentPoint ||
            currentPoint.x >= canvasRef.current!.clientWidth ||
            currentPoint.x <= 0 ||
            currentPoint.y >= canvasRef.current!.clientHeight ||
            currentPoint.y <= 0 ||
            intervalsArray.length <= 0 ||
            !canvasRef?.current ||
            canvasRef.current!.clientWidth === 0 ||
            canvasRef.current!.clientHeight === 0
        ) return null;

        // Use the new utility function to get the hovered timestamp
        const candleWidth = canvasRef.current?.clientWidth / intervalsArray.length;
        const intervalIndex = Math.floor(currentPoint.x / candleWidth);
        if (intervalIndex < 0 || intervalIndex >= intervalsArray.length) return null;
        return intervalsArray[intervalIndex];
    }, [currentPoint, intervalsArray, visibleRange, canvasRef.current, chartType, interval]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || intervalsArray.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // HiDPI canvas resolution handling
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        const intervalMs = parseInterval(
            intervalsArray.length > 1 ? intervalsArray[1].t - intervalsArray[0].t : 1000,
            interval
        );
        const chartedIndexes = [];
        for (let i = 0; i < intervalsArray.length; i++) {
            const candle = intervalsArray[i];
            if (candle.t + intervalMs >= visibleRange.start && candle.t < visibleRange.end) {
                chartedIndexes.push(i);
            }
        }
        if (chartedIndexes[0] !== visibleCandles.startIndex || chartedIndexes[chartedIndexes.length - 1] !== visibleCandles.endIndex) {
            setVisibleCandles({startIndex: chartedIndexes[0], endIndex: chartedIndexes[chartedIndexes.length - 1]});
        }
    }, [intervalsArray.length, canvasRef.current, visibleRange, chartType, interval, mode]);

    // Unified drawing function
    function drawAll(ctx: CanvasRenderingContext2D) {
        // Clear the canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw the chart
        const intervalMs = parseInterval(
            intervalsArray.length > 1 ? intervalsArray[1].t - intervalsArray[0].t : 1000,
            interval
        );
        switch (chartType) {
            case ChartType.Candlestick:
                drawCandlestickChart(ctx, intervalsArray, visibleCandles.startIndex, visibleCandles.endIndex, visibleRange, intervalMs);
                break;
            case ChartType.Line:
                drawLineChart(ctx, intervalsArray, visibleCandles.startIndex, visibleCandles.endIndex, visibleRange, intervalMs);
                break;
            case ChartType.Area:
                drawAreaChart(ctx, intervalsArray, visibleCandles.startIndex, visibleCandles.endIndex, visibleRange, intervalMs);
                break;
            case ChartType.Bar:
                drawBarChart(ctx, intervalsArray, visibleCandles.startIndex, visibleCandles.endIndex, visibleRange, intervalMs);
                break;
            case ChartType.Histogram: {
                const hasValidVolume = intervalsArray.some(c => typeof c.v === 'number' && c.v > 0);
                if (hasValidVolume) {
                    drawHistogramChart(ctx, intervalsArray, visibleCandles.startIndex, visibleCandles.endIndex, visibleRange, intervalMs);
                    break;
                }
            }
            // fallthrough
            default:
                console.warn('Unknown chart type:', chartType, '- falling back to Candlestick.');
                drawCandlestickChart(ctx, intervalsArray, visibleCandles.startIndex, visibleCandles.endIndex, visibleRange, intervalMs);
                break;
        }

        // Draw existing drawings
        drawDrawings(ctx, drawings, selectedIndex, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

        // Draw preview shape while drawing
        if (isDrawing && startPoint && currentPoint) {
            let shape = null;
            switch (mode) {
                case Mode.drawLine:
                    shape = new LineShape(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y);
                    break;
                case Mode.drawRectangle:
                    shape = new RectangleShape(
                        startPoint.x,
                        startPoint.y,
                        currentPoint.x - startPoint.x,
                        currentPoint.y - startPoint.y
                    );
                    break;
                case Mode.drawCircle:
                    shape = new CircleShape(
                        startPoint.x,
                        startPoint.y,
                        currentPoint.x,
                        currentPoint.y,
                        'black',
                        2
                    );
                    break;
                case Mode.drawTriangle:
                    shape = new TriangleShape(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y);
                    break;
                case Mode.drawAngle:
                    shape = new AngleShape(
                        startPoint.x,
                        startPoint.y,
                        currentPoint.x,
                        currentPoint.y,
                        startPoint.x + 10,
                        startPoint.y,
                        'black',
                        2
                    );
                    break;
            }
            if (shape) {
                shape.draw(ctx);
                ctx.stroke();
            }
        }
    }

    // useEffect for drawing existing drawings and preview
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || intervalsArray.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        drawAll(ctx);
    }, [drawings, selectedIndex, currentPoint, isDrawing, startPoint, visibleCandles, chartType, visibleRange, interval, mode]);

    // useEffect for chart drawing (chartType/visibleCandles change)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || intervalsArray.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        drawAll(ctx);
    }, [visibleRange, visibleCandles, chartType, drawings, selectedIndex, isDrawing, startPoint, mode, interval, currentPoint]);

    // useEffect for global mouse events: mouseup & mousemove (panning and crosshair)
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isPanning) {
                setIsPanning(false);
                panStartRef.current = null;
            }
        };

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (isPanning && panStartRef.current !== null) {
                const deltaX = e.clientX - panStartRef.current;
                const candleWidth = canvasRef.current?.clientWidth / (visibleCandles.endIndex - visibleCandles.startIndex);
                const offsetCandles = Math.round(-deltaX / candleWidth);

                if (offsetCandles !== 0) {
                    const intervalMs = parseInterval(
                        intervalsArray.length > 2
                            ? intervalsArray[1].t - intervalsArray[0].t
                            : 1000,
                        interval
                    );
                    const offsetTime = offsetCandles * (intervalMs * 0.3);

                    // don't setVisibleRange if the start less than the minimal t value or if the end is greater than the maximal t value + candle width.
                    if (visibleRange.start + offsetTime < intervalsArray[visibleCandles.startIndex].t ||
                        visibleRange.end + offsetTime > intervalsArray[visibleCandles.endIndex].t + candleWidth) {
                        return;
                    }

                    setVisibleRange({
                        start: visibleRange.start + offsetTime,
                        end: visibleRange.end + offsetTime,
                    });

                    panStartRef.current = e.clientX;
                }
            }

            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            setCurrentPoint({x: mouseX, y: mouseY});
        };

        document.addEventListener("mouseup", handleGlobalMouseUp);
        document.addEventListener("mousemove", handleGlobalMouseMove);

        return () => {
            document.removeEventListener("mouseup", handleGlobalMouseUp);
            document.removeEventListener("mousemove", handleGlobalMouseMove);
        };
    }, [isPanning, visibleRange, visibleCandles, interval]);

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

        if (mode === Mode.none) {
            setIsPanning(true);
            panStartRef.current = e.clientX;
        }

        if (mode !== Mode.none) {
            setStartPoint({x, y});
            setIsDrawing(true);
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint || mode === Mode.none) {
            setIsPanning(false);
            panStartRef.current = null;
            return;
        }
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
                        color: 'black', // אפשר להוסיף תמיכה דינמית בהמשך
                        lineWidth: 2
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
                    return {
                        mode: Mode.drawCircle,
                        args: {
                            startX: startPoint!.x,
                            startY: startPoint!.y,
                            endX: x,
                            endY: y,
                            color: 'black',
                            lineWidth: 2
                        },
                    };
                },
                [Mode.drawTriangle]: () => ({
                    mode: Mode.drawTriangle,
                    args: {
                        startX: startPoint!.x,
                        startY: startPoint!.y,
                        endX: x,
                        endY: y,
                        color: 'black',
                        lineWidth: 2
                    },
                }),
                [Mode.drawAngle]: () => ({
                    mode: Mode.drawAngle,
                    args: {
                        x0: startPoint!.x,
                        y0: startPoint!.y,
                        x1: x,
                        y1: y,
                        x2: startPoint!.x + 10,
                        y2: startPoint!.y,
                        color: 'black',
                        lineWidth: 2
                    },
                }),
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

        setIsPanning(false);
        panStartRef.current = null;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY;


                const rangeDuration = visibleRange.end - visibleRange.start;
                const ZOOM_AMOUNT_MS = rangeDuration * 0.01; // Zoom in/out by 10% of the current range duration
                const offsetX = e.offsetX;
                const mouseRatio = offsetX / canvas.clientWidth;
                const mouseTime = visibleRange.start + mouseRatio * rangeDuration;

                let newStart, newEnd;

                if (delta < 0) {
                    newStart = visibleRange.start + ZOOM_AMOUNT_MS;
                    newEnd = visibleRange.end - ZOOM_AMOUNT_MS;
                } else {
                    newStart = visibleRange.start - ZOOM_AMOUNT_MS;
                    newEnd = visibleRange.end + ZOOM_AMOUNT_MS;
                }

                const intervalMs = parseInterval(
                    intervalsArray.length > 1 ? intervalsArray[1].t - intervalsArray[0].t : 1000,
                    interval
                );
                const minDuration = 2 * intervalMs;
                const maxDuration = (() => {
                    const canvasWidth = canvas.clientWidth;
                    const minPixelsPerInterval = chartType === ChartType.Candlestick ? 3 : 1;
                    const maxVisibleCount = canvasWidth / minPixelsPerInterval;
                    return maxVisibleCount * intervalMs;
                })();

                let newRangeDuration = newEnd - newStart;
                if (newRangeDuration < minDuration) {
                    newStart = mouseTime - minDuration / 2;
                    newEnd = mouseTime + minDuration / 2;
                }
                if (newRangeDuration > maxDuration) {
                    newStart = mouseTime - maxDuration / 2;
                    newEnd = mouseTime + maxDuration / 2;
                }

                // Ensure the new range does not exceed the bounds of the data
                newStart = Math.max(newStart, intervalsArray[0].t);
                newEnd = Math.min(newEnd, intervalsArray[intervalsArray.length - 1].t + (intervalsArray[1]?.t - intervalsArray[0]?.t || 1000));

                setVisibleRange({start: newStart, end: newEnd});
            } else {
                // Scroll רגיל = Pan אופקי
                e.preventDefault();
                const deltaX = e.deltaX;
                const intervalMs = parseInterval(
                    intervalsArray.length > 1 ? intervalsArray[1].t - intervalsArray[0].t : 1000,
                    interval
                );
                const offsetTime = deltaX * intervalMs * 0.01;

                // don't setVisibleRange if the start less than the minimal t value or if the end is greater than the maximal t value + candle width.
                if (visibleRange.start + offsetTime < intervalsArray[0].t ||
                    visibleRange.end + offsetTime > intervalsArray[intervalsArray.length - 1].t + (intervalsArray[1]?.t - intervalsArray[0]?.t || 1000)) {
                    return;
                }
                setVisibleRange({
                    start: visibleRange.start + offsetTime,
                    end: visibleRange.end + offsetTime,
                });
            }
        };
        canvas.addEventListener('wheel', handleWheel, {passive: false});
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [visibleRange, setVisibleRange, intervalsArray, interval, chartType]);

    return (
        <InnerCanvasContainer $xAxisHeight={xAxisHeight} ref={containerRef}>
            <StyledCanvas
                className="styles-canvas"
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            />
            {hoveredCandle && currentPoint && (
                <HoverTooltip $isPositive={hoveredCandle.c > hoveredCandle.o}>
                    Time: {new Date(hoveredCandle.t).toLocaleString(undefined, {hour12: false})} |
                    O: {hoveredCandle.o} |
                    H: {hoveredCandle.h} |
                    L: {hoveredCandle.l} |
                    C: {hoveredCandle.c}
                    {hoveredCandle.v !== undefined && ` | V: ${hoveredCandle.v}`}
                </HoverTooltip>
            )}
        </InnerCanvasContainer>
    );
};