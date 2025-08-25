import React, {useRef, useEffect, useState, useCallback, useMemo} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {StyledCanvas, InnerCanvasContainer, HoverTooltip} from '../../styles/ChartCanvas.styles';
import {ChartOptions, ChartType} from "../../types/chartOptions";
import {drawAreaChart, drawBarChart, drawCandlestickChart, drawHistogramChart, drawLineChart} from "./utils/GraphDraw";
import {drawDrawings} from './utils/drawDrawings';
import {useChartData} from '../../hooks/useChartData';
import {usePanAndZoom} from '../../hooks/usePanAndZoom';
import {Interval} from "../../types/Interval";
import {DrawingPoint} from "../../types/Drawings";
import {TimeRange} from "../../types/Graph";
import {LineShape} from "../Drawing/LineShape";
import {RectangleShape} from "../Drawing/RectangleShape";
import {CircleShape} from "../Drawing/CircleShape";
import {TriangleShape} from "../Drawing/TriangleShape";
import {AngleShape} from "../Drawing/Angleshape";
import {DeepRequired} from "../../types/types";

interface ChartCanvasProps {
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
    chartOptions: DeepRequired<ChartOptions>;
    canvasSizes?: { width: number; height: number };
    parentContainerRef?: React.RefObject<HTMLDivElement>;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
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
                                                            chartOptions,
                                                            canvasSizes,
                                                        }) => {
    const {mode} = useMode();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const histCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const backBufferRef = useRef<HTMLCanvasElement | null>(null);
    const histBackBufferRef = useRef<HTMLCanvasElement | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
    const tickingRef = useRef(false);

    const panOffsetRef = useRef(0);
    const [isPanning, setIsPanning] = useState(false);

    const [internalShowHistogram, setInternalShowHistogram] = useState<boolean>(chartOptions?.base?.showHistogram ?? true);
    useEffect(() => {
        setInternalShowHistogram(chartOptions.base.showHistogram ?? false);
    }, [chartOptions.base.showHistogram]);

    const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState({width: 0, height: 0});

    useEffect(() => {
        if (canvasRef.current) {
            const rect = canvasRef.current!.getBoundingClientRect();
            setCanvasDimensions({width: rect.width, height: rect.height});
        }
    }, []);

    const finalCanvasWidth = canvasSizes?.width ?? canvasDimensions.width;
    const finalCanvasHeight = canvasSizes?.height ?? canvasDimensions.height;

    const {renderContext, hoveredCandle, intervalSeconds} = useChartData(
        intervalsArray, visibleRange, currentPoint, finalCanvasWidth, finalCanvasHeight
    );

    const drawScene = (ctx: CanvasRenderingContext2D, hctx: CanvasRenderingContext2D | null) => {
        if (!renderContext) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, renderContext.canvasWidth, renderContext.canvasHeight);
        ctx.imageSmoothingEnabled = false;

        switch (chartType) {
            case ChartType.Candlestick:
                drawCandlestickChart(ctx, renderContext, chartOptions);
                break;
            case ChartType.Line:
                drawLineChart(ctx, renderContext, chartOptions);
                break;
            case ChartType.Area:
                drawAreaChart(ctx, renderContext, chartOptions);
                break;
            case ChartType.Bar:
                drawBarChart(ctx, renderContext, chartOptions);
                break;
            default:
                drawCandlestickChart(ctx, renderContext, chartOptions);
                break;
        }

        if (hctx && internalShowHistogram) {
            hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            hctx.clearRect(0, 0, renderContext.canvasWidth, hctx.canvas.height / dpr);
            hctx.imageSmoothingEnabled = false;
            drawHistogramChart(hctx, renderContext, chartOptions);
        }

        drawDrawings(ctx, drawings, selectedIndex);
    };

    const drawSceneToBuffer = useCallback(() => {
        const mainCanvas = canvasRef.current;
        if (!mainCanvas || !renderContext) return;

        if (!backBufferRef.current) backBufferRef.current = document.createElement('canvas');
        const backBufferCtx = backBufferRef.current!.getContext('2d');
        if (!backBufferCtx) return;

        let histBackBufferCtx: CanvasRenderingContext2D | null = null;
        if (internalShowHistogram && histCanvasRef.current) {
            if (!histBackBufferRef.current) histBackBufferRef.current = document.createElement('canvas');
            histBackBufferCtx = histBackBufferRef.current!.getContext('2d');
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.getBoundingClientRect();

        if (backBufferRef.current!.width !== rect.width * dpr || backBufferRef.current!.height !== rect.height * dpr) {
            backBufferRef.current!.width = rect.width * dpr;
            backBufferRef.current!.height = rect.height * dpr;
        }
        if (histBackBufferCtx && histBackBufferRef.current && histCanvasRef.current) {
            const hRect = histCanvasRef.current!.getBoundingClientRect();
            if (histBackBufferRef.current!.width !== hRect.width * dpr || histBackBufferRef.current!.height !== hRect.height * dpr) {
                histBackBufferRef.current!.width = hRect.width * dpr;
                histBackBufferRef.current!.height = hRect.height * dpr;
            }
        }
        drawScene(backBufferCtx, histBackBufferCtx);
    }, [renderContext, chartType, chartOptions, drawings, selectedIndex, internalShowHistogram]);

    const drawFrame = useCallback(() => {
        rafIdRef.current = null;

        if (tickingRef.current) {
            setCurrentPoint(pendingPointRef.current);
            tickingRef.current = false;
        }

        const mainCanvas = canvasRef.current;
        const backBuffer = backBufferRef.current;
        if (!mainCanvas || !backBuffer) return;
        const mainCtx = mainCanvas.getContext('2d');
        if (!mainCtx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.getBoundingClientRect();

        if (mainCanvas.width !== rect.width * dpr || mainCanvas.height !== rect.height * dpr) {
            mainCanvas.width = rect.width * dpr;
            mainCanvas.height = rect.height * dpr;
            drawSceneToBuffer();
        }

        mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        mainCtx.drawImage(backBuffer, panOffsetRef.current * dpr, 0); // Corrected pan direction

        const histCanvas = histCanvasRef.current;
        const histBackBuffer = histBackBufferRef.current;
        if (internalShowHistogram && histCanvas && histBackBuffer) {
            const hctx = histCanvas.getContext('2d');
            if (hctx) {
                const hRect = histCanvas.getBoundingClientRect();
                if (histCanvas.width !== hRect.width * dpr || histCanvas.height !== hRect.height * dpr) {
                    histCanvas.width = hRect.width * dpr;
                    histCanvas.height = hRect.height * dpr;
                }
                hctx.clearRect(0, 0, histCanvas.width, histCanvas.height);
                hctx.drawImage(histBackBuffer, panOffsetRef.current * dpr, 0); // Corrected pan direction
            }
        }

        if (isDrawing && startPoint && currentPoint) {
            let shape = null;
            switch (mode) {
                case Mode.drawLine:
                    shape = new LineShape(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y);
                    break;
                case Mode.drawRectangle:
                    shape = new RectangleShape(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
                    break;
                case Mode.drawCircle:
                    shape = new CircleShape(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, 'black', 2);
                    break;
                case Mode.drawTriangle:
                    shape = new TriangleShape(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y);
                    break;
                case Mode.drawAngle:
                    shape = new AngleShape(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, startPoint.x + 10, startPoint.y, 'black', 2);
                    break;
            }
            if (shape) {
                mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                shape.draw(mainCtx);
                mainCtx.stroke();
            }
        }
    }, [internalShowHistogram, drawSceneToBuffer, isDrawing, startPoint, currentPoint, mode]);

    const scheduleDraw = useCallback(() => {
        if (rafIdRef.current) return;
        rafIdRef.current = requestAnimationFrame(drawFrame);
    }, [drawFrame]);

    const panHandlers = useMemo(() => ({
        onPanStart: () => setIsPanning(true),
        onPan: (dx: number) => {
            panOffsetRef.current = dx;
            scheduleDraw();
        },
        onPanEnd: (dx: number) => {
            setIsPanning(false);
            const canvas = canvasRef.current;
            if (!canvas || dx === 0) {
                panOffsetRef.current = 0;
                scheduleDraw();
                return;
            }
            const timePerPixel = (visibleRange.end - visibleRange.start) / canvas.clientWidth;
            const timeOffset = dx * timePerPixel;

            const newStart = visibleRange.start + timeOffset;
            const newEnd = newStart + (visibleRange.end - visibleRange.start);

            setVisibleRange({start: newStart, end: newEnd});
            panOffsetRef.current = 0;
        }
    }), [visibleRange, setVisibleRange, scheduleDraw]);

    const isInteractionMode = mode === Mode.none || mode === Mode.select;
    usePanAndZoom(canvasRef, isInteractionMode, intervalsArray, visibleRange, setVisibleRange, intervalSeconds, panHandlers);

    useEffect(() => {
        if (renderContext) {
            drawSceneToBuffer();
            scheduleDraw();
        }
    }, [renderContext, drawSceneToBuffer, scheduleDraw]);

    useEffect(() => () => {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current!);
        }
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pendingPointRef.current = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        if (!tickingRef.current) {
            tickingRef.current = true;
            if (!isPanning) scheduleDraw();
        }
    };

    const handleMouseLeave = () => {
        pendingPointRef.current = null;
        if (!tickingRef.current) {
            tickingRef.current = true;
            if (!isPanning) scheduleDraw();
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isInteractionMode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPoint({x, y});
        setIsDrawing(true);
    };

    const handleMouseUp = () => {
        if (!isDrawing || !startPoint) return;
        setIsDrawing(false);
        setStartPoint(null);
        drawSceneToBuffer();
        scheduleDraw();
    };

    return (
        <InnerCanvasContainer $xAxisHeight={xAxisHeight}>
            <div style={{position: "relative", width: "100%", height: "100%"}}>
                <StyledCanvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    $heightPrecent={100}
                    style={{
                        position: "absolute",
                        backgroundColor: 'transparent',
                        inset: 0,
                        width: "100%",
                        zIndex: 2,
                        cursor: isInteractionMode ? (isPanning ? 'grabbing' : 'grab') : 'crosshair',
                        left: 0, right: 0, top: 0, bottom: 0,
                    }}
                />
                {internalShowHistogram && (
                    <StyledCanvas
                        ref={histCanvasRef}
                        $heightPrecent={Math.round(Math.max(0.1, Math.min(0.6, chartOptions?.base?.style?.histogram?.heightRatio ?? 0.30)) * 100)}
                        style={{
                            position: "absolute",
                            opacity: chartOptions?.base?.style?.histogram?.opacity ?? 0.5,
                            bottom: 0,
                            left: 0, right: 0,
                            width: "100%",
                            zIndex: 1,
                            pointerEvents: "none"
                        }}
                    />
                )}
            </div>
            {hoveredCandle && !isPanning && !isDrawing && (
                <HoverTooltip $isPositive={hoveredCandle.c > hoveredCandle.o}>
                    Time: {new Date(hoveredCandle.t * 1000).toLocaleString()} |
                    O: {hoveredCandle.o} | H: {hoveredCandle.h} | L: {hoveredCandle.l} | C: {hoveredCandle.c}
                    {hoveredCandle.v !== undefined && ` | V: ${hoveredCandle.v}`}
                </HoverTooltip>
            )}
        </InnerCanvasContainer>
    );
};