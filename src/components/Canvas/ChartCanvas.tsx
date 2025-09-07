import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {
    ChartingContainer,
    HoverTooltip,
    InnerCanvasContainer,
    StyledCanvasNonResponsive,
    StyledCanvasResponsive
} from '../../styles/ChartCanvas.styles';
import {ChartOptions, ChartType} from "../../types/chartOptions";
import {drawAreaChart, drawBarChart, drawCandlestickChart, drawHistogramChart, drawLineChart} from "./utils/GraphDraw";
import {drawDrawings} from './utils/drawDrawings';
import {useChartData} from '../../hooks/useChartData';
import {usePanAndZoom} from '../../hooks/usePanAndZoom';
import {Interval} from "../../types/Interval";
import {CanvasPoint, DrawingPoint, DrawingStyleOptions} from "../../types/Drawings";
import {ChartDimensionsData, PriceRange, TimeRange} from "../../types/Graph";
import {CanvasSizes, DeepRequired, WindowSpreadOptions} from "../../types/types";
import {xToTime, yToPrice} from "./utils/GraphHelpers";
import {Drawing} from "../Drawing/types";
import {IDrawingShape} from "../Drawing/IDrawingShape";
import {createShape} from "../Drawing/drawHelper";

interface ChartCanvasProps {
    intervalsArray: Interval[];
    drawings: IDrawingShape[];
    setDrawings: (drawings: IDrawingShape[] | ((prev: IDrawingShape[]) => IDrawingShape[])) => void;
    selectedIndex: number | null;
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
                                                            selectedIndex,
                                                            chartType,
                                                            chartOptions,
                                                            canvasSizes,
                                                            parentContainerRef,
                                                            windowSpread,
                                                        }) => {
        const {mode, setMode} = useMode();

        const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
        const hoverCanvasRef = useRef<HTMLCanvasElement | null>(null);
        const histCanvasRef = useRef<HTMLCanvasElement | null>(null);
        const drawingsCanvasRef = useRef<HTMLCanvasElement | null>(null);

        const backBufferRef = useRef<HTMLCanvasElement | null>(null);
        const histBackBufferRef = useRef<HTMLCanvasElement | null>(null);
        const drawingsBackBufferRef = useRef<HTMLCanvasElement | null>(null);
        const requestAnimationIdRef = useRef<number | null>(null);
        const panOffsetRef = useRef(0);
        const currentPointRef = useRef<CanvasPoint | undefined>(undefined);
        const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

        const [isPanning, setIsPanning] = useState(false);
        const [isWheeling, setIsWheeling] = useState(false);
        const [hoverPoint, setHoverPoint] = useState<CanvasPoint | null>(null);
        const createdShape = useRef<IDrawingShape | null>(null);
        const [_, setChartDimensions] = React.useState<ChartDimensionsData | null>(null);
        const chartDimensionsRef = React.useRef<ChartDimensionsData | null>(null);


        useEffect(() => {
            if (mode != Mode.none && mode != Mode.select) {
                createdShape.current = createShape({
                    mode,
                    args: undefined,
                    style: chartOptions.base.style.drawings as DrawingStyleOptions,
                } as Drawing);
            } else {
                createdShape.current = null;
            }
        }, [mode]);
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
                if (event.key === 'Escape' && mode === Mode.drawPolyline) {
                    createdShape.current?.setPoints([]);
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }, []);


        const drawBackBuffer = (backBufferCtx: any, dims: any, renderContext: any) => {
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
        }

        const drawGraphImage = useCallback((dims: any, panOffset: number) => {
            const {cssWidth, cssHeight, dpr} = dims;
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

        }, [mainCanvasRef.current, backBufferRef.current]);

        const drawHistogramBuffer = (histBackBufferRef: any, dims: any, renderContext: any) => {
            const {dpr} = dims;
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
        }

        const drawHistogramImage = useCallback((dims: any, panOffset: number) => {
            const {dpr} = dims;
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

        }, [mainCanvasRef.current, backBufferRef.current]);
        const drawDrawingsToBuffer = (drawingsBackBufferRef: any, dims: any, renderContext: any) => {
            const {cssWidth, cssHeight, dpr} = dims;
            if (!renderContext) return;
            if (drawingsBackBufferRef.current) {
                const ctx = drawingsBackBufferRef.current.getContext('2d');
                if (ctx) {
                    if (drawingsBackBufferRef.current.width !== cssWidth * dpr || drawingsBackBufferRef.current.height !== cssHeight * dpr) {
                        drawingsBackBufferRef.current.width = cssWidth * dpr;
                        drawingsBackBufferRef.current.height = cssHeight * dpr;
                    }
                    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                    ctx.clearRect(0, 0, cssWidth, cssHeight);
                    drawDrawings(ctx, drawings, selectedIndex, renderContext, visiblePriceRange);
                }
            }
        }

        const drawShapes = useCallback((dims: any, panOffset: number) => {
            const {cssWidth, cssHeight, dpr} = dims;
            if (!drawingsBackBufferRef.current) {
                drawingsBackBufferRef.current = document.createElement('canvas');
            }
            if (!drawingsCanvasRef.current || !drawingsBackBufferRef.current) return;
            const drawingsCanvas = drawingsCanvasRef.current;
            const drawingsBackBuffer = drawingsBackBufferRef.current;
            if (drawingsCanvas && drawingsBackBuffer) {
                const dctx = drawingsCanvas.getContext('2d');
                if (!dctx) return;
                dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                dctx.clearRect(0, 0, cssWidth, cssHeight);
                dctx.drawImage(drawingsBackBuffer, -panOffset, 0, cssWidth, cssHeight);
            }

        }, [drawingsCanvasRef.current, drawingsBackBufferRef.current, drawings, selectedIndex, renderContext, visiblePriceRange, chartOptions]);

        const drawCreatedShapes = useCallback((dims: any) => {
            const {cssWidth, cssHeight, dpr} = dims;
            const hoverCanvas = hoverCanvasRef.current;
            const point = currentPointRef.current;
            if (!renderContext || !hoverCanvas) {
                console.group('No renderContext or hoverCanvas or point available for drawCreatedShapes');
                console.log('renderContext:', renderContext);
                console.log('hoverCanvas:', hoverCanvas);
                console.log('point:', point);
                console.groupEnd();
                return;

            }
            const hoverCtx = hoverCanvas.getContext('2d');

            if (hoverCtx) {
                if (hoverCanvas.width !== cssWidth * dpr || hoverCanvas.height !== cssHeight * dpr) {
                    hoverCanvas.width = cssWidth * dpr;
                    hoverCanvas.height = cssHeight * dpr;
                }
                hoverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                hoverCtx.clearRect(0, 0, cssWidth, cssHeight);
                const isInteractionMode = mode === Mode.none || mode === Mode.select;
                if (isInteractionMode && point && !isPanning && !isWheeling && hoverCtx) {
                    hoverCtx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
                    hoverCtx.lineWidth = 1;
                    hoverCtx.beginPath();
                    hoverCtx.moveTo(point.x, 0);
                    hoverCtx.lineTo(point.x, cssHeight);
                    hoverCtx.moveTo(0, point.y);
                    hoverCtx.lineTo(cssWidth, point.y);
                    hoverCtx.stroke();
                } else if (renderContext) {
                    drawDrawings(hoverCtx, [createdShape.current!], selectedIndex, renderContext, visiblePriceRange);
                }
            }

        }, [hoverCanvasRef.current, currentPointRef.current, mode, isPanning, isWheeling, selectedIndex, drawDrawings, renderContext, visiblePriceRange, chartOptions]);

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

            drawBackBuffer(backBufferCtx, dims, renderContext);

            drawHistogramBuffer(histBackBufferRef, dims, renderContext);

            drawDrawingsToBuffer(drawingsBackBufferRef, dims, renderContext);

        }, [renderContext, chartType, chartOptions, drawings, selectedIndex, canvasSizes, visiblePriceRange]);

        const drawFrame = useCallback(() => {
            requestAnimationIdRef.current = null;

            const panOffset = panOffsetRef.current;
            const dims = chartDimensionsRef.current;
            if (!dims) return;

            // --------------------------------------------------
            // 1. Main Chart Canvas (Candlesticks, etc.)
            // --------------------------------------------------
            drawGraphImage(dims, panOffset);

            // --------------------------------------------------
            // 2. Histogram Canvas
            // --------------------------------------------------
            drawHistogramImage(dims, panOffset);

            // --------------------------------------------------
            // 3. Persistent Drawings Canvas
            // --------------------------------------------------
            drawShapes(dims, panOffset);
            // --------------------------------------------------
            // 4. Hover & Interaction Canvas
            // --------------------------------------------------
            drawCreatedShapes(dims);

        }, [
            isPanning, isWheeling, createdShape, mode,
            chartOptions, drawSceneToBuffer, drawGraphImage, drawHistogramImage, drawShapes, drawCreatedShapes,
            visibleRange, visiblePriceRange, canvasSizes.width, canvasSizes.height,
            renderContext
        ]);

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
        const panZoomEnabled = (mode === Mode.none || mode === Mode.select);
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


        const handleMouseLeave = () => {
            console.log('Mouse Leave - Clearing hover point and current point ref');
            currentPointRef.current = undefined;
            setHoverPoint(null);
            scheduleDraw();
        };
        const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (isInteractionMode || !renderContext) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const time = xToTime(x, renderContext!.canvasWidth, renderContext!.visibleRange);
            const price = yToPrice(y, renderContext!.canvasHeight, visiblePriceRange);
            const pt = {time, price};
            if (mode !== Mode.drawPolyline || createdShape.current?.points.length! >= 1) {
                createdShape.current?.setFirstPoint(pt);
                console.group('Add Point');
                console.log('Point added (p0):', pt);
                console.groupEnd();
            } else if (mode === Mode.drawPolyline && createdShape.current?.points.length === 1) {
                createdShape.current?.addPoint(pt);
                console.group('Add Point');
                console.log(`Point added (p${createdShape.current?.getPoints().length}):`, pt);
                console.groupEnd();
            }
        };
        const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const point = {x: e.clientX - rect.left, y: e.clientY - rect.top};
            currentPointRef.current = point;

            // If we are in a drawing mode (except polyline), update the "tail" point live
            const isDrawingMode = !(mode === Mode.none || mode === Mode.select) && mode !== Mode.drawPolyline;
            if (isDrawingMode && createdShape.current && renderContext && (createdShape.current?.points.length ?? 0) > 0) {
                const endTime = xToTime(point.x, renderContext.canvasWidth, renderContext.visibleRange);
                const endPrice = yToPrice(point.y, renderContext.canvasHeight, visiblePriceRange);
                const pt = {time: endTime, price: endPrice};
                createdShape.current?.updateLastPoint(pt);
            }

            scheduleDraw();
            if (throttleTimerRef.current) {
                clearTimeout(throttleTimerRef.current!);
            }
            throttleTimerRef.current = setTimeout(() => {
                setHoverPoint(point);
            }, 50);
        };
        const handleMouseUp = () => {
            if (!createdShape.current || !currentPointRef.current || !renderContext || mode === Mode.drawPolyline) return;
            const endTime = xToTime(currentPointRef.current!.x, renderContext.canvasWidth, renderContext.visibleRange);
            const endPrice = yToPrice(currentPointRef.current!.y, renderContext.canvasHeight, visiblePriceRange);
            const endPoint: DrawingPoint = {time: endTime, price: endPrice};
            createdShape.current?.updateLastPoint(endPoint);
            let newDraw = createdShape.current!;
            console.group('Finalize Shape');
            console.log('Shape ended with last point:', endPoint);
            console.log('Final shape points:', newDraw.points);
            setDrawings(prev => [...prev, newDraw]);
            createdShape.current = null;
            setMode(Mode.none);

        };
        const handleDoubleClick = () => {
            if (mode !== Mode.drawPolyline || !createdShape.current || !currentPointRef.current || !renderContext) {
                return;
            }
            const newDraw = createdShape.current!;
            setDrawings(prev => [...prev, newDraw]);
            createdShape.current = null;
            setMode(Mode.none);
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
                        onMouseEnter={handleMouseMove}
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
                {hoveredCandle && !isPanning && !mode && !isWheeling && (
                    <HoverTooltip className={'intervals-data-tooltip'} $isPositive={hoveredCandle.c > hoveredCandle.o}>
                        Time: {new Date(hoveredCandle.t * 1000).toLocaleString()} |
                        O: {hoveredCandle.o} | H: {hoveredCandle.h} | L: {hoveredCandle.l} | C: {hoveredCandle.c}
                        {hoveredCandle.v !== undefined && ` | V: ${hoveredCandle.v}`}
                    </HoverTooltip>
                )}
            </InnerCanvasContainer>
        );
    }
;