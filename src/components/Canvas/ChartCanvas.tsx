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
import {PriceRange, TimeRange} from "../../types/Graph";
import {LineShape} from "../Drawing/LineShape";
import {RectangleShape} from "../Drawing/RectangleShape";
import {CanvasSizes, DeepRequired} from "../../types/types";

interface ChartCanvasProps {
    intervalsArray: Interval[];
    drawings: any[];
    isDrawing: boolean;
    selectedIndex: number | null;
    setIsDrawing: (value: boolean) => void;
    visibleRange: TimeRange;
    setVisibleRange: (range: TimeRange) => void;
    visiblePriceRange: PriceRange;
    xAxisHeight: number;
    chartType: ChartType;
    chartOptions: DeepRequired<ChartOptions>;
    canvasSizes: CanvasSizes;
    parentContainerRef?: React.RefObject<HTMLDivElement>;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
                                                            intervalsArray,
                                                            visibleRange,
                                                            setVisibleRange,
                                                            visiblePriceRange,
                                                            drawings,
                                                            isDrawing,
                                                            setIsDrawing,
                                                            selectedIndex,
                                                            xAxisHeight,
                                                            chartType,
                                                            chartOptions,
                                                            canvasSizes,
                                                            parentContainerRef,
                                                        }) => {
    const {mode} = useMode();

    const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const hoverCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const histCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const backBufferRef = useRef<HTMLCanvasElement | null>(null);
    const histBackBufferRef = useRef<HTMLCanvasElement | null>(null);
    const requestAnimationIdRef = useRef<number | null>(null);
    const panOffsetRef = useRef(0);
    const currentPointRef = useRef<{ x: number; y: number } | null>(null);
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [isPanning, setIsPanning] = useState(false);
    const [isWheeling, setIsWheeling] = useState(false);
    const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
    const [startPoint, setStartPoint] = useState<DrawingPoint | null>(null);


    const {renderContext, hoveredCandle, intervalSeconds} = useChartData(
        intervalsArray, visibleRange, hoverPoint, canvasSizes.width, canvasSizes.height
    );


    const drawSceneToBuffer = useCallback(() => {
        if (!renderContext) return;

        const mainCanvas = mainCanvasRef.current;
        if (!mainCanvas) return;

        if (!backBufferRef.current) backBufferRef.current = document.createElement('canvas');
        const backBufferCtx = backBufferRef.current!.getContext('2d');
        if (!backBufferCtx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.getBoundingClientRect();

        if (backBufferRef.current!.width !== rect.width * dpr || backBufferRef.current!.height !== rect.height * dpr) {
            backBufferRef.current!.width = rect.width * dpr;
            backBufferRef.current!.height = rect.height * dpr;
        }
        backBufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        backBufferCtx.clearRect(0, 0, rect.width, rect.height);
        switch (chartType) {
            case ChartType.Candlestick:
                drawCandlestickChart(backBufferCtx, renderContext, chartOptions, visiblePriceRange);
                break;
            case ChartType.Line:
                drawLineChart(backBufferCtx, renderContext, chartOptions, visiblePriceRange);
                break;
            case ChartType.Area:
                drawAreaChart(backBufferCtx, renderContext, chartOptions, visiblePriceRange);
                break;
            case ChartType.Bar:
                drawBarChart(backBufferCtx, renderContext, chartOptions, visiblePriceRange);
                break;
            default:
                drawCandlestickChart(backBufferCtx, renderContext, chartOptions, visiblePriceRange);
                break;
        }
        drawDrawings(backBufferCtx, drawings, selectedIndex);

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
                histBackBufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                histBackBufferCtx.clearRect(0, 0, hRect.width, hRect.height);
                drawHistogramChart(histBackBufferCtx, renderContext, chartOptions);
            }
        }
    }, [renderContext, chartType, chartOptions, drawings, selectedIndex, canvasSizes, visiblePriceRange]);

    const drawFrame = useCallback(() => {
        requestAnimationIdRef.current = null;

        const dpr = window.devicePixelRatio || 1;
        const panOffset = panOffsetRef.current;

        const mainCanvas = mainCanvasRef.current;
        const backBuffer = backBufferRef.current;
        if (mainCanvas && backBuffer) {
            const mainCtx = mainCanvas.getContext('2d');
            if (mainCtx) {
                const rect = mainCanvas.getBoundingClientRect();
                if (mainCanvas.width !== rect.width * dpr || mainCanvas.height !== rect.height * dpr) {
                    mainCanvas.width = rect.width * dpr;
                    mainCanvas.height = rect.height * dpr;
                    drawSceneToBuffer();
                }
                mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                mainCtx.clearRect(0, 0, rect.width, rect.height);
                mainCtx.drawImage(backBuffer, panOffset, 0);
            }
        }

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
                hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                hctx.clearRect(0, 0, hRect.width, hRect.height);
                hctx.drawImage(histBackBuffer, panOffset, 0);
            }
        }

        const hoverCanvas = hoverCanvasRef.current;
        if (hoverCanvas) {
            const hoverCtx = hoverCanvas.getContext('2d');
            if (hoverCtx) {
                const rect = hoverCanvas.getBoundingClientRect();
                if (hoverCanvas.width !== rect.width * dpr || hoverCanvas.height !== rect.height * dpr) {
                    hoverCanvas.width = rect.width * dpr;
                    hoverCanvas.height = rect.height * dpr;
                }
                hoverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                hoverCtx.clearRect(0, 0, rect.width, rect.height);
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
    }, [isDrawing, isPanning, isWheeling, startPoint, mode, chartOptions.base.showHistogram, drawSceneToBuffer, visibleRange, visiblePriceRange]);
    const scheduleDraw = useCallback(() => {
        if (requestAnimationIdRef.current) return;
        requestAnimationIdRef.current = window.requestAnimationFrame(drawFrame);
    }, [drawFrame]);

    useEffect(
        () => {
            return () => {
                if (requestAnimationIdRef.current) {
                    // console.log("[DEBUG] Step 7: Cleaning up animation frame.");
                    window.cancelAnimationFrame(requestAnimationIdRef.current!);
                }
                if (throttleTimerRef.current) {
                    clearTimeout(throttleTimerRef.current!);
                }
            };
        },
        []
    );


    useEffect(() => {
        // This effect runs ONLY when the data context itself changes.
        // console.log("[DEBUG] ChartCanvas Debug Info:", {
        //     width: canvasSizes.width,
        //     height: canvasSizes.height,
        //     isRenderContextNull: renderContext === null,
        //     intervals: intervalsArray.length,
        // });

        if (renderContext) {
            console.log('[INIT] renderContext ready', {
                intervals: intervalsArray.length,
                canvasW: canvasSizes.width,
                canvasH: canvasSizes.height,
                vrange: visibleRange,
                prange: visiblePriceRange,
            });
            drawSceneToBuffer();
            scheduleDraw();
        }
    }, [renderContext]);

    useEffect(() => {
        if (!renderContext) return;
        drawSceneToBuffer();
        scheduleDraw();
    }, [visiblePriceRange, renderContext, drawSceneToBuffer, scheduleDraw]);


    const panHandlers = useMemo(() => ({
        onPanStart: () => setIsPanning(true),
        onPan: (dx: number) => {
            panOffsetRef.current = dx;
            scheduleDraw();
        },
        onPanEnd: (dx: number) => {
            setIsPanning(false);
            const hover = hoverCanvasRef.current;
            const main = mainCanvasRef.current;
            if ((!hover && !main) || dx === 0) {
                panOffsetRef.current = 0;
                scheduleDraw();
                return;
            }
            const mainRectW = main ? main.getBoundingClientRect().width : 0;
            const widthPx = canvasSizes.width || mainRectW || (hover ? hover.clientWidth : 0) || 1; // prefer external measured width
            const timePerPixel = (visibleRange.end - visibleRange.start) / widthPx;
            const timeOffset = dx * timePerPixel;
            const newStart = Math.round(visibleRange.start - timeOffset);
            const newEnd = newStart + (visibleRange.end - visibleRange.start);
            setVisibleRange({start: newStart, end: newEnd});
            panOffsetRef.current = 0;
        },
        onWheelStart: () => setIsWheeling(true),
        onWheelEnd: () => setIsWheeling(false),
    }), [visibleRange, setVisibleRange, scheduleDraw, canvasSizes.width]);
    // Memoized computation for main chart canvas height (so main chart does not overlap the histogram area when it is shown)
    const mainHeightPercent = useMemo(() => {
        if (!chartOptions.base.showHistogram) return 100;
        const r = Math.max(0.1, Math.min(0.6, chartOptions.base.style.histogram.heightRatio));
        return Math.max(0, Math.min(100, Math.round((1 - r) * 100)));
    }, [chartOptions.base.showHistogram, chartOptions.base.style.histogram.heightRatio]);

    const isInteractionMode = mode === Mode.none || mode === Mode.select;
    usePanAndZoom(hoverCanvasRef, isInteractionMode, intervalsArray, visibleRange, setVisibleRange, intervalSeconds, panHandlers);


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
        setIsDrawing(false);
        setStartPoint(null);
        drawSceneToBuffer();
        scheduleDraw();
    };

    return (
        <InnerCanvasContainer $xAxisHeight={xAxisHeight} ref={parentContainerRef}>
            <div style={{position: "relative", width: "100%", height: "100%"}}>
                <StyledCanvas
                    ref={mainCanvasRef}
                    $heightPrecent={mainHeightPercent}
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