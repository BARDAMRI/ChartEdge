function ensureCanvasSize(canvas: HTMLCanvasElement, width: number, height: number, dpr: number) {
    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
    }
}

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {
    ChartingContainer,
    HoverTooltip,
    InnerCanvasContainer,
    StyledCanvasNonResponsive,
    StyledCanvasResponsive
} from '../../styles/ChartCanvas.styles';
import {ChartOptions, ChartType} from "../../types/chartOptions";
import {
    drawAreaChart,
    drawBarChart,
    drawCandlestickChart,
    drawGrid,
    drawHistogramChart,
    drawLineChart
} from "./utils/GraphDraw";
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
import {formatNumber, FormatNumberOptions} from './utils/formatters';
import {FormattingService} from '../../services/FormattingService';
import {getDateFnsLocale, getLocaleDefaults, translate} from '../../utils/i18n';
import {isWithinTradingSession} from '../../utils/timeUtils';

interface ChartCanvasProps {
    intervalsArray: Interval[];
    drawings: IDrawingShape[];
    setDrawings: (drawings: IDrawingShape[] | ((prev: IDrawingShape[]) => IDrawingShape[])) => void;
    selectedIndex: number | null;
    visibleRange: TimeRange;
    setVisibleRange: (range: TimeRange) => void;
    visiblePriceRange: PriceRange;
    chartOptions: DeepRequired<ChartOptions>;
    canvasSizes: CanvasSizes;
    parentContainerRef?: React.RefObject<HTMLDivElement>;
    windowSpread: WindowSpreadOptions;
}

export interface ChartCanvasHandle {
    getCanvasSize(): { width: number; height: number; dpr: number };

    clearCanvas(): void;

    redrawCanvas(): void;
}

