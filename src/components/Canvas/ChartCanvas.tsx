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
    xAxisHeight: number;
    chartType: ChartType;
    interval?: string;
}


export const ChartCanvas: React.FC<ChartCanvasProps> = ({
                                                            parentContainerRef,
                                                            intervalsArray,
                                                            visibleRange,
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
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!e) return;
        const rect = containerRef.current!.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setCurrentPoint({x: mouseX, y: mouseY});
    };


    const hoveredCandle = React.useMemo(() => {
        if (
            !currentPoint ||
            intervalsArray.length <= 0 ||
            !canvasRef?.current ||
            canvasRef.current!.clientWidth === 0
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

        const visibleCandles = intervalsArray;
        const intervalMs = parseInterval(intervalsArray.length > 1 ? intervalsArray[1].t - intervalsArray[0].t : 1000, interval);
        console.log('chart type', chartType, ' interval: ', interval, ' intervalMs: ', intervalMs, ' width: ', canvasRef.current?.clientWidth);
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
    }, [intervalsArray, visibleRange, canvasRef.current, chartType, interval]);

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
        <InnerCanvasContainer $xAxisHeight={xAxisHeight} ref={containerRef}>
            <StyledCanvas
                className="styles-canvas"
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
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