import React, {useRef, useEffect} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {Candle, TimeRange} from '../../types/Candle';
import {drawGrid} from './utils/drawGrid';
import {drawAxes} from './utils/drawAxes';
import {drawCandlesticks} from './utils/drawCandlesticks';
import {drawDrawings} from './utils/drawDrawings';
import {drawOverlay} from './utils/drawOverlay';
import {useChartStore} from '../../store/useChartStore';

interface ChartCanvasProps {
    candles: Candle[];
    visibleRange?: TimeRange | null;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
                                                            candles,
                                                            visibleRange: initialVisibleRange,
                                                        }) => {
    const mode = useMode().mode;
    const isDrawing = useChartStore(state => state.isDrawing);
    const setIsDrawing = useChartStore(state => state.setIsDrawing);
    const startPoint = useChartStore(state => state.startPoint);
    const setStartPoint = useChartStore(state => state.setStartPoint);
    const currentPoint = useChartStore(state => state.currentPoint);
    const setCurrentPoint = useChartStore(state => state.setCurrentPoint);
    const drawings = useChartStore(state => state.drawings);
    const setDrawings = useChartStore(state => state.setDrawings);
    const selectedIndex = useChartStore(state => state.selectedIndex);
    const setSelectedIndex = useChartStore(state => state.setSelectedIndex);
    const visibleRange = useChartStore(state => state.visibleRange);
    const setVisibleRange = useChartStore(state => state.setVisibleRange);
    const canvasWidth = useChartStore(state => state.canvasWidth);
    const setCanvasWidth = useChartStore(state => state.setCanvasWidth);
    const canvasHeight = useChartStore(state => state.canvasHeight);
    const setCanvasHeight = useChartStore(state => state.setCanvasHeight);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const padding = useChartStore(state => state.padding);

    const candlesToUse = useChartStore(state => state.candlesToUse);
    const minPrice = useChartStore(state => state.minPrice);
    const maxPrice = useChartStore(state => state.maxPrice);
    const setCandlesAndVisibleRange = useChartStore(state => state.setCandlesAndVisibleRange);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current!;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setCanvasWidth(entry.contentRect.width);
                setCanvasHeight(entry.contentRect.height);
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

    // Initialize visibleRange in store if not set and initialVisibleRange is provided
    useEffect(() => {
        if (initialVisibleRange && candles && candles.length && !visibleRange) {
            setVisibleRange(initialVisibleRange);
        } else if (!visibleRange) {
            setVisibleRange(defaultVisibleRange);
        }
    }, [initialVisibleRange, candles, visibleRange, setVisibleRange]);

    // useEffect for setting candles and visible range in store
    useEffect(() => {
        setCandlesAndVisibleRange(candles, visibleRange || {start: 0, end: Date.now()});
    }, [candles, visibleRange, setCandlesAndVisibleRange]);

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
            const newDrawing = {
                [Mode.drawLine]: () => ({
                    mode: Mode.drawLine,
                    args: {
                        startX: startPoint.x,
                        startY: startPoint.y,
                        endX: x,
                        endY: y,
                    },
                }),
                [Mode.drawRectangle]: () => ({
                    mode: Mode.drawRectangle,
                    args: {
                        x: startPoint.x,
                        y: startPoint.y,
                        width: x - startPoint.x,
                        height: y - startPoint.y,
                    },
                }),
                [Mode.drawCircle]: () => {
                    const dx = x - startPoint.x;
                    const dy = y - startPoint.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);
                    return {
                        mode: Mode.drawCircle,
                        args: {
                            centerX: startPoint.x,
                            centerY: startPoint.y,
                            radius,
                        },
                    };
                }
            }[mode];

            return newDrawing ? [...prev, newDrawing()] : prev;
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
        if (canvasWidth === 0 || canvasHeight === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvasHeight);

        drawGrid(ctx, canvas.width, canvasHeight, padding);
        drawAxes(
            ctx,
            candlesToUse
        );
        drawCandlesticks(ctx, candlesToUse, visibleRange, padding, minPrice, maxPrice);
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
        canvasHeight,
        canvasWidth,
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