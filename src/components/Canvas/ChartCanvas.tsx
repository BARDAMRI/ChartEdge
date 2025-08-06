function drawCandlestickChart(ctx: CanvasRenderingContext2D, candles: Candle[], width: number, height: number) {
  if (candles.length === 0) return;

  const padding = 10;
  const maxPrice = Math.max(...candles.map(c => c.h));
  const minPrice = Math.min(...candles.map(c => c.l));
  const priceRange = maxPrice - minPrice;

  const candleWidth = width / candles.length;

  candles.forEach((candle, index) => {
    const x = index * candleWidth;
    const openY = height - ((candle.o - minPrice) / priceRange) * (height - padding * 2) - padding;
    const closeY = height - ((candle.c - minPrice) / priceRange) * (height - padding * 2) - padding;
    const highY = height - ((candle.h - minPrice) / priceRange) * (height - padding * 2) - padding;
    const lowY = height - ((candle.l - minPrice) / priceRange) * (height - padding * 2) - padding;

    const isBullish = candle.c > candle.o;
    ctx.strokeStyle = isBullish ? 'green' : 'red';
    ctx.fillStyle = isBullish ? 'green' : 'red';

    // draw wick
    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, highY);
    ctx.lineTo(x + candleWidth / 2, lowY);
    ctx.stroke();

    // draw body
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(openY - closeY);
    ctx.fillRect(x + 1, bodyTop, candleWidth - 2, bodyHeight || 1);
  });
}

function drawLineChart(ctx: CanvasRenderingContext2D, candles: Candle[], width: number, height: number) {
  ctx.fillText('📈 Line chart rendering here', 10, 20);
}

function drawAreaChart(ctx: CanvasRenderingContext2D, candles: Candle[], width: number, height: number) {
  ctx.fillText('📉 Area chart rendering here', 10, 40);
}

function drawBarChart(ctx: CanvasRenderingContext2D, candles: Candle[], width: number, height: number) {
  ctx.fillText('📊 Bar chart rendering here', 10, 60);
}

function drawHistogramChart(ctx: CanvasRenderingContext2D, candles: Candle[], width: number, height: number) {
  ctx.fillText('📊 Histogram chart rendering here', 10, 80);
}
import React, {useRef, useEffect} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {TimeRange} from "../../types/Graph";
import type {Candle} from "../../types/Candle";
import {StyledCanvas} from '../../styles/ChartCanvas.styles';
import { ChartType } from '../../types/chartStyleOptions';

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
    intervalsArray: Candle[];
    chartType: ChartType;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
                                                            parentContainerRef,
                                                            intervalsArray,
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
                                                            chartType,
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
    }, [intervalsArray, visibleRange, setVisibleRange]);

    useEffect(() => {
        setCandlesAndVisibleRange(intervalsArray, visibleRange || {start: 0, end: Date.now()});
    }, [intervalsArray, visibleRange, setCandlesAndVisibleRange]);

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

      switch (chartType) {
        case ChartType.Candlestick:
          drawCandlestickChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight);
          break;
        case ChartType.Line:
          drawLineChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight);
          break;
        case ChartType.Area:
          drawAreaChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight);
          break;
        case ChartType.Bar:
          drawBarChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight);
          break;
        case ChartType.Histogram:
          drawHistogramChart(ctx, visibleCandles, canvas.clientWidth, canvas.clientHeight);
          break;
        default:
          ctx.fillText('⚠️ Unknown chart type', 10, 20);
      }
    }, [intervalsArray, visibleRange,canvasRef.current, chartType]);

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
            <StyledCanvas
                className="canvas flex relative w-full h-full p-0 m-0 bg-white border-none pointer-events-auto"
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
        </div>
    );
};