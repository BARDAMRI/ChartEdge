import {DrawingPoint} from "../../types/Drawings";
import React, {useRef, useEffect, useState} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {TimeRange} from "../../types/Graph";
import type {Candle} from "../../types/Candle";
import {StyledCanvas, InnerCanvasContainer, HoverTooltip} from '../../styles/ChartCanvas.styles';
import {ChartType} from '../../types/chartStyleOptions';
import {parseInterval} from "./utils/RangeCalculators";
import {
    drawAreaChart,
    drawBarChart,
    drawCandlestickChart,
    drawHistogramChart,
    drawLineChart
} from "./utils/GraphDraw";
import {drawDrawings} from './utils/drawDrawings';
import {LineShape} from '../Drawing/LineShape';
import {RectangleShape} from "../Drawing/RectangleShape";
import {CircleShape} from "../Drawing/CircleShape";
import {TriangleShape} from "../Drawing/TriangleShape";
import {AngleShape} from "../Drawing/Angleshape";

type DrawingFactoryMap = Partial<Record<Mode, () => any>>;

interface ChartCanvasProps {
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    intervalsArray: Candle[];
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

    // --- ZOOM STATE ---
    const [zoomScale, setZoomScale] = useState(1);

    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<number | null>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!e) return;
        const rect = containerRef.current!.getBoundingClientRect();
        if (!rect) return;

        if (isPanning && panStartRef.current !== null) {
            const deltaX = e.clientX - panStartRef.current;
            const candleWidth = canvasRef.current!.clientWidth / intervalsArray.length;
            const offsetCandles = Math.round(-deltaX / candleWidth);

            if (offsetCandles !== 0) {
                const intervalMs = parseInterval(intervalsArray.length > 1 ? intervalsArray[1].t - intervalsArray[0].t : 1000, interval);
                const offsetTime = offsetCandles * intervalMs;

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

        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.fillStyle = 'black';

        // --- Calculate visible candles based on zoomScale ---
        const baseCandleWidth = 8; // base width for 1x zoom
        const targetCount = Math.floor(canvas.clientWidth / (baseCandleWidth * zoomScale));
        const startIndex = Math.max(0, intervalsArray.length - targetCount);
        const visibleCandles = intervalsArray.slice(startIndex);
        // Optionally, filter by visibleRange if still relevant:
        // const visibleCandles = intervalsArray.filter(c => c.t >= visibleRange.start && c.t <= visibleRange.end);

        const intervalMs = parseInterval(intervalsArray.length > 1 ? intervalsArray[1].t - intervalsArray[0].t : 1000, interval);
        switch (chartType) {
            case ChartType.Candlestick:
                drawCandlestickChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight, visibleRange, intervalMs);
                break;
            case ChartType.Line:
                drawLineChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight, visibleRange, intervalMs);
                break;
            case ChartType.Area:
                drawAreaChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight, visibleRange, intervalMs);
                break;
            case ChartType.Bar:
                drawBarChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight, visibleRange, intervalMs);
                break;
            case ChartType.Histogram:
                const hasValidVolume = visibleCandles.some(c => typeof c.v === 'number' && c.v > 0);
                if (hasValidVolume) {
                    drawHistogramChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight, visibleRange, intervalMs);
                    break;
                }
            default:
                console.warn('Unknown chart type:', chartType, '- falling back to Candlestick.');
                drawCandlestickChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight, visibleRange, intervalMs);
                break;
        }

        drawDrawings(ctx, drawings, selectedIndex, canvas.clientWidth, canvas.clientHeight);

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
    }, [intervalsArray, visibleRange, canvasRef.current, chartType, interval, drawings, selectedIndex, currentPoint, isDrawing, startPoint, mode, zoomScale]);

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

    // --- Wheel handler for zooming: update zoomScale and adjust visibleRange center on mouse ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY;

            const ZOOM_AMOUNT_MS = 3000_000;

            const rangeDuration = visibleRange.end - visibleRange.start;
            const offsetX = e.offsetX;
            const mouseRatio = offsetX / canvas.clientWidth;
            const mouseTime = visibleRange.start + mouseRatio * rangeDuration;

            let newStart, newEnd;

            if (delta < 0) {
                // Zoom in - צמצם טווח
                newStart = visibleRange.start + ZOOM_AMOUNT_MS;
                newEnd = visibleRange.end - ZOOM_AMOUNT_MS;
            } else {
                // Zoom out - הרחב טווח
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

            setVisibleRange({ start: newStart, end: newEnd });
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