const ChartCanvasInner: React.ForwardRefRenderFunction<ChartCanvasHandle, ChartCanvasProps> = (
    {
        intervalsArray,
        visibleRange,
        setVisibleRange,
        visiblePriceRange,
        drawings,
        setDrawings,
        selectedIndex,
        chartOptions,
        canvasSizes,
        parentContainerRef,
        windowSpread,
    },
    ref
) => {
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
    const [hoveredCandle, setHoveredCandle] = useState<Interval | null>(null);
    const createdShape = useRef<IDrawingShape | null>(null);
    const [_, setChartDimensions] = React.useState<ChartDimensionsData | null>(null);
    const chartDimensionsRef = React.useRef<ChartDimensionsData | null>(null);
    const isInteractionMode = mode === Mode.none || mode === Mode.select;
    const {renderContext, intervalSeconds} = useChartData(
        intervalsArray, visibleRange, hoverPoint, canvasSizes.width, canvasSizes.height
    );

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
        chartDimensionsRef.current = next;
        setChartDimensions(next);
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
        const {cssWidth, cssHeight, dpr, width, height} = dims;
        if (backBufferRef.current!.width !== width || backBufferRef.current!.height !== height) {
            backBufferRef.current!.width = width;
            backBufferRef.current!.height = height;
        }
        backBufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        backBufferCtx.clearRect(0, 0, cssWidth, cssHeight);

        // Draw grid behind everything else
        drawGrid(backBufferCtx, cssWidth, cssHeight, chartOptions);

        // Highlight trading sessions if provided
        const axesStyle = chartOptions.base.style.axes;
        if (axesStyle.tradingSessions && axesStyle.tradingSessions.length > 0) {
            const { start, end } = renderContext.visibleRange;
            const duration = end - start;
            if (duration > 0) {
                const tz = axesStyle.timezone;
                const sessions = axesStyle.tradingSessions;
                
                backBufferCtx.fillStyle = 'rgba(200, 200, 200, 0.15)'; // Semi-transparent grey
                
                // We'll check in 1-hour increments or based on the range
                const stepSec = Math.max(300, duration / 200); // at most 200 checks
                for (let t = start; t < end; t += stepSec) {
                    if (!isWithinTradingSession(t, sessions, tz)) {
                        const x = ((t - start) / duration) * cssWidth;
                        const nextX = ((Math.min(t + stepSec, end) - start) / duration) * cssWidth;
                        backBufferCtx.fillRect(x, 0, nextX - x, cssHeight);
                    }
                }
            }
        }

        switch (chartOptions?.base?.chartType) {
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
        const {cssWidth, cssHeight, dpr, width, height} = dims;
        const mainCanvas = mainCanvasRef.current;
        const backBuffer = backBufferRef.current;
        if (mainCanvas && backBuffer) {
            const mainCtx = mainCanvas.getContext('2d');
            if (mainCtx) {
                if (mainCanvas.width !== width || mainCanvas.height !== height) {
                    mainCanvas.width = width;
                    mainCanvas.height = height;
                }
                mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                mainCtx.clearRect(0, 0, cssWidth, cssHeight);
                mainCtx.drawImage(backBuffer, -panOffset, 0, cssWidth, cssHeight);
            }
        }
    }, []);

    /**
     * Prepares the off-screen buffer for the volume histogram and triggers the drawing sequence.
     * Calculates the proportional height for the histogram section and sets up a dedicated rendering context.
     * * @param {any} histBackBufferRef - Reference to the off-screen canvas element.
     * @param histBackBufferRef
     * @param {any} dims - Dimensions object containing cssWidth, cssHeight, and device pixel ratio (dpr).
     * @param {any} renderContext - The main rendering context containing visible intervals and drawing utilities.
     */
    const drawHistogramBuffer = (histBackBufferRef: any, dims: any, renderContext: any) => {
        const {dpr, cssWidth, cssHeight} = dims;
        const histCanvas = histCanvasRef.current;

        if (chartOptions.base.showHistogram && histCanvas) {
            const histogramHeightRatio = Math.max(0.1, Math.min(0.6, chartOptions.base.style.histogram.heightRatio));
            const cssHistHeight = cssHeight * histogramHeightRatio;
            const targetWidth = cssWidth;
            const targetHeight = cssHistHeight;

            if (!histBackBufferRef.current) histBackBufferRef.current = document.createElement('canvas');
            const histBackBufferCtx = histBackBufferRef.current!.getContext('2d');

            if (histBackBufferCtx) {
                if (histBackBufferRef.current!.width !== targetWidth * dpr || histBackBufferRef.current!.height !== targetHeight * dpr) {
                    histBackBufferRef.current!.width = targetWidth * dpr;
                    histBackBufferRef.current!.height = targetHeight * dpr;
                }

                histBackBufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
                histBackBufferCtx.clearRect(0, 0, targetWidth, targetHeight);

                const histogramRenderContext = {
                    ...renderContext,
                    canvasWidth: targetWidth,
                    canvasHeight: targetHeight,
                    isHistogram: true
                };

                drawHistogramChart(histBackBufferCtx, histogramRenderContext, chartOptions);
            }
        }
    };
    const drawHistogramImage = useCallback((dims: any, panOffset: number) => {
        const {dpr, cssWidth, cssHeight} = dims;
        const histCanvas = histCanvasRef.current;
        const histBackBuffer = histBackBufferRef.current;

        if (chartOptions?.base?.showHistogram && histCanvas && histBackBuffer) {
            const hctx = histCanvas.getContext('2d');
            if (hctx) {
                const ratio = chartOptions?.base?.style?.histogram?.heightRatio ?? 0.2;
                const histogramHeightRatio = Math.max(0.1, Math.min(0.6, ratio));
                const cssHistHeight = cssHeight * histogramHeightRatio;
                const targetWidth = cssWidth;
                const targetHeight = cssHistHeight;

                // עיגול לפיקסלים שלמים כדי למנוע לולאת איפוס של הקנבס
                const physicalWidth = Math.round(targetWidth * dpr);
                const physicalHeight = Math.round(targetHeight * dpr);

                if (histCanvas.width !== physicalWidth || histCanvas.height !== physicalHeight) {
                    histCanvas.width = physicalWidth;
                    histCanvas.height = physicalHeight;
                }

                hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                hctx.clearRect(0, 0, targetWidth, targetHeight);
                hctx.drawImage(histBackBuffer, -panOffset, 0, targetWidth, targetHeight);
            }
        }
    }, [histCanvasRef, histBackBufferRef, chartOptions?.base?.showHistogram, chartOptions?.base?.style?.histogram?.heightRatio]);

    const drawDrawingsToBuffer = (drawingsBackBufferRef: any, dims: any, renderContext: any) => {
        const {cssWidth, cssHeight, dpr} = dims;
        if (!renderContext) return;
        if (!drawingsBackBufferRef.current) drawingsBackBufferRef.current = document.createElement('canvas');
        const ctx = drawingsBackBufferRef.current!.getContext('2d');
        if (ctx) {
            const physicalWidth = Math.round(cssWidth * dpr);
            const physicalHeight = Math.round(cssHeight * dpr);

            if (drawingsBackBufferRef.current.width !== physicalWidth || drawingsBackBufferRef.current.height !== physicalHeight) {
                drawingsBackBufferRef.current.width = physicalWidth;
                drawingsBackBufferRef.current.height = physicalHeight;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, cssWidth, cssHeight);
            drawDrawings(ctx, drawings, selectedIndex, renderContext, visiblePriceRange);
        }
    }
    const drawShapes = useCallback((dims: ChartDimensionsData, panOffset: number) => {
        const {cssWidth, cssHeight, dpr, width, height} = dims; // נוסיף את width ו-height ל-destructuring
        const drawingsCanvas = drawingsCanvasRef.current;
        const drawingsBackBuffer = drawingsBackBufferRef.current;

        if (drawingsCanvas && drawingsBackBuffer) {
            const dctx = drawingsCanvas.getContext('2d');
            if (dctx) {
                ensureCanvasSize(drawingsCanvas, cssWidth, cssHeight, dpr);

                dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                dctx.clearRect(0, 0, cssWidth, cssHeight);

                dctx.drawImage(drawingsBackBuffer, -panOffset, 0, cssWidth, cssHeight);
            }
        }
    }, []);
    const drawCreatedShapes = useCallback((dims: ChartDimensionsData) => {
        const {cssWidth, cssHeight, dpr} = dims;
        const hoverCanvas = hoverCanvasRef.current;
        const point = currentPointRef.current;

        if (!renderContext || !hoverCanvas) {
            return;
        }

        const hoverCtx = hoverCanvas.getContext('2d');
        if (hoverCtx) {
            ensureCanvasSize(hoverCanvas, cssWidth, cssHeight, dpr);

            hoverCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            hoverCtx.clearRect(0, 0, cssWidth, cssHeight);

            if (isInteractionMode && point && !isPanning && !isWheeling) {
                hoverCtx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
                hoverCtx.lineWidth = 1;
                hoverCtx.beginPath();
                hoverCtx.moveTo(point.x, 0);
                hoverCtx.lineTo(point.x, cssHeight);
                hoverCtx.moveTo(0, point.y);
                hoverCtx.lineTo(cssWidth, point.y);
                hoverCtx.stroke();
            } else if (createdShape.current && renderContext) {
                drawDrawings(hoverCtx, [createdShape.current!], selectedIndex, renderContext, visiblePriceRange);
            }
        }
    }, [
        hoverCanvasRef,
        currentPointRef,
        mode,
        isPanning,
        isWheeling,
        selectedIndex,
        drawDrawings,
        renderContext,
        visiblePriceRange,
        chartOptions
    ]);
    const drawSceneToBuffer = useCallback(() => {
        if (!renderContext) return;

        const dims = chartDimensionsRef.current;
        if (!dims) {
            return;
        }

        if (!backBufferRef.current) backBufferRef.current = document.createElement('canvas');
        const backBufferCtx = backBufferRef.current!.getContext('2d');
        if (!backBufferCtx) return;

        drawBackBuffer(backBufferCtx, dims, renderContext);

        drawHistogramBuffer(histBackBufferRef, dims, renderContext);

        drawDrawingsToBuffer(drawingsBackBufferRef, dims, renderContext);
    }, [
        renderContext,
        chartOptions,
        drawings,
        selectedIndex,
        visiblePriceRange
    ]);


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
        isPanning,
        isWheeling,
        mode,
        drawGraphImage,
        drawHistogramImage,
        drawShapes,
        drawCreatedShapes,
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
            const dims = chartDimensionsRef.current; // 🔥 שימוש ב-Ref!

            if (!dims || dx === 0) {
                panOffsetRef.current = 0;
                scheduleDraw();
                return;
            }

            const widthPx = dims.cssWidth;

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

    usePanAndZoom(
        hoverCanvasRef,
        isInteractionMode,
        intervalsArray,
        visibleRange,
        setVisibleRange,
        intervalSeconds,
        panHandlers,
        () => canvasSizes.width,
    );


    const handleMouseLeave = () => {
        currentPointRef.current = undefined;
        setHoverPoint(null);
        scheduleDraw();
    };
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isInteractionMode || !renderContext) return;

        const dims = chartDimensionsRef.current;
        if (!dims) return;
        const rect = e.currentTarget.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const time = xToTime(x, renderContext!.canvasWidth, renderContext!.visibleRange);
        const price = yToPrice(y, renderContext!.canvasHeight, visiblePriceRange);
        const pt = {time, price};

        if (mode !== Mode.drawPolyline || createdShape.current?.points.length! >= 1) {
            createdShape.current?.setFirstPoint(pt);
        } else if (mode === Mode.drawPolyline && createdShape.current?.points.length === 1) {
            createdShape.current?.addPoint(pt);
        }
    };
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect(); // נשארת כדי לקבל מיקום ב-Viewport
        const point = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        currentPointRef.current = point;

        const isDrawingMode = !(mode === Mode.none || mode === Mode.select) && mode !== Mode.drawPolyline;
        if (isDrawingMode && createdShape.current && renderContext && (createdShape.current?.points.length ?? 0) > 0) {
            const endTime = xToTime(point.x, renderContext.canvasWidth, renderContext.visibleRange);
            const endPrice = yToPrice(point.y, renderContext.canvasHeight, visiblePriceRange);
            const pt = {time: endTime, price: endPrice};
            createdShape.current?.updateLastPoint(pt);
        }

        if (renderContext) {
            const mouseTime = xToTime(point.x, renderContext.canvasWidth, renderContext.visibleRange);
            const candle = intervalsArray.find(
                c => mouseTime >= c.t && mouseTime < c.t + intervalSeconds
            );
            if (candle?.t !== hoveredCandle?.t) {
                setHoveredCandle(candle || null);
            }
        }

        scheduleDraw();
    };
    const handleMouseUp = () => {
        if (!createdShape.current || !currentPointRef.current || !renderContext || mode === Mode.drawPolyline) return;
        const endTime = xToTime(currentPointRef.current!.x, renderContext.canvasWidth, renderContext.visibleRange);
        const endPrice = yToPrice(currentPointRef.current!.y, renderContext.canvasHeight, visiblePriceRange);
        const endPoint: DrawingPoint = {time: endTime, price: endPrice};
        createdShape.current?.updateLastPoint(endPoint);
        let newDraw = createdShape.current!;
        // add the original args to the shape before inserting it into the array
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
        if (!isInteractionMode) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // Expose imperative API
    useImperativeHandle(ref, () => ({
        getCanvasSize() {
            const dims = chartDimensionsRef.current;
            return {
                width: dims?.width ?? 0,
                height: dims?.height ?? 0,
                dpr: dims?.dpr ?? (window.devicePixelRatio || 1),
            };
        },
        clearCanvas() {
            // Clear all back buffers (main, hist, drawings)
            if (backBufferRef?.current) {
                const ctx = backBufferRef.current!.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, backBufferRef.current!.width, backBufferRef.current!.height);
                }
            }
            if (histBackBufferRef?.current) {
                const ctx = histBackBufferRef.current!.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, histBackBufferRef.current!.width, histBackBufferRef.current!.height);
                }
            }
            if (drawingsBackBufferRef?.current) {
                const ctx = drawingsBackBufferRef.current!.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, drawingsBackBufferRef.current!.width, drawingsBackBufferRef.current!.height);
                }
            }
        },
        redrawCanvas() {
            scheduleDraw();
        }
    }), [scheduleDraw]);

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
                        }}
                    />
                )}

                {/* Persistent drawings canvas: above data/histogram, below preview/interaction */}
                <StyledCanvasNonResponsive
                    className={'drawings-canvas'}
                    ref={drawingsCanvasRef}
                    $heightPrecent={100}
                    $zIndex={3}
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
                        cursor: isInteractionMode ? (isPanning ? 'grabbing' : 'grab') : 'crosshair',
                        backgroundColor: 'transparent',
                    }}
                />
            </ChartingContainer>

            {hoveredCandle && !isPanning && !mode && !isWheeling && (
                <HoverTooltip 
                    className={'intervals-data-tooltip'} 
                    $isPositive={hoveredCandle.c > hoveredCandle.o}
                    $isRTL={getLocaleDefaults(chartOptions.base.style.axes.locale).direction === 'rtl'}
                >
                    {(() => {
                        const axes = chartOptions.base.style.axes;
                        const lang = axes.language || 'en';
                        
                        const dateStr = FormattingService.formatDate(new Date(hoveredCandle.t * 1000), axes);
                        const change = hoveredCandle.c - hoveredCandle.o;
                        const changePercent = (change / hoveredCandle.o);
                        const isVerySmall = canvasSizes.width < 350 || canvasSizes.height < 250;

                        return (
                            <>
                                <div style={{fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: '4px', paddingBottom: '2px'}}>
                                    {dateStr}
                                </div>
                                {!isVerySmall ? (
                                    <>
                                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                                            <span>{translate('open', lang)}: {FormattingService.formatPrice(hoveredCandle.o, axes)}</span>
                                            <span>{translate('high', lang)}: {FormattingService.formatPrice(hoveredCandle.h, axes)}</span>
                                            <span>{translate('low', lang)}: {FormattingService.formatPrice(hoveredCandle.l, axes)}</span>
                                            <span>{translate('close', lang)}: {FormattingService.formatPrice(hoveredCandle.c, axes)}</span>
                                        </div>
                                        <div style={{marginTop: '4px'}}>
                                            {translate('change', lang)}: 
                                            <span style={{color: change >= 0 ? 'green' : 'red', fontWeight: 'bold', marginLeft: '4px'}}>
                                                {FormattingService.formatPrice(change, { ...axes, metricType: 'pnl', showSign: true } as any)} 
                                                ({FormattingService.formatPrice(changePercent, { ...axes, useCurrency: false, unit: '%', maximumFractionDigits: 2, showSign: true } as any)})
                                            </span>
                                        </div>
                                        {hoveredCandle.v !== undefined && (
                                            <div style={{fontSize: '11px', opacity: 0.8, marginTop: '2px'}}>
                                                {translate('volume', lang)}: {FormattingService.formatPrice(hoveredCandle.v, { ...axes, numberNotation: 'compact' } as any)}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                        <div>
                                            {translate('close', lang)}: {FormattingService.formatPrice(hoveredCandle.c, axes)}
                                        </div>
                                        <div style={{color: change >= 0 ? 'green' : 'red', fontWeight: 'bold'}}>
                                            {FormattingService.formatPrice(changePercent, { ...axes, useCurrency: false, unit: '%', maximumFractionDigits: 1, showSign: true } as any)}
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </HoverTooltip>
            )}
        </InnerCanvasContainer>
    );
};

export const ChartCanvas = forwardRef(ChartCanvasInner);