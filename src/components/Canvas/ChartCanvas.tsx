import React, {useRef, useEffect} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {Candle} from '../../types/Candle';
import {drawGrid} from './utils/drawGrid';
import {drawCandlesticks} from './utils/drawCandlesticks';
import {drawDrawings} from './utils/drawDrawings';
import {drawOverlay} from './utils/drawOverlay';
import {useChartStore} from '../../store/useChartStore';
import {TimeRange} from "../../types/Graph.ts";

interface ChartCanvasProps {
    parentContainerRef?: React.RefObject<HTMLDivElement>;
}
export const ChartCanvas: React.FC = ({parentContainerRef}:ChartCanvasProps) => {
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
    const candles = useChartStore(state => state.candlesToUse);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const xAxisHeight = useChartStore(state => state.xAxisHeight);

    const padding = useChartStore(state => state.padding);

    const candlesToUse = useChartStore(state => state.candlesToUse);
    const minPrice = useChartStore(state => state.minPrice);
    const maxPrice = useChartStore(state => state.maxPrice);
    const setCandlesAndVisibleRange = useChartStore(state => state.setCandlesAndVisibleRange);

    // useEffect(() => {
    //     if (!containerRef.current) return;
    //     const container = containerRef.current!;
    //     const observer = new ResizeObserver(entries => {
    //         for (const entry of entries) {
    //             setCanvasWidth(entry.contentRect.width);
    //             setCanvasHeight(entry.contentRect.height);
    //         }
    //     });
    //     observer.observe(container);
    //     return () => {
    //         observer.disconnect();
    //     };
    // }, []);

    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const defaultVisibleRange: TimeRange = {
        start: oneYearAgo,
        end: now,
    };

    // Initialize visibleRange in store if not set and initialVisibleRange is provided
    useEffect(() => {
        if (!visibleRange || visibleRange.start === 0 || visibleRange.end === 0) {
            setVisibleRange(defaultVisibleRange);
        }
    }, [candles, visibleRange, setVisibleRange]);

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
            };
            return newDrawing ? [...prev, newDrawing] : prev;
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
        // const canvas = canvasRef.current;
        // if (!canvas) return;
        // if (canvasWidth === 0 || canvasHeight === 0) return;
        // const ctx = canvas.getContext('2d');
        // if (!ctx) return;
        //
        // const dpr = window.devicePixelRatio || 1;
        // canvas.style.width = `${canvasWidth}px`;
        // canvas.style.height = `${canvasHeight}px`;
        //
        // ctx.setTransform(1, 0, 0, 1, 0, 0);
        // ctx.scale(dpr, dpr);
        //
        // ctx.clearRect(0, 0, canvas.width, canvasHeight);

        // drawGrid(ctx);
        // drawCandlesticks(ctx, candlesToUse, visibleRange, padding, minPrice, maxPrice);
        // drawDrawings(ctx, drawings, selectedIndex);
        // drawOverlay(ctx, mode, isDrawing, startPoint, currentPoint);

    }, [
        candlesToUse,
        visibleRange,
        drawings,
        selectedIndex,
        mode,
        isDrawing,
        startPoint,
        currentPoint,
        padding,
        minPrice,
        maxPrice,
    ]);

    return (
        <div className="canvas-container relative" style={{width: '100%', height: `calc(100% - ${xAxisHeight}px)`}}>

            <canvas
                ref={canvasRef}
                style={{userSelect: 'none', display: 'block', height: '100%', width: '100%'}}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
        </div>
    );
};