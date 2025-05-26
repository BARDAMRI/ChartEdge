import React, {useRef, useEffect, useState} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {Drawing} from '../Drawing/types';
import {Candle, TimeRange} from '../../types/Candle';
import {drawGrid} from './utils/drawGrid';
import {drawAxes} from './utils/drawAxes';
import {drawCandlesticks} from './utils/drawCandlesticks';
import {drawDrawings} from './utils/drawDrawings';
import {drawOverlay} from './utils/drawOverlay';

interface ChartCanvasProps {
    candles: Candle[];
    visibleRange?: TimeRange | null;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
                                                            candles,
                                                            visibleRange: initialVisibleRange,
                                                        }) => {
    const {mode} = useMode();
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [timeFormat, setTimeFormat] = useState<string>('YYYY/MM/DD');

    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [dimensions, setDimensions] = useState({width: 0, height: 0});
    const padding = 40;

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current!;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });
        observer.observe(container);
        return () => {
            observer.disconnect();
        };
    }, []);

    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const defaultVisibleRange: TimeRange = {
        start: oneYearAgo,
        end: now,
    };

    const [visibleRange, setVisibleRange] = useState<TimeRange>(
        (initialVisibleRange && candles && candles.length)
            ? initialVisibleRange
            : defaultVisibleRange
    );
    const safeCandles = candles || [];
    const visibleCandles = safeCandles.filter(
        c => visibleRange && c.t >= visibleRange.start && c.t <= visibleRange.end
    );

    const candlesToUse = visibleCandles.length > 0 ? visibleCandles : safeCandles;

    const prices = candlesToUse.length > 0
        ? candlesToUse.flatMap(c => [c.h, c.l])
        : [];

    const maxPrice = prices.length > 0 ? Math.max(...prices) : 1;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

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
        if (!canvasRef.current) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setDrawings(prev => {
            if (mode === Mode.drawLine) {
                return [
                    ...prev,
                    {
                        mode: Mode.drawLine,
                        args: {
                            startX: startPoint.x,
                            startY: startPoint.y,
                            endX: x,
                            endY: y,
                        },
                    },
                ];
            } else if (mode === Mode.drawRectangle) {
                return [
                    ...prev,
                    {
                        mode: Mode.drawRectangle,
                        args: {
                            x: startPoint.x,
                            y: startPoint.y,
                            width: x - startPoint.x,
                            height: y - startPoint.y,
                        },
                    },
                ];
            } else if (mode === Mode.drawCircle) {
                const dx = x - startPoint.x;
                const dy = y - startPoint.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                return [
                    ...prev,
                    {
                        mode: Mode.drawCircle,
                        args: {
                            centerX: startPoint.x,
                            centerY: startPoint.y,
                            radius,
                        },
                    },
                ];
            }
            return prev;
        });

        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
    };

    function formatUnixTime(unixTime: number): string {
      const date = new Date(unixTime);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      return new Intl.DateTimeFormat('he-IL', options).format(date);
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (dimensions.width === 0 || dimensions.height === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        drawGrid(ctx, dimensions.width, dimensions.height, padding);
        drawAxes(
          ctx,
          candlesToUse,
          visibleRange,
          dimensions.width,
          dimensions.height,
          padding,
          minPrice,
          maxPrice,
          'left',
          formatUnixTime
        );
        drawCandlesticks(ctx, candlesToUse, visibleRange, dimensions.width, dimensions.height, padding, minPrice, maxPrice);
        drawDrawings(ctx, drawings, selectedIndex);
        drawOverlay(ctx, mode, isDrawing, startPoint, currentPoint);

    }, [
        candlesToUse,
        visibleRange,
        drawings,
        selectedIndex,
        mode,
        isDrawing,
        startPoint,
        currentPoint,
        dimensions,
        padding,
        minPrice,
        maxPrice,
    ]);

    return (
        <div ref={containerRef} className="chart-canvas-container" style={{width: '100%', height: '100%'}}>
            <canvas
                ref={canvasRef}
                style={{width: '100%', height: '100%', userSelect: 'none', display: 'block'}}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
        </div>
    );
};