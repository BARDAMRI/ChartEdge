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

    // Canvas Layers
    const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const hoverCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const histCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Offscreen Buffers
    const backBufferRef = useRef<HTMLCanvasElement | null>(null);
    const histBackBufferRef = useRef<HTMLCanvasElement | null>(null);

    // Animation & Interaction Refs
    const rafIdRef = useRef<number | null>(null);
    const panOffsetRef = useRef(0);
    const currentPointRef = useRef<{ x: number; y: number } | null>(null);
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

    // State
    const [isPanning, setIsPanning] = useState(false);
    const [isWheeling, setIsWheeling] = useState(false);
    const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState({width: 0, height: 0});

    // Robust dimension measurement with ResizeObserver
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length > 0 && entries[0].contentRect) {
                const {width, height} = entries[0].contentRect;
                // Only update if dimensions have actually changed to avoid extra renders
                if (canvasDimensions.width !== width || canvasDimensions.height !== height) {
                    setCanvasDimensions({width, height});
                }
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [canvasDimensions.width, canvasDimensions.height]); // Rerun if dimensions change from another source

    const finalCanvasWidth = canvasSizes?.width ?? canvasDimensions.width;
    const finalCanvasHeight = canvasSizes?.height ?? canvasDimensions.height;

    const {renderContext, hoveredCandle, intervalSeconds} = useChartData(
        intervalsArray, visibleRange, hoverPoint, finalCanvasWidth, finalCanvasHeight
    );

    useEffect(() => {
        console.log("ChartCanvas Debug Info:");
        console.log("Canvas Dimensions:", {width: finalCanvasWidth, height: finalCanvasHeight});
        console.log("Is renderContext null?", renderContext === null);
        if (renderContext) {
            console.log("Render Context:", renderContext);
        }
        console.log("Number of intervals:", intervalsArray.length);
    }, [renderContext, finalCanvasWidth, finalCanvasHeight, intervalsArray]);

    useEffect(() => {
        console.log("[DEBUG] ChartCanvas Debug Info:", {
            width: finalCanvasWidth,
            height: finalCanvasHeight,
            isRenderContextNull: renderContext === null,
            intervals: intervalsArray.length,
        });

        if (renderContext) {
            console.log("[DEBUG] Step 1: renderContext is available. Triggering buffer draw.");
            drawSceneToBuffer();
            scheduleDraw();
        }
    }, [renderContext]);


    const drawScene = useCallback((ctx: CanvasRenderingContext2D, hctx: CanvasRenderingContext2D | null) => {
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

        if (hctx && chartOptions.base.showHistogram) {
            const histHeight = hctx.canvas.height / dpr;
            hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            hctx.clearRect(0, 0, renderContext.canvasWidth, histHeight);
            hctx.imageSmoothingEnabled = false;
            drawHistogramChart(hctx, renderContext, chartOptions);
        }

        drawDrawings(ctx, drawings, selectedIndex);
    }, [renderContext, chartType, chartOptions, drawings, selectedIndex]);

    const drawSceneToBuffer = useCallback(() => {
        if (!renderContext) return; // Guard against null context

        const mainCanvas = mainCanvasRef.current;
        if (!mainCanvas) return;

        // --- Main Canvas Buffer ---
        if (!backBufferRef.current) backBufferRef.current = document.createElement('canvas');
        const backBufferCtx = backBufferRef.current!.getContext('2d');
        if (!backBufferCtx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.getBoundingClientRect();

        if (backBufferRef.current!.width !== rect.width * dpr || backBufferRef.current!.height !== rect.height * dpr) {
            backBufferRef.current!.width = rect.width * dpr;
            backBufferRef.current!.height = rect.height * dpr;
        }

        // Clear and draw the main chart directly here
        backBufferCtx.clearRect(0, 0, backBufferRef.current!.width, backBufferRef.current!.height);
        switch (chartType) {
            case ChartType.Candlestick:
                drawCandlestickChart(backBufferCtx, renderContext, chartOptions);
                break;
            case ChartType.Line:
                drawLineChart(backBufferCtx, renderContext, chartOptions);
                break;
            case ChartType.Area:
                drawAreaChart(backBufferCtx, renderContext, chartOptions);
                break;
            case ChartType.Bar:
                drawBarChart(backBufferCtx, renderContext, chartOptions);
                break;
            default:
                drawCandlestickChart(backBufferCtx, renderContext, chartOptions);
                break;
        }
        drawDrawings(backBufferCtx, drawings, selectedIndex);


        // --- Histogram Buffer ---
        const histCanvas = histCanvasRef.current;
        if (chartOptions.base.showHistogram && histCanvas) {
            if (!histBackBufferRef.current) histBackBufferRef.current = document.createElement('canvas');
            const histBackBufferCtx = histBackBufferRef.current!.getContext('2d');
            if (histBackBufferCtx) {
                const hRect = histCanvas.getBoundingClientRect();
                if (histBackBufferRef.current!.width !== hRect.width * dpr || histBackBufferRef.current!.height !== hRect.height * dpr) {
                    histBackBufferRef.current!.width = hRect.width * dpr;
                    histBackBufferRef.current!.height = hRect.height * dpr;
                }
                // Clear and draw the histogram directly here
                histBackBufferCtx.clearRect(0, 0, histBackBufferRef.current!.width, histBackBufferRef.current!.height);
                drawHistogramChart(histBackBufferCtx, renderContext, chartOptions);
            }
        }
    }, [renderContext, chartType, chartOptions, drawings, selectedIndex]);

    const drawFrame = useCallback(() => {
        rafIdRef.current = null;
        const dpr = window.devicePixelRatio || 1;

        rafIdRef.current = null;
        console.log("[DEBUG] Step 5: drawFrame (animation frame) is executing.");

        const mainCanvas = mainCanvasRef.current;
        const backBuffer = backBufferRef.current;

        if (!mainCanvas || !backBuffer) {
            console.error("[DEBUG] drawFrame stopped: mainCanvas or backBuffer is missing.");
            return;
        }

        const mainCtx = mainCanvas.getContext('2d');
        if (!mainCtx) return;

        console.log("[DEBUG] Step 6: About to draw from buffer to main canvas.");
        mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        mainCtx.drawImage(backBuffer, -panOffsetRef.current * (window.devicePixelRatio || 1), 0);


        // Part 2: Draw histogram layer from buffer
        const histCanvas = histCanvasRef.current;
        const histBackBuffer = histBackBufferRef.current;
        if (chartOptions.base.showHistogram && histCanvas && histBackBuffer) {
            const hctx = histCanvas.getContext('2d');
            if (hctx) {
                const hRect = histCanvas.getBoundingClientRect();
                if (histCanvas.width !== hRect.width * dpr || histCanvas.height !== hRect.height * dpr) {
                    histCanvas.width = hRect.width * dpr;
                    histCanvas.height = hRect.height * dpr;
                }
                hctx.clearRect(0, 0, histCanvas.width, histCanvas.height);
                hctx.drawImage(histBackBuffer, -panOffsetRef.current * dpr, 0);
            }
        }

        // Part 3: Draw interactive hover layer
        const hoverCanvas = hoverCanvasRef.current;
        if (hoverCanvas) {
            const hoverCtx = hoverCanvas.getContext('2d');
            if (hoverCtx) {
                const rect = hoverCanvas.getBoundingClientRect();
                if (hoverCanvas.width !== rect.width * dpr || hoverCanvas.height !== rect.height * dpr) {
                    hoverCanvas.width = rect.width * dpr;
                    hoverCanvas.height = rect.height * dpr;
                }
                hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);

                const point = currentPointRef.current;
                const isInteractionMode = mode === Mode.none || mode === Mode.select;

                if (point && !isPanning && !isWheeling) {
                    hoverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                    if (isDrawing && startPoint) {
                        let shape = null;
                        switch (mode) {
                            case Mode.drawLine:
                                shape = new LineShape(startPoint.x, startPoint.y, point.x, point.y);
                                break;
                            case Mode.drawRectangle:
                                shape = new RectangleShape(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y);
                                break;
                        }
                        if (shape) {
                            shape.draw(hoverCtx);
                            hoverCtx.stroke();
                        }
                    } else if (isInteractionMode) {
                        hoverCtx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
                        hoverCtx.lineWidth = 1;
                        hoverCtx.beginPath();
                        hoverCtx.moveTo(point.x, 0);
                        hoverCtx.lineTo(point.x, rect.height);
                        hoverCtx.moveTo(0, point.y);
                        hoverCtx.lineTo(rect.width, point.y);
                        hoverCtx.stroke();
                    }
                }
            }
        }
    }, [isDrawing, isPanning, isWheeling, startPoint, mode, chartOptions.base.showHistogram, drawSceneToBuffer]);

    const scheduleDraw = useCallback(() => {
        if (rafIdRef.current) return;
        console.log("[DEBUG] Step 4: scheduleDraw is requesting an animation frame.");
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
            const canvas = hoverCanvasRef.current;
            if (!canvas || dx === 0) {
                panOffsetRef.current = 0;
                scheduleDraw();
                return;
            }
            const timePerPixel = (visibleRange.end - visibleRange.start) / canvas.clientWidth;
            const timeOffset = dx * timePerPixel;
            const newStart = visibleRange.start - timeOffset;
            const newEnd = newStart + (visibleRange.end - visibleRange.start);
            setVisibleRange({start: newStart, end: newEnd});
            panOffsetRef.current = 0;
        },
        onWheelStart: () => setIsWheeling(true),
        onWheelEnd: () => setIsWheeling(false),
    }), [visibleRange, setVisibleRange, scheduleDraw]);

    const isInteractionMode = mode === Mode.none || mode === Mode.select;
    usePanAndZoom(hoverCanvasRef, isInteractionMode, intervalsArray, visibleRange, setVisibleRange, intervalSeconds, panHandlers);

    useEffect(() => {
        if (renderContext) {
            drawSceneToBuffer();
            scheduleDraw();
        }
    }, [renderContext]);

    useEffect(() => () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current!);
        if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current!);
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const point = {x: e.clientX - rect.left, y: e.clientY - rect.top};

        currentPointRef.current = point;
        scheduleDraw();

        if (throttleTimerRef.current) {
            clearTimeout(throttleTimerRef.current!);
        }
        throttleTimerRef.current = setTimeout(() => {
            setHoverPoint(point);
        }, 50);
    };

    const handleMouseLeave = () => {
        currentPointRef.current = null;
        setHoverPoint(null);
        scheduleDraw();
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
        // Logic to add the final drawing to the `drawings` array would go here.
        setIsDrawing(false);
        setStartPoint(null);
        drawSceneToBuffer();
        scheduleDraw();
    };

    return (
        <InnerCanvasContainer $xAxisHeight={xAxisHeight} ref={containerRef}>
            <div style={{position: "relative", width: "100%", height: "100%"}}>
                <StyledCanvas
                    ref={mainCanvasRef}
                    $heightPrecent={100}
                    style={{position: "absolute", zIndex: 1, pointerEvents: "none"}}
                />

                {chartOptions.base.showHistogram && (
                    <StyledCanvas
                        ref={histCanvasRef}
                        $heightPrecent={Math.round(Math.max(0.1, Math.min(0.6, chartOptions.base.style.histogram.heightRatio)) * 100)}
                        style={{
                            position: "absolute",
                            opacity: chartOptions.base.style.histogram.opacity,
                            bottom: 0,
                            zIndex: 2,
                            pointerEvents: "none"
                        }}
                    />
                )}

                <StyledCanvas
                    ref={hoverCanvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    $heightPrecent={100}
                    style={{
                        position: "absolute",
                        zIndex: 3,
                        cursor: isInteractionMode ? (isPanning ? 'grabbing' : 'grab') : 'crosshair'
                    }}
                />
            </div>
            {hoveredCandle && !isPanning && !isDrawing && !isWheeling && (
                <HoverTooltip $isPositive={hoveredCandle.c > hoveredCandle.o}>
                    Time: {new Date(hoveredCandle.t * 1000).toLocaleString()} |
                    O: {hoveredCandle.o} | H: {hoveredCandle.h} | L: {hoveredCandle.l} | C: {hoveredCandle.c}
                    {hoveredCandle.v !== undefined && ` | V: ${hoveredCandle.v}`}
                </HoverTooltip>
            )}
        </InnerCanvasContainer>
    );
};