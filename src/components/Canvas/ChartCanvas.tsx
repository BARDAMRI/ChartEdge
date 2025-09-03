import React, {useRef, useEffect, useState, useCallback, useMemo} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {
    StyledCanvasNonResponsive,
    InnerCanvasContainer,
    HoverTooltip,
    ChartingContainer,
    StyledCanvasResponsive
} from '../../styles/ChartCanvas.styles';
import {ChartOptions, ChartType} from "../../types/chartOptions";
import {drawAreaChart, drawBarChart, drawCandlestickChart, drawHistogramChart, drawLineChart} from "./utils/GraphDraw";
import {drawDrawings} from './utils/drawDrawings';
import {useChartData} from '../../hooks/useChartData';
import {usePanAndZoom} from '../../hooks/usePanAndZoom';
import {Interval} from "../../types/Interval";
import {DrawingPoint} from "../../types/Drawings";
import {PriceRange, TimeRange, ChartDimensionsData} from "../../types/Graph";
import {CanvasSizes, DeepRequired, WindowSpreadOptions} from "../../types/types";
import {priceToY, timeToX, xToTime, yToPrice} from "./utils/GraphHelpers";
import {Drawing, ShapeArgs} from "../Drawing/types";
import {PolylineShapeArgs} from "../Drawing/Polyline";

interface ChartCanvasProps {
    intervalsArray: Interval[];
    drawings: any[];
    setDrawings: (drawings: any[] | ((prev: any[]) => any[])) => void;
    isDrawing: boolean;
    selectedIndex: number | null;
    setIsDrawing: (value: boolean) => void;
    visibleRange: TimeRange;
    setVisibleRange: (range: TimeRange) => void;
    visiblePriceRange: PriceRange;
    chartType: ChartType;
    chartOptions: DeepRequired<ChartOptions>;
    canvasSizes: CanvasSizes;
    parentContainerRef?: React.RefObject<HTMLDivElement>;
    windowSpread: WindowSpreadOptions;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
                                                            intervalsArray,
                                                            visibleRange,
                                                            setVisibleRange,
                                                            visiblePriceRange,
                                                            drawings,
                                                            setDrawings,
                                                            isDrawing,
                                                            setIsDrawing,
                                                            selectedIndex,
                                                            chartType,
                                                            chartOptions,
                                                            canvasSizes,
                                                            parentContainerRef,
                                                            windowSpread,
                                                        }) => {
    const {mode} = useMode();

    const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const hoverCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const histCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawingsCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const backBufferRef = useRef<HTMLCanvasElement | null>(null);
    const histBackBufferRef = useRef<HTMLCanvasElement | null>(null);
    const requestAnimationIdRef = useRef<number | null>(null);
    const drawingsBackBufferRef = useRef<HTMLCanvasElement | null>(null);
    const panOffsetRef = useRef(0);
    const currentPointRef = useRef<{ x: number; y: number } | null>(null);
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [isPanning, setIsPanning] = useState(false);
    const [isWheeling, setIsWheeling] = useState(false);
    const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
    const [startPoint, setStartPoint] = useState<DrawingPoint | null>(null);
    const [wipPolylinePoints, setWipPolylinePoints] = useState<{ time: number; price: number }[]>([]);
    // Chart dimension state and ref
    const [_, setChartDimensions] = React.useState<ChartDimensionsData | null>(null);
    const chartDimensionsRef = React.useRef<ChartDimensionsData | null>(null);


    const {renderContext, hoveredCandle, intervalSeconds} = useChartData(
        intervalsArray, visibleRange, hoverPoint, canvasSizes.width, canvasSizes.height
    );

    useEffect(() => {
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = Math.max(0, canvasSizes?.width || 0);
        const cssHeight = Math.max(0, canvasSizes?.height || 0);
        const next: ChartDimensionsData = {
            cssWidth,
            cssHeight,
            dpr,
            width: Math.round(cssWidth * dpr),
            height: Math.round(cssHeight * dpr),
            clientWidth: cssWidth,
            clientHeight: cssHeight,
        };
        setChartDimensions(prev => {
            if (
                prev &&
                prev.cssWidth === next.cssWidth &&
                prev.cssHeight === next.cssHeight &&
                prev.dpr === next.dpr &&
                prev.width === next.width &&
                prev.height === next.height
            ) {
                chartDimensionsRef.current = next;
                return prev;
            }
            chartDimensionsRef.current = next;
            return next;
        });
    }, [canvasSizes?.width, canvasSizes?.height]);

    useEffect(() => {
        const onResize = () => {
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = Math.max(0, canvasSizes?.width || 0);
            const cssHeight = Math.max(0, canvasSizes?.height || 0);
            const next: ChartDimensionsData = {
                cssWidth,
                cssHeight,
                dpr,
                width: Math.round(cssWidth * dpr),
                height: Math.round(cssHeight * dpr),
                clientWidth: cssWidth,
                clientHeight: cssHeight,
            };
            chartDimensionsRef.current = next;
            setChartDimensions(next);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [canvasSizes?.width, canvasSizes?.height]);


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setWipPolylinePoints([]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    const drawSceneToBuffer = useCallback(() => {
        if (!renderContext) return;

        const mainCanvas = mainCanvasRef.current;
        if (!mainCanvas) return;

        if (!backBufferRef.current) backBufferRef.current = document.createElement('canvas');
        const backBufferCtx = backBufferRef.current!.getContext('2d');
        if (!backBufferCtx) return;

        const dims = chartDimensionsRef.current || {
            cssWidth: Math.max(0, canvasSizes.width),
            cssHeight: Math.max(0, canvasSizes.height),
            dpr: window.devicePixelRatio || 1,
            width: Math.max(0, Math.round(canvasSizes.width * (window.devicePixelRatio || 1))),
            height: Math.max(0, Math.round(canvasSizes.height * (window.devicePixelRatio || 1))),
            clientWidth: Math.max(0, canvasSizes.width),
            clientHeight: Math.max(0, canvasSizes.height),
        };
        const {cssWidth, cssHeight, dpr} = dims;

        if (backBufferRef.current!.width !== cssWidth * dpr || backBufferRef.current!.height !== cssHeight * dpr) {
            backBufferRef.current!.width = cssWidth * dpr;
            backBufferRef.current!.height = cssHeight * dpr;
        }
        backBufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        backBufferCtx.clearRect(0, 0, cssWidth, cssHeight);
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
        // drawDrawings(backBufferCtx, drawings, selectedIndex); // REMOVED: do not draw persistent drawings into back buffer

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

                const histogramRenderContext = {
                    ...renderContext,
                    canvasWidth: renderContext.canvasWidth,
                    canvasHeight: hRect.height
                };
                drawHistogramChart(histBackBufferCtx, histogramRenderContext, chartOptions);
            }
        }
    }, [renderContext, chartType, chartOptions, drawings, selectedIndex, canvasSizes, visiblePriceRange]);

    // Draw persistent drawings to their own canvas layer
    const redrawDrawingsLayer = useCallback(() => {
        if (!renderContext || !chartOptions) return;

        if (!drawingsBackBufferRef.current) drawingsBackBufferRef.current = document.createElement('canvas');

        if (!drawingsCanvasRef.current) return;
        const canvas = drawingsBackBufferRef.current!;

        const dims = chartDimensionsRef.current;
        if (!dims) return;
        const {cssWidth, cssHeight, dpr} = dims;

        if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
            canvas.width = cssWidth * dpr;
            canvas.height = cssHeight * dpr;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssWidth, cssHeight);

        // קריאה נכונה עם כל הפרמטרים
        drawDrawings(ctx, drawings, selectedIndex, renderContext, visiblePriceRange, chartOptions);

    }, [drawings, selectedIndex, renderContext, visiblePriceRange, chartOptions]);


    const drawFrame = useCallback(() => {
        requestAnimationIdRef.current = null;

        const panOffset = panOffsetRef.current;
        const dims = chartDimensionsRef.current;
        if (!dims) return;

        const {cssWidth, cssHeight, dpr} = dims;

        // --------------------------------------------------
        // 1. Main Chart Canvas (Candlesticks, etc.)
        // --------------------------------------------------
        const mainCanvas = mainCanvasRef.current;
        const backBuffer = backBufferRef.current;
        if (mainCanvas && backBuffer) {
            const mainCtx = mainCanvas.getContext('2d');
            if (mainCtx) {
                if (mainCanvas.width !== cssWidth * dpr || mainCanvas.height !== cssHeight * dpr) {
                    mainCanvas.width = cssWidth * dpr;
                    mainCanvas.height = cssHeight * dpr;
                    drawSceneToBuffer();
                }
                mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                mainCtx.clearRect(0, 0, cssWidth, cssHeight);
                mainCtx.drawImage(backBuffer, -panOffset, 0, cssWidth, cssHeight);
            }
        }

        // --------------------------------------------------
        // 2. Histogram Canvas
        // --------------------------------------------------
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
                hctx.drawImage(histBackBuffer, -panOffset, 0, hRect.width, hRect.height);
            }
        }

        // --------------------------------------------------
        // 3. Persistent Drawings Canvas
        // --------------------------------------------------
        const drawingsCanvas = drawingsCanvasRef.current;
        const drawingsBackBuffer = drawingsBackBufferRef.current;
        if (drawingsCanvas && drawingsBackBuffer) {
            const dctx = drawingsCanvas.getContext('2d');
            if (dctx) {
                if (drawingsCanvas.width !== cssWidth * dpr || drawingsCanvas.height !== cssHeight * dpr) {
                    drawingsCanvas.width = cssWidth * dpr;
                    drawingsCanvas.height = cssHeight * dpr;
                    redrawDrawingsLayer();
                }
                dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                dctx.clearRect(0, 0, cssWidth, cssHeight);
                dctx.drawImage(drawingsBackBuffer, -panOffset, 0, cssWidth, cssHeight);
            }
        }

        // --------------------------------------------------
        // 4. Hover & Interaction Canvas
        // --------------------------------------------------
        const hoverCanvas = hoverCanvasRef.current;
        if (hoverCanvas) {
            const hoverCtx = hoverCanvas.getContext('2d');
            if (hoverCtx) {
                if (hoverCanvas.width !== cssWidth * dpr || hoverCanvas.height !== cssHeight * dpr) {
                    hoverCanvas.width = cssWidth * dpr;
                    hoverCanvas.height = cssHeight * dpr;
                }
                hoverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                hoverCtx.clearRect(0, 0, cssWidth, cssHeight);

                const point = currentPointRef.current;
                const isInteractionMode = mode === Mode.none || mode === Mode.select;

                if (mode === Mode.drawPolyline && wipPolylinePoints.length > 0 && renderContext) {
                    const pixelPoints = wipPolylinePoints.map(p => ({
                        x: timeToX(p.time, renderContext.canvasWidth, renderContext.visibleRange),
                        y: priceToY(p.price, renderContext.canvasHeight, visiblePriceRange)
                    }));

                    hoverCtx.strokeStyle = chartOptions.base.style.drawings.lineColor as string;
                    hoverCtx.lineWidth = chartOptions.base.style.drawings.lineWidth as number;
                    hoverCtx.setLineDash([]);

                    hoverCtx.beginPath();
                    hoverCtx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
                    for (let i = 1; i < pixelPoints.length; i++) {
                        hoverCtx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
                    }
                    hoverCtx.stroke();

                    if (point) {
                        const lastPoint = pixelPoints[pixelPoints.length - 1];
                        hoverCtx.setLineDash([4, 4]);
                        hoverCtx.beginPath();
                        hoverCtx.moveTo(lastPoint.x, lastPoint.y);
                        hoverCtx.lineTo(point.x, point.y);
                        hoverCtx.stroke();
                        hoverCtx.setLineDash([]);
                    }

                    // Drag Shape Preview Logic (for line, rectangle, etc.)
                } else if (isDrawing && startPoint && point) {
                    hoverCtx.strokeStyle = chartOptions.base.style.drawings.lineColor as string;
                    hoverCtx.lineWidth = chartOptions.base.style.drawings.lineWidth as number;
                    hoverCtx.setLineDash([]);

                    switch (mode) {
                        case Mode.drawLine:
                        case Mode.drawArrow:
                        case Mode.drawAngle:
                        case Mode.drawTriangle:
                        case Mode.drawCircle:
                            hoverCtx.beginPath();
                            hoverCtx.moveTo(startPoint.x, startPoint.y);
                            hoverCtx.lineTo(point.x, point.y);
                            hoverCtx.stroke();
                            break;
                        case Mode.drawRectangle:
                            hoverCtx.strokeRect(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y);
                            break;
                    }

                    // Crosshair Logic
                } else if (isInteractionMode && point && !isPanning && !isWheeling) {
                    hoverCtx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
                    hoverCtx.lineWidth = 1;
                    hoverCtx.beginPath();
                    hoverCtx.moveTo(point.x, 0);
                    hoverCtx.lineTo(point.x, cssHeight);
                    hoverCtx.moveTo(0, point.y);
                    hoverCtx.lineTo(cssWidth, point.y);
                    hoverCtx.stroke();
                }
            }
        }
    }, [
        isDrawing, isPanning, isWheeling, startPoint, wipPolylinePoints, mode,
        chartOptions, drawSceneToBuffer, redrawDrawingsLayer,
        visibleRange, visiblePriceRange, canvasSizes.width, canvasSizes.height,
        renderContext
    ]);


    useEffect(() => {
        redrawDrawingsLayer();
    }, [redrawDrawingsLayer]);
    const scheduleDraw = useCallback(() => {
        if (requestAnimationIdRef.current) return;
        requestAnimationIdRef.current = window.requestAnimationFrame(drawFrame);
    }, [drawFrame]);

    useEffect(() => {
        if (renderContext) {
            drawSceneToBuffer();
            scheduleDraw();
        }

        return () => {
            if (requestAnimationIdRef.current) {
                if (typeof requestAnimationIdRef.current === "number") {
                    window.cancelAnimationFrame(requestAnimationIdRef.current);
                }
                requestAnimationIdRef.current = null;
            }
        };
    }, [renderContext, drawSceneToBuffer, scheduleDraw]);
    useEffect(() => {
        if (!renderContext) return;
        drawSceneToBuffer();
        scheduleDraw();

        return () => {
            if (requestAnimationIdRef.current) {
                if (typeof requestAnimationIdRef.current === "number") {
                    window.cancelAnimationFrame(requestAnimationIdRef.current);
                }
                requestAnimationIdRef.current = null;
            }
        };
    }, [visiblePriceRange, renderContext, drawSceneToBuffer, scheduleDraw]);

    const panHandlers = useMemo(() => ({
        onPanStart: () => {
            setIsPanning(true)
        },
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
            const widthPx = canvasSizes.width || mainRectW || (hover ? hover.clientWidth : 0) || 1; // prefer external measured endTime
            const timePerPixel = (visibleRange.end - visibleRange.start) / widthPx;
            const timeOffset = dx * timePerPixel;
            const newStart = Math.round(visibleRange.start - timeOffset);
            const newEnd = newStart + (visibleRange.end - visibleRange.start);
            setVisibleRange({start: newStart, end: newEnd});
            panOffsetRef.current = 0;
        },
        onWheelStart: () => {
            setIsWheeling(true)
        },
        onWheelEnd: () => {
            setIsWheeling(false)
        },
    }), [visibleRange, setVisibleRange, scheduleDraw, canvasSizes.width]);

    const isInteractionMode = mode === Mode.none || mode === Mode.select;
    const panZoomEnabled = (mode === Mode.none || mode === Mode.select) && !isDrawing;
    usePanAndZoom(
        hoverCanvasRef,
        panZoomEnabled,
        intervalsArray,
        visibleRange,
        setVisibleRange,
        intervalSeconds,
        panHandlers,
        () => canvasSizes.width,
    );


    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        console.log('MOUSE MOVE');
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
        if (mode === Mode.drawPolyline) {
            if (!renderContext) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const point = {x: e.clientX - rect.left, y: e.clientY - rect.top};

            const time = xToTime(point.x, renderContext.canvasWidth, renderContext.visibleRange);
            const price = yToPrice(point.y, renderContext.canvasHeight, visiblePriceRange);

            setWipPolylinePoints(prev => [...prev, {time, price}]);
            return;
        }

        if (isInteractionMode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPoint({x, y});
        setIsDrawing(true);
    };
    const handleMouseUp = () => {
        // Exit if not in a drag-based drawing mode or if essential data is missing
        if (!isDrawing || !startPoint || !renderContext || mode === Mode.drawPolyline) return;

        const endPoint = currentPointRef.current;
        if (endPoint) {
            // Convert pixel coordinates from the drag into data coordinates (time and price)
            const startTime = xToTime(startPoint.x, renderContext.canvasWidth, renderContext.visibleRange);
            const startPrice = yToPrice(startPoint.y, renderContext.canvasHeight, visiblePriceRange);
            const endTime = xToTime(endPoint.x, renderContext.canvasWidth, renderContext.visibleRange);
            const endPrice = yToPrice(endPoint.y, renderContext.canvasHeight, visiblePriceRange);

            let newDrawingArgs: ShapeArgs | null = null;

            // Create the appropriate arguments object based on the current drawing mode
            switch (mode) {
                case Mode.drawLine:
                case Mode.drawArrow:
                case Mode.drawCircle:
                case Mode.drawTriangle:
                case Mode.drawAngle: {
                    newDrawingArgs = {startTime, startPrice, endTime, endPrice};
                    break;
                }
                case Mode.drawRectangle: {
                    // Ensure the rectangle's start/end points are always top-left and bottom-right
                    const rectStartTime = Math.min(startTime, endTime);
                    const rectStartPrice = Math.max(startPrice, endPrice);
                    const rectEndTime = Math.max(startTime, endTime);
                    const rectEndPrice = Math.min(startPrice, endPrice);
                    newDrawingArgs = {
                        startTime: rectStartTime,
                        startPrice: rectStartPrice,
                        endTime: rectEndTime,
                        endPrice: rectEndPrice
                    };
                    break;
                }
                case Mode.drawCustomSymbol: {
                    // The symbol is placed at the drag's end point
                    newDrawingArgs = {time: endTime, price: endPrice, symbol: '⭐', size: 20};
                    break;
                }
                default:
                    break;
            }

            // If a valid shape was created, add it to the drawings array
            if (newDrawingArgs) {
                // Create a "clean" drawing object.
                // It contains only the mode and geometric data.
                // Its style will be applied dynamically from chartOptions during rendering.
                const newDrawing: Drawing = {
                    mode: mode,
                    args: newDrawingArgs
                };
                setDrawings(prev => [...prev, newDrawing]);
            }
        }

        // Reset the drawing state
        setIsDrawing(false);
        setStartPoint(null);
    };
    const handleDoubleClick = () => {
        if (mode !== Mode.drawPolyline) {
            return;
        }
        if (wipPolylinePoints.length < 3) {
            setWipPolylinePoints([]);
            return;
        }
        const newDrawingArgs: PolylineShapeArgs = {
            points: wipPolylinePoints,
        };
        const newDrawing: Drawing = {
            mode: mode,
            args: newDrawingArgs,
        };
        setDrawings(prev => [...prev, newDrawing]);
        setWipPolylinePoints([]);
    };
    const handleWheelBlock: React.WheelEventHandler<HTMLCanvasElement> = (e) => {
        if (!panZoomEnabled) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <InnerCanvasContainer className={'inner-canvas-container'} $xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                              ref={parentContainerRef}>
            <ChartingContainer className={'charting-container'}>
                <StyledCanvasNonResponsive
                    className={'chart-data-canvas'}
                    ref={mainCanvasRef}
                    $zIndex={1}
                    $heightPrecent={100}
                />

                {chartOptions.base.showHistogram && (
                    <StyledCanvasNonResponsive
                        className={'histogram-canvas'}
                        ref={histCanvasRef}
                        $heightPrecent={Math.round(Math.max(0.1, Math.min(0.6, chartOptions.base.style.histogram.heightRatio)) * 100)}
                        $zIndex={2}
                        style={{
                            opacity: chartOptions.base.style.histogram.opacity,
                            bottom: 0,
                        }}
                    />
                )}

                {/* Persistent drawings canvas: above data/histogram, below preview/interaction */}
                <StyledCanvasNonResponsive
                    className={'drawings-canvas'}
                    ref={drawingsCanvasRef}
                    $heightPrecent={100}
                    $zIndex={3}
                    style={{pointerEvents: 'none'}}
                />

                <StyledCanvasResponsive
                    className={'drawing-interaction-canvas'}
                    ref={hoverCanvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheelBlock}
                    onDoubleClick={handleDoubleClick}
                    $heightPrecent={100}
                    $zIndex={4}
                    style={{
                        cursor: panZoomEnabled ? (isPanning ? 'grabbing' : 'grab') : 'crosshair'
                    }}
                />
            </ChartingContainer>
            {hoveredCandle && !isPanning && !isDrawing && !isWheeling && (
                <HoverTooltip className={'intervals-data-tooltip'} $isPositive={hoveredCandle.c > hoveredCandle.o}>
                    Time: {new Date(hoveredCandle.t * 1000).toLocaleString()} |
                    O: {hoveredCandle.o} | H: {hoveredCandle.h} | L: {hoveredCandle.l} | C: {hoveredCandle.c}
                    {hoveredCandle.v !== undefined && ` | V: ${hoveredCandle.v}`}
                </HoverTooltip>
            )}
        </InnerCanvasContainer>
    );
};