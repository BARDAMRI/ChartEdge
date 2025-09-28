// File: src/components/Canvas/Axes/XAxis.tsx
import React, {useEffect, useRef} from 'react';
import {DrawTicksOptions, TimeRange} from "../../../types/Graph";
import {TimeDetailLevel} from "../../../types/chartOptions";
import {StyledXAxisCanvas} from "../../../styles/XAxis.styles";
import {generateAndDrawTimeTicks} from '../utils/generateTicks';
import {CanvasSizes} from "../../../types/types";

interface XAxisProps {
    canvasSizes: CanvasSizes;
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    xAxisHeight: number;
    visibleRange: TimeRange;
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
}

export default function XAxis({
                                  canvasSizes,
                                  xAxisHeight,
                                  visibleRange,
                                  timeDetailLevel,
                                  timeFormat12h,
                              }: XAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dpr = window.devicePixelRatio || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        generateAndDrawTimeTicks(
            canvas,
            visibleRange,
            100,
            'dd/MM/yyyy HH:mm',
            timeFormat12h,
            xAxisHeight,
            'black',
            timeDetailLevel,
            {
                tickHeight: 8,
                labelOffset: 4,
                labelFont: '10px Arial',
                axisY: 0
            } as DrawTicksOptions
        );
    }, [xAxisHeight, visibleRange, timeDetailLevel, timeFormat12h, canvasSizes, dpr]);

    return <StyledXAxisCanvas className={'startTime-Axis-Canvas'} ref={canvasRef} $height={xAxisHeight}/>;
}

// File: src/components/Canvas/Axes/YAxis.tsx
import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {generateAndDrawYTicks} from '../utils/generateTicks';
import {StyledYAxisCanvas} from '../../../styles/YAxis.styles';
import {AxesPosition} from "../../../types/types";

interface YAxisProps {
    yAxisPosition: AxesPosition;
    xAxisHeight: number;
    minPrice: number;
    maxPrice: number;
    numberOfYTicks: number;
}

export default function YAxis({
                                  yAxisPosition,
                                  minPrice,
                                  maxPrice,
                                  numberOfYTicks,
                              }: YAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        const needResize = canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr);
        if (needResize) {
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
        }
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);

        // IMPORTANT for grid layout: Y axis container sits only in row 1, so its endPrice already excludes X-axis.
        // Therefore, pass 0 for xAxisHeight into the tick generator to avoid double-reserving space.
        generateAndDrawYTicks(
            canvas,
            minPrice,
            maxPrice,
            numberOfYTicks,
            yAxisPosition,
            'black',
            'black',
            '12px Arial',
            5,
            5
        );
    };

    useLayoutEffect(() => {
        const el = canvasRef.current;
        if (!el) return;

        const ro = new ResizeObserver(() => {
            requestAnimationFrame(draw);
        });
        ro.observe(el);
        draw();
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        draw();
    }, [minPrice, maxPrice, numberOfYTicks, yAxisPosition]);

    return (
        <StyledYAxisCanvas className={'startPrice-axis-canvas'} ref={canvasRef} $position={yAxisPosition}/>
    );
}

// File: src/components/Canvas/ChartCanvas.tsx
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
        if (!drawingsBackBufferRef.current) drawingsBackBufferRef.current = document.createElement('canvas');
        const ctx = drawingsBackBufferRef.current!.getContext('2d');
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

    const drawShapes = useCallback((dims: any, panOffset: number) => {

        const {cssWidth, cssHeight, dpr} = dims;
        const drawingsCanvas = drawingsCanvasRef.current;
        const drawingsBackBuffer = drawingsBackBufferRef.current;

        if (drawingsCanvas && drawingsBackBuffer) {
            const dctx = drawingsCanvas.getContext('2d');
            if (dctx) {
                const dRect = drawingsCanvas.getBoundingClientRect();
                if (drawingsCanvas.width !== dRect.width * dpr || drawingsCanvas.height !== dRect.height * dpr) {
                    drawingsCanvas.width = dRect.width * dpr;
                    drawingsCanvas.height = dRect.height * dpr;
                }
                dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                dctx.clearRect(0, 0, dRect.width, dRect.height);
                dctx.drawImage(drawingsBackBuffer, -panOffset, 0, dRect.width, dRect.height);
            }
        }
    }, [mode, drawingsCanvasRef.current, drawingsBackBufferRef.current, drawings, selectedIndex, renderContext, visiblePriceRange, chartOptions]);

    const drawCreatedShapes = useCallback((dims: any) => {
        const {cssWidth, cssHeight, dpr} = dims;
        const hoverCanvas = hoverCanvasRef.current;
        const point = currentPointRef.current;
        if (!renderContext || !hoverCanvas) {
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
                console.log('Drawing created shape:', createdShape.current);
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

    }, [renderContext, chartOptions?.base?.chartType, chartOptions, drawings, selectedIndex, canvasSizes, visiblePriceRange]);

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
        const rect = e.currentTarget.getBoundingClientRect();
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
                        cursor: isInteractionMode ? (isPanning ? 'grabbing' : 'grab') : 'crosshair',
                        backgroundColor: 'transparent',
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
};

export const ChartCanvas = forwardRef(ChartCanvasInner);

// File: src/components/Canvas/ChartStage.tsx
import React, {useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle} from 'react';
import {ChartCanvas, ChartCanvasHandle} from './ChartCanvas';
import XAxis from "./Axes/XAxis";
import YAxis from "./Axes/YAxis";
import {
    CanvasAxisContainer,
    CanvasContainer,
    ChartStageContainer, ChartView, LeftBar,
    LeftYAxisContainer,
    RightYAxisContainer, TopBar,
    XAxisContainer
} from '../../styles/ChartStage.styles';
import {PriceRange, TimeRange} from "../../types/Graph";
import {Interval} from "../../types/Interval";
import {ChartOptions, TimeDetailLevel} from "../../types/chartOptions";
import {AxesPosition, DeepRequired, windowSpread} from "../../types/types";
import {useElementSize} from '../../hooks/useElementSize';
import {findPriceRange} from "./utils/helpers";
import {IDrawingShape} from "../Drawing/IDrawingShape";
import {validateAndNormalizeShape} from "../Drawing/drawHelper";


const median = (nums: number[]): number => {
    if (nums.length === 0) return 0;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

function getIntervalSeconds(arr: Interval[], fallbackSeconds = 60): number {
    if (!arr || arr.length <= 1) return Math.max(1, fallbackSeconds);
    const deltas: number[] = [];
    for (let i = 1; i < arr.length; i++) {
        const d = Math.max(0, arr[i].t - arr[i - 1].t);
        deltas.push(d);
    }
    deltas.sort((a, b) => a - b);
    const m = median(deltas);
    return Math.max(1, Math.round(m || fallbackSeconds));
}

function findVisibleIndexRange(arr: Interval[], vrange: TimeRange, intervalSeconds: number): [number, number] {
    const n = arr?.length ?? 0;
    if (n === 0) return [0, 0];
    const half = intervalSeconds / 2;

    let lo = 0, hi = n - 1, start = n;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].t + half >= vrange.start) {
            start = mid;
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }

    lo = 0;
    hi = n - 1;
    let ub = n;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].t + half > vrange.end) {
            ub = mid;
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }

    const end = Math.max(start, ub - 1);
    const s = Math.max(0, Math.min(start, n - 1));
    const e = Math.max(s, Math.min(end, n - 1));
    return [s, e];
}

interface ChartStageProps {
    intervalsArray: Interval[];
    numberOfYTicks: number;
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
    selectedIndex: number | null;
    chartOptions: DeepRequired<ChartOptions>;
    showTopBar?: boolean;
    showLeftBar?: boolean;
}

export interface ChartStageHandle {
    addShape: (shape: IDrawingShape) => void;
    updateShape: (shapeId: string, newShape: IDrawingShape) => void;
    deleteShape: (shapeId: string) => void;
    addInterval: (interval: Interval) => void;
    updateInterval: (index: number, newInterval: Interval) => void;
    deleteInterval: (index: number) => void;
    getViewInfo: () => {
        intervals: Interval[];
        drawings: IDrawingShape[];
        visibleRange: TimeRange & { startIndex: number; endIndex: number };
        visiblePriceRange: PriceRange;
        canvasSize: { width: number; height: number; dpr: number };
    };
    getCanvasSize: () => { width: number; height: number; dpr: number };
    clearCanvas: () => void;
    redrawCanvas: () => void;
    reloadCanvas: () => void;
}

export const ChartStage = forwardRef<ChartStageHandle, ChartStageProps>(({
                                                                             intervalsArray,
                                                                             numberOfYTicks,
                                                                             timeDetailLevel,
                                                                             timeFormat12h, selectedIndex,
                                                                             chartOptions
                                                                             , showTopBar = true
                                                                             , showLeftBar = true
                                                                         }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const {ref: canvasAreaRef, size: canvasSizes} = useElementSize<HTMLDivElement>();
    const [intervals, setIntervals] = useState<Interval[]>(intervalsArray);
    const [visibleRange, setVisibleRange] = React.useState<TimeRange & {
        startIndex: number,
        endIndex: number
    }>({start: 0, end: 0, startIndex: 0, endIndex: 0});
    const [visiblePriceRange, setVisiblePriceRange] = React.useState<PriceRange>({
        min: Math.min(...intervalsArray.map(inter => inter?.l || 0)),
        max: Math.max(...intervalsArray.map(inter => inter?.h || 0)),
        range: Math.max(...intervalsArray.map(inter => inter?.h || 0)) - Math.min(...intervalsArray.map(inter => inter?.l || 0))
    });
    const [drawings, setDrawings] = useState<IDrawingShape[]>([]);
    const canvasRef = useRef<ChartCanvasHandle | null>(null);

    useEffect(() => {
        setIntervals(intervalsArray);
    }, [intervalsArray]);

    function updateVisibleRange(newRangeTime: TimeRange) {
        if (!intervals || intervals.length === 0) return;
        const intervalSeconds = getIntervalSeconds(intervals, 60);
        const [startIndex, endIndex] = findVisibleIndexRange(intervals, newRangeTime, intervalSeconds);
        setVisibleRange({...newRangeTime, startIndex, endIndex});
    }

    useEffect(() => {
        setVisibleRange(prev => {
            if (prev.start === 0 && prev.end === 0 && intervals.length > 0) {
                return {
                    start: intervals[0].t - 60,
                    end: intervals[intervals.length - 1].t + 60,
                    startIndex: 0,
                    endIndex: intervals.length - 1
                };
            } else if (intervals.length === 0) {
                const d_now = Date.now();
                return {
                    start: Math.floor((d_now - 7 * 24 * 60 * 60 * 1000) / 1000),
                    end: Math.floor(d_now / 1000),
                    startIndex: 0,
                    endIndex: 0
                };
            }
            return prev;
        });
    }, [intervals]);


    useEffect(() => {
        const vr = visibleRange;
        const n = intervals?.length ?? 0;
        if (n === 0) return;
        if (!(vr.end > vr.start)) return;
        if (vr.startIndex > vr.endIndex) return;

        const s = Math.max(0, Math.min(vr.startIndex, n - 1));
        const e = Math.max(s, Math.min(vr.endIndex, n - 1));

        const paddedStart = Math.max(0, s - 1);
        const paddedEnd = Math.min(n - 1, e + 1);
        const newPr = findPriceRange(intervals, paddedStart, paddedEnd);

        if (
            newPr.min !== visiblePriceRange.min ||
            newPr.max !== visiblePriceRange.max ||
            newPr.range !== visiblePriceRange.range
        ) {
            setVisiblePriceRange(newPr);
        }
    }, [visibleRange, intervals]);

    useImperativeHandle(ref, () => ({
        addShape(shape: IDrawingShape) {
            const normalized = validateAndNormalizeShape(shape, chartOptions);
            if (!normalized) return;
            setDrawings(prev => [...prev, normalized]);
        },
        updateShape(shapeId: string, newShape: IDrawingShape) {
            const normalized = validateAndNormalizeShape(newShape, chartOptions);
            if (!normalized) return;
            setDrawings(prev => prev.map(s => s.id === shapeId ? normalized : s));
        },
        deleteShape(shapeId: string) {
            setDrawings(prev => prev.filter(s => s.id !== shapeId));
        },
        addInterval(interval: Interval) {
            setIntervals(prev => {
                const newIntervals = [...prev, interval];
                newIntervals.sort((a, b) => a.t - b.t);
                return newIntervals;
            });
        },
        updateInterval(index: number, newInterval: Interval) {
            setIntervals(prev => {
                if (index < 0 || index >= prev.length) return prev;
                const newIntervals = [...prev];
                newIntervals[index] = newInterval;
                newIntervals.sort((a, b) => a.t - b.t);
                return newIntervals;
            });
        },
        deleteInterval(index: number) {
            setIntervals(prev => {
                if (index < 0 || index >= prev.length) return prev;
                const newIntervals = [...prev];
                newIntervals.splice(index, 1);
                return newIntervals;
            });
        },
        getViewInfo() {
            return {
                intervals,
                drawings,
                visibleRange,
                visiblePriceRange,
                canvasSize: canvasRef.current?.getCanvasSize() ?? {width: 0, height: 0, dpr: 1},
            };
        },
        getCanvasSize() {
            return canvasRef.current?.getCanvasSize() ?? {width: 0, height: 0, dpr: 1};
        },
        clearCanvas() {
            canvasRef.current?.clearCanvas();
            setDrawings([]);
        },
        redrawCanvas() {
            canvasRef.current?.redrawCanvas();
        },
        reloadCanvas() {
            setVisibleRange({
                start: intervals.length > 0 ? intervals[0].t - 60 : 0,
                end: intervals.length > 0 ? intervals[intervals.length - 1].t + 60 : 0,
                startIndex: 0,
                endIndex: intervals.length > 0 ? intervals.length - 1 : 0
            });
            setDrawings([]);
        }
    }));
    
    return (
        <ChartStageContainer
            ref={containerRef}
            className={"chart-stage-container"}
            style={{
                gridTemplateRows: 1,
                gridTemplateColumns: 1,
            }}
        >

            <ChartView
                className="chart-main-cell"
                $yAxisWidth={windowSpread.INITIAL_Y_AXIS_WIDTH}
                $xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                style={{
                    gridRow: showTopBar ? 2 : 1,
                    gridColumn: showLeftBar ? 2 : 1,
                }}
            >
                {chartOptions.axes.yAxisPosition === AxesPosition.left ? (
                    <>
                        <LeftYAxisContainer
                            className="left-y-axis-container"
                            style={{width: `${windowSpread.INITIAL_Y_AXIS_WIDTH}px`}}
                        >
                            <YAxis
                                yAxisPosition={AxesPosition.left}
                                xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                                minPrice={visiblePriceRange.min}
                                maxPrice={visiblePriceRange.max}
                                numberOfYTicks={numberOfYTicks}
                            />
                        </LeftYAxisContainer>

                        <CanvasAxisContainer
                            className="canvas-axis-container"
                        >
                            <CanvasContainer ref={canvasAreaRef} className="canvas-container">
                                {canvasSizes?.width > 0 && canvasSizes?.height > 0 && (
                                    <ChartCanvas
                                        ref={canvasRef}
                                        intervalsArray={intervals}
                                        drawings={drawings}
                                        setDrawings={setDrawings}
                                        selectedIndex={selectedIndex}
                                        visibleRange={visibleRange}
                                        setVisibleRange={updateVisibleRange}
                                        visiblePriceRange={visiblePriceRange}
                                        chartOptions={chartOptions}
                                        canvasSizes={canvasSizes}
                                        windowSpread={windowSpread}
                                    />
                                )}
                            </CanvasContainer>

                            <XAxisContainer className="x-axis-container">
                                <XAxis
                                    canvasSizes={canvasSizes}
                                    parentContainerRef={containerRef}
                                    timeDetailLevel={timeDetailLevel}
                                    timeFormat12h={timeFormat12h}
                                    visibleRange={visibleRange}
                                    xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                                />
                            </XAxisContainer>
                        </CanvasAxisContainer>
                    </>
                ) : (
                    <>
                        <CanvasAxisContainer
                            className="canvas-axis-container"
                            style={{gridColumn: 1, gridRow: '1 / span 2'}}
                        >
                            <CanvasContainer ref={canvasAreaRef} className="canvas-container">
                                {canvasSizes?.width > 0 && canvasSizes?.height > 0 && (
                                    <ChartCanvas
                                        ref={canvasRef}
                                        intervalsArray={intervals}
                                        drawings={drawings}
                                        setDrawings={setDrawings}
                                        selectedIndex={selectedIndex}
                                        visibleRange={visibleRange}
                                        setVisibleRange={updateVisibleRange}
                                        visiblePriceRange={visiblePriceRange}
                                        chartOptions={chartOptions}
                                        canvasSizes={canvasSizes}
                                        windowSpread={windowSpread}
                                    />
                                )}
                            </CanvasContainer>

                            <XAxisContainer className="x-axis-container">
                                <XAxis
                                    canvasSizes={canvasSizes}
                                    parentContainerRef={containerRef}
                                    timeDetailLevel={timeDetailLevel}
                                    timeFormat12h={timeFormat12h}
                                    visibleRange={visibleRange}
                                    xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                                />
                            </XAxisContainer>
                        </CanvasAxisContainer>

                        <RightYAxisContainer
                            className="right-y-axis-container"
                            style={{width: `${windowSpread.INITIAL_Y_AXIS_WIDTH}px`}}
                        >
                            <YAxis
                                yAxisPosition={AxesPosition.right}
                                xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                                minPrice={visiblePriceRange.min}
                                maxPrice={visiblePriceRange.max}
                                numberOfYTicks={numberOfYTicks}
                            />
                        </RightYAxisContainer>
                    </>
                )}
            </ChartView>
        </ChartStageContainer>
    );
});

// File: src/components/Canvas/utils/GraphDraw.ts
import type {ChartOptions, ChartRenderContext} from "../../../types/chartOptions";
import {PriceRange} from "../../../types/Graph";
import {DeepRequired} from "../../../types/types";
import {OverlayWithCalc, OverlayKind} from "../../../types/overlay";
import {interpolatedCloseAtTime, lerp, priceToY, timeToX, xFromCenter, xFromStart} from "./GraphHelpers";
import {drawOverlay, overlay as buildOverlay} from "./drawOverlay";

// =================================================================================
// == CHART DRAWING FUNCTIONS (Corrected)
// =================================================================================

export function drawCandlestickChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: DeepRequired<ChartOptions>, visiblePriceRange: PriceRange) {

    const {
        allIntervals, visibleStartIndex, visibleEndIndex, visibleRange,
        intervalSeconds, canvasWidth, canvasHeight
    } = context;

    const loopStartIndex = Math.max(0, visibleStartIndex - 1);
    const loopEndIndex = Math.min(allIntervals.length - 1, visibleEndIndex + 1);

    if (loopEndIndex < loopStartIndex || allIntervals.length === 0) {
        return;
    }

    if (!isFinite(visiblePriceRange.min) || !isFinite(visiblePriceRange.max)) {
        console.error("[DEBUG] EXIT: Price range is not finite. Check your data for invalid values (NaN, Infinity).");
        return;
    }
    if (!isFinite(visiblePriceRange.range) || visiblePriceRange.range <= 0) {
        console.error("[DEBUG] EXIT: visiblePriceRange.range is zero or negative.");
        return;
    }

    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) {
        console.error("[DEBUG] EXIT: visibleDuration is zero or negative.");
        return;
    }

    const candleWidth = (intervalSeconds / visibleDuration) * canvasWidth;
    const gapFactor = Math.max(0, Math.min(0.4, (options?.base?.style?.candles?.spacingFactor ?? 0.2)));
    const bodyWidth = candleWidth * (1 - gapFactor);

    let candlesDrawn = 0;
    for (let i = loopStartIndex; i <= loopEndIndex; i++) {
        const candle = allIntervals[i];
        if (!candle) continue;

        const xLeft = xFromStart(candle.t, canvasWidth, visibleRange);
        const xRight = xLeft + candleWidth;

        if (xRight < 0 || xLeft > canvasWidth) {
            continue;
        }

        candlesDrawn++;

        const highY = priceToY(candle.h, canvasHeight, visiblePriceRange);
        const lowY = priceToY(candle.l, canvasHeight, visiblePriceRange);
        const openY = priceToY(candle.o, canvasHeight, visiblePriceRange);
        const closeY = priceToY(candle.c, canvasHeight, visiblePriceRange);

        const isBullish = candle.c >= candle.o;
        const color = isBullish ? (options?.base?.style?.candles?.bullColor || 'green') : (options?.base?.style?.candles?.bearColor || 'red');
        const crisp = (v: number) => Math.floor(v) + 0.5;

        const candleMidX = xLeft + candleWidth / 2;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(crisp(candleMidX), crisp(highY));
        ctx.lineTo(crisp(candleMidX), crisp(lowY));
        ctx.stroke();

        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(openY - closeY);
        ctx.fillStyle = color;
        const bodyLeft = Math.floor(xLeft + (candleWidth - bodyWidth) / 2);
        ctx.fillRect(bodyLeft, Math.floor(bodyTop), Math.ceil(bodyWidth), Math.ceil(bodyHeight) || 1);
    }

    if (options.base.showOverlayLine) {
        const overlays = options.base.overlays as OverlayWithCalc[] | undefined;
        if (overlays && overlays.length) {
            drawOverlay(ctx, context, visiblePriceRange, overlays, options.base.style.overlay);
        }
        if (Array.isArray((options.base as any).overlayKinds) && (options.base as any).overlayKinds.length) {
            const kinds = (options.base as any).overlayKinds as OverlayKind[];
            const stroke = options.base.style.overlay;
            const built = kinds.map(k => buildOverlay(k, stroke));
            drawOverlay(ctx, context, visiblePriceRange, built, stroke);
        }
    }
}

export function drawLineChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, style: DeepRequired<ChartOptions>, visiblePriceRange: PriceRange) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context;
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;
    if (!isFinite(visiblePriceRange.range) || visiblePriceRange.range <= 0) return;

    const dataStart = allIntervals[0].t;
    const dataEnd = allIntervals[allIntervals.length - 1].t + intervalSeconds;
    const clipStart = Math.max(visibleRange.start, dataStart);
    const clipEnd = Math.min(visibleRange.end, dataEnd);
    if (clipEnd <= clipStart) return;

    const localTimeToX = (t: number) => timeToX(t, canvasWidth, visibleRange);
    const localPriceToY = (p: number) => priceToY(p, canvasHeight, visiblePriceRange);

    const leftX = xFromStart(clipStart, canvasWidth, visibleRange);
    const leftY = localPriceToY(interpolatedCloseAtTime(allIntervals, intervalSeconds, clipStart));

    ctx.beginPath();
    ctx.moveTo(leftX, leftY);

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const it = allIntervals[i];
        const centerT = it.t + intervalSeconds / 2;
        if (centerT < clipStart || centerT > clipEnd) continue;
        const x = xFromCenter(it.t, intervalSeconds, canvasWidth, visibleRange);
        const y = localPriceToY(it.c);
        ctx.lineTo(x, y);
    }

    const rightX = xFromStart(clipEnd, canvasWidth, visibleRange);
    const rightY = localPriceToY(interpolatedCloseAtTime(allIntervals, intervalSeconds, clipEnd));
    ctx.lineTo(rightX, rightY);
    ctx.stroke();

    if (style.base.showOverlayLine) {
        const overlays = style.base.overlays as OverlayWithCalc[] | undefined;
        if (overlays && overlays.length) {
            drawOverlay(ctx, context, visiblePriceRange, overlays, style.base.style.overlay);
        }
        if (Array.isArray((style.base as any).overlayKinds) && (style.base as any).overlayKinds.length) {
            const kinds = (style.base as any).overlayKinds as OverlayKind[];
            const stroke = style.base.style.overlay;
            const built = kinds.map(k => buildOverlay(k, stroke));
            drawOverlay(ctx, context, visiblePriceRange, built, stroke);
        }
    }
}

export function drawAreaChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: DeepRequired<ChartOptions>, visiblePriceRange: PriceRange) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context;
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;
    if (!isFinite(visiblePriceRange.range) || visiblePriceRange.range <= 0) return;

    const xOf = (t: number) => xFromStart(t, canvasWidth, visibleRange);
    const xCenterOf = (tStart: number) => xFromCenter(tStart, intervalSeconds, canvasWidth, visibleRange);
    const yOf = (p: number) => canvasHeight * (1 - (p - visiblePriceRange.min) / visiblePriceRange.range);

    const dataStart = allIntervals[0].t;
    const dataEnd = allIntervals[allIntervals.length - 1].t + intervalSeconds;
    const clipStartTime = Math.max(visibleRange.start, dataStart);
    const clipEndTime = Math.min(visibleRange.end, dataEnd);
    if (clipEndTime <= clipStartTime) return;

    const centerOf = (i: number) => allIntervals[i].t + intervalSeconds / 2;
    const first = allIntervals[0];
    const lastIdx = allIntervals.length - 1;
    const lastCtr = centerOf(lastIdx);
    const pts: Array<{ x: number; y: number }> = [];

    if (clipStartTime >= first.t && clipStartTime < centerOf(0)) {
        const t0 = first.t, c0 = centerOf(0);
        const ratio = (clipStartTime - t0) / (c0 - t0);
        const val = lerp(first.o, first.c, Math.min(Math.max(ratio, 0), 1));
        pts.push({x: xOf(clipStartTime), y: yOf(val)});
    } else {
        const val = interpolatedCloseAtTime(allIntervals, intervalSeconds, clipStartTime);
        pts.push({x: xOf(clipStartTime), y: yOf(val)});
    }

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const cT = centerOf(i);
        if (cT >= clipStartTime && cT <= clipEndTime) {
            pts.push({x: xCenterOf(allIntervals[i].t), y: yOf(allIntervals[i].c)});
        }
    }

    if (clipEndTime < lastCtr) {
        const val = interpolatedCloseAtTime(allIntervals, intervalSeconds, clipEndTime);
        pts.push({x: xOf(clipEndTime), y: yOf(val)});
    } else {
        pts.push({x: xCenterOf(allIntervals[lastIdx].t), y: yOf(allIntervals[lastIdx].c)});
    }

    if (pts.length < 2) return;

    const startX = pts[0].x;
    const endX = pts[pts.length - 1].x;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
    ctx.lineTo(endX, canvasHeight);
    ctx.lineTo(startX, canvasHeight);
    ctx.closePath();
    ctx.fillStyle = options?.base?.style?.area!.fillColor;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
    ctx.strokeStyle = options?.base?.style?.area?.strokeColor || 'blue';
    ctx.lineWidth = options?.base?.style?.area?.lineWidth || 2;
    ctx.stroke();
    ctx.restore();

    if (options.base.showOverlayLine) {
        const overlays = options.base.overlays as OverlayWithCalc[] | undefined;
        if (overlays && overlays.length) {
            drawOverlay(ctx, context, visiblePriceRange, overlays, options.base.style.overlay);
        }
        if (Array.isArray((options.base as any).overlayKinds) && (options.base as any).overlayKinds.length) {
            const kinds = (options.base as any).overlayKinds as OverlayKind[];
            const stroke = options.base.style.overlay;
            const built = kinds.map(k => buildOverlay(k, stroke));
            drawOverlay(ctx, context, visiblePriceRange, built, stroke);
        }
    }
}

export function drawBarChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: DeepRequired<ChartOptions>, visiblePriceRange: PriceRange) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context;
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;
    if (!isFinite(visiblePriceRange.range) || visiblePriceRange.range <= 0) return;

    const yOf = (p: number) => canvasHeight * (1 - (p - visiblePriceRange.min) / visiblePriceRange.range);
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;

    const candleWidth = (intervalSeconds / visibleDuration) * canvasWidth;
    if (candleWidth <= 0) return;
    const gapFactor = Math.max(0, Math.min(0.4, (options?.base?.style?.candles?.spacingFactor ?? 0.2)));
    const barWidth = candleWidth * (1 - gapFactor);
    const halfPad = (candleWidth - barWidth) / 2;
    const crisp = (x: number) => Math.round(x) + 0.5;

    ctx.save();
    ctx.lineWidth = 1;
    const baseAlpha = Math.max(0, Math.min(1, options.base.style.bar?.opacity ?? 1));

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const c = allIntervals[i];
        const xLeftFull = ((c.t - visibleRange.start) / visibleDuration) * canvasWidth;
        const xLeft = xLeftFull + halfPad;
        const xRight = xLeft + barWidth;
        if (xRight < 0 || xLeft > canvasWidth) continue;

        const xMid = xLeftFull + candleWidth / 2;
        const yHigh = yOf(c.h);
        const yLow = yOf(c.l);
        const yOpen = yOf(c.o);
        const yClose = yOf(c.c);

        const isUp = c.c >= c.o;
        ctx.strokeStyle = (isUp ? options?.base?.style?.bar.bullColor : options?.base?.style?.bar.bearColor) || 'green';
        ctx.globalAlpha = baseAlpha;
        const tickLen = Math.max(3, Math.min(candleWidth * 0.5, 16));

        ctx.beginPath();
        ctx.moveTo(crisp(xMid), crisp(yHigh));
        ctx.lineTo(crisp(xMid), crisp(yLow));
        ctx.moveTo(crisp(xMid - tickLen), crisp(yOpen));
        ctx.lineTo(crisp(xMid), crisp(yOpen));
        ctx.moveTo(crisp(xMid), crisp(yClose));
        ctx.lineTo(crisp(xMid + tickLen), crisp(yClose));
        ctx.stroke();
    }
    ctx.restore();

    if (options.base.showOverlayLine) {
        const overlays = options.base.overlays as OverlayWithCalc[] | undefined;
        if (overlays && overlays.length) {
            drawOverlay(ctx, context, visiblePriceRange, overlays, options.base.style.overlay);
        }
        if (Array.isArray((options.base as any).overlayKinds) && (options.base as any).overlayKinds.length) {
            const kinds = (options.base as any).overlayKinds as OverlayKind[];
            const stroke = options.base.style.overlay;
            const built = kinds.map(k => buildOverlay(k, stroke));
            drawOverlay(ctx, context, visiblePriceRange, built, stroke);
        }
    }
}

export function drawHistogramChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: DeepRequired<ChartOptions>) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context;
    if (!allIntervals.length || visibleEndIndex < visibleStartIndex) return;

    if (!isFinite((visibleRange as any)?.start) || !isFinite((visibleRange as any)?.end)) return;

    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;

    const candleWidth = (intervalSeconds / visibleDuration) * canvasWidth;
    const gapFactor = Math.max(0, Math.min(0.4, options?.base?.style?.candles?.spacingFactor ?? 0.2));
    const barWidth = Math.max(1, candleWidth * (1 - gapFactor));
    const halfPad = (candleWidth - barWidth) / 2;

    let maxVolume = 0;
    let hasRealVolume = false;
    const padStart = Math.max(0, visibleStartIndex - 1);
    const padEnd = Math.min(allIntervals.length - 1, visibleEndIndex + 1);

    for (let i = padStart; i <= padEnd; i++) {
        const it = allIntervals[i];
        const v = it.v ?? Math.max(0, it.h - it.l);
        if (it.v !== undefined) hasRealVolume = true;
        if (v > maxVolume) maxVolume = v;
    }
    if (maxVolume <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, options?.base?.style?.histogram?.opacity ?? 0.6));
    ctx.lineWidth = 0;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const it = allIntervals[i];
        const xFull = xFromStart(it.t, canvasWidth, visibleRange);
        const x = xFull + halfPad;
        if (x > canvasWidth || x + barWidth < 0) continue;

        const vol = hasRealVolume ? (it.v ?? 0) : Math.max(0, it.h - it.l);
        if (vol <= 0) continue;

        const h = (vol / maxVolume) * canvasHeight;
        const yTop = canvasHeight - h;

        const up = it.c >= it.o;
        ctx.fillStyle = (up ? options.base?.style?.histogram.bullColor : options.base?.style?.histogram?.bearColor) || 'green';
        ctx.fillRect(x, yTop, barWidth, h);
    }
    ctx.restore();
}


// File: src/components/Canvas/utils/GraphHelpers.ts
// =================================================================================
// == HELPER FUNCTIONS
// =================================================================================

import {PriceRange, TimeRange} from "../../../types/Graph";
import type {Interval} from "../../../types/Interval";

/**
 * Calculates the startTime coordinate of the start of a time interval.
 * @param tStart - start time of the interval (timestamp in seconds)
 * @param clientWidth - endTime of the canvas in pixels
 * @param visibleRange - currently visible time range
 */
export const xFromStart = (tStart: number, clientWidth: number, visibleRange: TimeRange) =>
    clientWidth * ((tStart - visibleRange.start) / (visibleRange.end - visibleRange.start));

/**
 * Calculates the startTime coordinate of the center of a time interval.
 * @param tStart - start time of the interval (timestamp in seconds)
 * @param intervalSeconds - duration of the interval in seconds
 * @param clientWidth - endTime of the canvas in pixels
 * @param visibleRange - currently visible time range
 */
export const xFromCenter = (tStart: number, intervalSeconds: number, clientWidth: number, visibleRange: TimeRange) =>
    clientWidth * (((tStart + intervalSeconds / 2) - visibleRange.start) / (visibleRange.end - visibleRange.start));

/**
 * Converts a price value into a vertical pixel coordinate.
 * The startPrice=0 is at the top of the canvas, so higher prices map to lower startPrice values.
 * @param p - price to convert
 * @param clientHeight - endPrice of the canvas in pixels
 * @param price - currently visible price range
 */
export const priceToY = (p: number, clientHeight: number, price: PriceRange) => {
    return clientHeight * (1 - (p - price.min) / price.range);
}

/**
 * Converts a time value (timestamp) into a horizontal pixel coordinate.
 * @param time - timestamp to convert
 * @param clientWidth - endTime of the canvas in pixels
 * @param visibleRange - currently visible time range
 */
export const timeToX = (time: number, clientWidth: number, visibleRange: TimeRange) => clientWidth * ((time - visibleRange.start) / (visibleRange.end - visibleRange.start));


/**
 * Converts a horizontal pixel coordinate (from a mouse event) into a time value (timestamp).
 * This is the inverse of timeToX.
 */
export const xToTime = (x: number, clientWidth: number, visibleRange: TimeRange): number => {
    const duration = visibleRange.end - visibleRange.start;
    const timePerPixel = duration / clientWidth;
    return visibleRange.start + (x * timePerPixel);
};

/**
 * Converts a vertical pixel coordinate (from a mouse event) into a price value.
 * This is the inverse of priceToY.
 */
export const yToPrice = (y: number, clientHeight: number, priceRange: PriceRange): number => {
    const pricePerPixel = priceRange.range / clientHeight;
    return priceRange.max - (y * pricePerPixel);
};

/**
 * Linear interpolation between startPrice and endPrice by a factor of t (0 <= t <= 1)
 * @param y1 - start value
 * @param y2 - end value
 * @param t - interpolation factor (0 = startPrice, 1 = endPrice)
 */
export function lerp(y1: number, y2: number, t: number): number {
    return y1 * (1 - t) + y2 * t;
}

/**
 * Given a sorted array of intervals, an interval duration, and a time,
 * returns the interpolated close value at that time.
 * If the time is before the first interval or after the last, returns the closest close value.
 * Uses binary search for efficiency.
 * @param all - sorted array of intervals
 * @param intervalSeconds - duration of each interval in seconds
 * @param timeSec - time to interpolate at (timestamp in seconds)
 * @returns interpolated close value
 */
export const interpolatedCloseAtTime = (all: Interval[], intervalSeconds: number, timeSec: number): number => {
    if (all.length === 0) return 0;
    const center = (i: number) => all[i].t + intervalSeconds / 2;
    if (timeSec <= center(0)) return all[0].c;
    const last = all.length - 1;
    if (timeSec >= center(last)) return all[last].c;
    let lo = 0, hi = last - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const cMid = center(mid);
        const cNext = center(mid + 1);
        if (timeSec < cMid) {
            hi = mid - 1;
        } else if (timeSec >= cNext) {
            lo = mid + 1;
        } else {
            const t = (timeSec - cMid) / (cNext - cMid);
            return lerp(all[mid].c, all[mid + 1].c, t);
        }
    }
    return all[last].c;
}


// File: src/components/Canvas/utils/drawDrawings.ts
import {ChartRenderContext} from '../../../types/chartOptions';
import {PriceRange} from '../../../types/Graph';
import {IDrawingShape} from "../../Drawing/IDrawingShape";
import {FinalDrawingStyle} from "../../../types/Drawings";

export function drawDrawings(
    ctx: CanvasRenderingContext2D,
    drawings: IDrawingShape[],
    selectedIndex: number | null,
    renderContext: ChartRenderContext,
    visiblePriceRange: PriceRange,
): void {

    drawings.forEach((shape, index) => {

        if (shape) {
            let finalStyle: FinalDrawingStyle = {
                lineColor: shape.style.lineColor as string,
                lineWidth: shape.style.lineWidth as number,
                lineStyle: shape.style.lineStyle as FinalDrawingStyle['lineStyle'],
                fillColor: shape.style.fillColor as string
            };

            if (selectedIndex === index) {
                finalStyle.lineColor = shape.style.selected.lineColor as string;
                finalStyle.lineWidth = (finalStyle.lineWidth || 1) + (shape.style.selected.lineWidthAdd || 1) as number;
                finalStyle.lineStyle = (shape.style.selected.lineStyle || finalStyle.lineStyle) as FinalDrawingStyle['lineStyle'];
                if (shape.style.selected.fillColor) finalStyle.fillColor = shape.style.selected.fillColor as string;
            }

            shape?.draw(ctx, renderContext, visiblePriceRange, finalStyle);
        }
    });
}


// File: src/components/Canvas/utils/drawOverlay.ts
// -----------------------------------------------------------------------------
// Overlay builder helpers
// -----------------------------------------------------------------------------

import {
    OverlayCalcSpec,
    OverlayKind,
    OverlayOptions,
    OverlayPriceKey,
    OverlaySeries,
    OverlayWithCalc
} from "../../../types/overlay";
import type {Interval} from "../../../types/Interval";
import type {ChartRenderContext} from "../../../types/chartOptions";
import type {PriceRange} from "../../../types/Graph";
import {DeepPartial, DeepRequired} from "../../../types/types";

/** Factory helpers for calculation specs */
export const OverlaySpecs = {
    close: (): OverlayCalcSpec => ({kind: OverlayPriceKey.close}),
    open: (): OverlayCalcSpec => ({kind: OverlayPriceKey.open}),
    high: (): OverlayCalcSpec => ({kind: OverlayPriceKey.high}),
    low: (): OverlayCalcSpec => ({kind: OverlayPriceKey.low}),

    sma: (period: number, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.sma, period, price}
    ),
    ema: (period: number, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.ema, period, price}
    ),
    wma: (period: number, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.wma, period, price}
    ),

    vwap: (): OverlayCalcSpec => ({kind: OverlayKind.vwap}),

    bbandsMid: (period: number, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.bbands_mid, period, price}
    ),
    bbandsUpper: (period: number, stddev = 2, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.bbands_upper, period, stddev, price}
    ),
    bbandsLower: (period: number, stddev = 2, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.bbands_lower, period, stddev, price}
    ),
} as const;

/**
 * Build an OverlayWithCalc from style + calc, with optional flags.
 * Example:
 *   makeOverlay({ lineColor: '#f90', lineWidth: 2, lineStyle: 'solid' }, OverlaySpecs.sma(20))
 */
export function makeOverlay(
    style?: DeepRequired<OverlayOptions>,
    calc: OverlayCalcSpec = OverlaySpecs.close(),
    extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>
): OverlayWithCalc {

    return {
        ...style,
        calc,
        connectNulls: extras?.connectNulls ?? true,
        useCenterX: extras?.useCenterX ?? true,
    } as OverlayWithCalc;
}

/**
 * Currying helper: create a family of overlays sharing the same style.
 * Example:
 *   const withOrange = withOverlayStyle({ lineColor: '#f90', lineWidth: 2, lineStyle: 'solid' });
 *   const sma20 = withOrange(OverlaySpecs.sma(20));
 */
export function withOverlayStyle(style?: DeepPartial<OverlayOptions>) {
    let defaultStyle: DeepRequired<OverlayOptions> = {
        lineColor: '#2962ff',
        lineWidth: 2,
        lineStyle: 'solid',
    }
    defaultStyle = {...defaultStyle, ...style};
    return (calc: OverlayCalcSpec = OverlaySpecs.close(), extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>): OverlayWithCalc =>
        makeOverlay(defaultStyle, calc, extras);
}

// -----------------------------------------------------------------------------
// Computation + Rendering for Overlays
// -----------------------------------------------------------------------------


type PriceAccessor = (it: Interval) => number;

function priceAccessor(key?: OverlayPriceKey): PriceAccessor {
    const k = key ?? OverlayPriceKey.close;
    switch (k) {
        case OverlayPriceKey.open:
            return (it) => it.o;
        case OverlayPriceKey.high:
            return (it) => it.h;
        case OverlayPriceKey.low:
            return (it) => it.l;
        default:
            return (it) => it.c;
    }
}

function computeSMA(values: (number | null | undefined)[], period: number): (number | null)[] {
    const out: (number | null)[] = Array(values.length).fill(null);
    if (period <= 1) {
        for (let i = 0; i < values.length; i++) out[i] = values[i] ?? null;
        return out;
    }
    let sum = 0;
    const q: number[] = [];
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v == null || !Number.isFinite(Number(v))) {
            sum = 0;
            q.length = 0;
            out[i] = null;
            continue;
        }
        const nv = Number(v);
        q.push(nv);
        sum += nv;
        if (q.length > period) sum -= q.shift()!;
        out[i] = q.length === period ? (sum / period) : null;
    }
    return out;
}

function computeEMA(values: (number | null | undefined)[], period: number): (number | null)[] {
    const out: (number | null)[] = Array(values.length).fill(null);
    if (period <= 1) {
        for (let i = 0; i < values.length; i++) out[i] = values[i] ?? null;
        return out;
    }
    const k = 2 / (period + 1);
    let ema: number | null = null;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v == null || !Number.isFinite(Number(v))) {
            ema = null;
            out[i] = null;
            continue;
        }
        const nv = Number(v);
        if (ema == null) {
            ema = nv;
            out[i] = null;
        } else {
            ema = nv * k + ema * (1 - k);
            out[i] = ema;
        }
    }
    return out;
}

function computeWMA(values: (number | null | undefined)[], period: number): (number | null)[] {
    const out: (number | null)[] = Array(values.length).fill(null);
    if (period <= 1) {
        for (let i = 0; i < values.length; i++) out[i] = values[i] ?? null;
        return out;
    }
    const wsum = period * (period + 1) / 2;
    const win: (number | null)[] = Array(period).fill(null);
    for (let i = 0; i < values.length; i++) {
        win.shift();
        const v = values[i];
        win.push(v == null ? null : Number(v));
        if (win.some(x => x == null)) {
            out[i] = null;
            continue;
        }
        let num = 0;
        for (let j = 0; j < period; j++) num += (j + 1) * (win[j] as number);
        out[i] = num / wsum;
    }
    return out;
}

function rollingStd(values: (number | null)[], period: number): (number | null)[] {
    const out: (number | null)[] = Array(values.length).fill(null);
    const win: number[] = [];
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v == null) {
            win.length = 0;
            out[i] = null;
            continue;
        }
        win.push(v);
        if (win.length > period) win.shift();
        if (win.length < period) {
            out[i] = null;
            continue;
        }
        const mean = win.reduce((a, b) => a + b, 0) / period;
        const variance = win.reduce((a, b) => a + (b - mean) * (b - mean), 0) / period;
        out[i] = Math.sqrt(variance);
    }
    return out;
}

function computeVWAP(intervals: Interval[]): (number | null)[] {
    const out: (number | null)[] = Array(intervals.length).fill(null);
    let cumPV = 0, cumV = 0;
    for (let i = 0; i < intervals.length; i++) {
        const it: any = intervals[i];
        const v = it?.v;
        if (v == null || !Number.isFinite(Number(v))) {
            out[i] = null;
            continue;
        }
        const typical = (it.h + it.l + it.c) / 3;
        cumPV += typical * v;
        cumV += v;
        out[i] = cumV === 0 ? null : (cumPV / cumV);
    }
    return out;
}

export function computeSeriesBySpec(intervals: Interval[], spec: OverlayCalcSpec): (number | null)[] {
    const acc = priceAccessor((spec as any).price);
    switch (spec.kind) {
        case  OverlayPriceKey.close:
            return intervals.map(acc);
        case OverlayPriceKey.open:
            return intervals.map(acc);
        case OverlayPriceKey.high:
            return intervals.map(acc);
        case OverlayPriceKey.low:
            return intervals.map(acc);
        case OverlayKind.sma:
            return computeSMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case OverlayKind.ema:
            return computeEMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case OverlayKind.wma:
            return computeWMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case OverlayKind.vwap:
            return computeVWAP(intervals);
        case OverlayKind.bbands_mid: {
            const period = Math.max(1, (spec as any).period ?? 20);
            return computeSMA(intervals.map(acc), period);
        }
        case OverlayKind.bbands_upper: {
            const period = Math.max(1, (spec as any).period ?? 20);
            const base = intervals.map(acc);
            const sma = computeSMA(base, period);
            const std = rollingStd(sma, period);
            const k = (spec as any).stddev ?? 2;
            return sma.map((m, i) => (m == null || std[i] == null) ? null : (m + k * (std[i] as number)));
        }
        case OverlayKind.bbands_lower: {
            const period = Math.max(1, (spec as any).period ?? 20);
            const base = intervals.map(acc);
            const sma = computeSMA(base, period);
            const std = rollingStd(sma, period);
            const k = (spec as any).stddev ?? 2;
            return sma.map((m, i) => (m == null || std[i] == null) ? null : (m - k * (std[i] as number)));
        }
        default:
            return intervals.map(() => null);
    }
}

// --- drawing -------------------------------------------------------------------------

function applyStrokeStyle(ctx: CanvasRenderingContext2D, opt: OverlayOptions) {
    ctx.strokeStyle = opt?.lineColor ?? '#2a7fff';
    ctx.lineWidth = Math.max(0.5, opt?.lineWidth ?? 1.5);
    switch (opt?.lineStyle) {
        case 'dashed':
            ctx.setLineDash([6, 4]);
            ctx.lineCap = 'butt';
            break;
        case 'dotted':
            ctx.setLineDash([2, 3]);
            ctx.lineCap = 'round';
            break;
        default:
            ctx.setLineDash([]);
            ctx.lineCap = 'butt';
            break;
    }
}

function xFromStart(tStart: number, canvasWidth: number, visibleRange: { start: number; end: number }) {
    const span = Math.max(1, visibleRange.end - visibleRange.start);
    return ((tStart - visibleRange.start) / span) * canvasWidth;
}

function xFromCenter(tStart: number, intervalSeconds: number, canvasWidth: number, visibleRange: {
    start: number;
    end: number
}) {
    const half = (intervalSeconds || 0) / 2;
    return xFromStart(tStart + half, canvasWidth, visibleRange);
}

export function drawOverlays(
    ctx: CanvasRenderingContext2D,
    context: ChartRenderContext,
    visiblePriceRange: PriceRange,
    seriesList: OverlaySeries[],
) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context;
    if (!seriesList?.length) return;
    if (!allIntervals?.length) return;
    if (visibleEndIndex < visibleStartIndex) return;
    if (!Number.isFinite(visiblePriceRange.range) || visiblePriceRange.range <= 0) return;

    const yOf = (p: number) => canvasHeight * (1 - (p - visiblePriceRange.min) / visiblePriceRange.range);
    const xStartOf = (tStart: number) => xFromStart(tStart, canvasWidth, visibleRange);
    const xCenterOf = (tStart: number) => xFromCenter(tStart, intervalSeconds, canvasWidth, visibleRange);

    for (const series of seriesList) {
        if (!series) continue;

        ctx.save();
        applyStrokeStyle(ctx, series.options);

        const useCenter = series.useCenterX;
        const getX = useCenter ? xCenterOf : xStartOf;

        let started = false;
        let prevValid = false;
        ctx.beginPath();

        for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
            const it = allIntervals[i];
            if (!it) {
                prevValid = false;
                continue;
            }

            const v = series.source[i];

            const isNullish = (v == null) || !Number.isFinite(Number(v));
            const x = getX(it.t);
            if (x < -8 || x > canvasWidth + 8) {
                prevValid = prevValid && !isNullish;
                continue;
            }

            if (isNullish) {
                if (!series.connectNulls) {
                    started = false;
                    prevValid = false;
                }
                continue;
            }

            const y = yOf(Number(v));
            if (!Number.isFinite(y)) {
                prevValid = false;
                continue;
            }

            if (!started) {
                ctx.moveTo(x, y);
                started = true;
                prevValid = true;
            } else {
                if (!series.connectNulls && !prevValid) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                prevValid = true;
            }
        }

        if (started) ctx.stroke();
        ctx.restore();
    }
}

// --- mapping from user options to series --------------------------------------------

function toSeriesFromUserOverlays(intervals: Interval[], overlays: OverlayWithCalc[]): OverlaySeries[] {
    return overlays.map((overlay) => {
        const values = computeSeriesBySpec(intervals, overlay.calc);
        const series: OverlaySeries = {
            source: values as number[],
            options: {
                lineColor: overlay.lineColor,
                lineWidth: overlay.lineWidth,
                lineStyle: overlay.lineStyle,
            },
            connectNulls: overlay.connectNulls ?? true,
            useCenterX: overlay.useCenterX ?? true,
        };
        const maybeId: unknown = (overlay as any).id;
        if (typeof maybeId === 'string') series.id = maybeId;
        return series;
    });
}

/**
 * Draw overlays directly from user options (OverlayWithCalc[]).
 * Computes series values internally from intervals and forwards them to drawOverlays.
 */
export function drawOverlaysFromOptions(
    ctx: CanvasRenderingContext2D,
    context: ChartRenderContext,
    visiblePriceRange: PriceRange,
    overlays: OverlayWithCalc[] | undefined,
) {
    if (!overlays || overlays.length === 0) return;
    if (!context?.allIntervals?.length) return;

    const series = toSeriesFromUserOverlays(context.allIntervals, overlays);
    return drawOverlays(ctx, context, visiblePriceRange, series);
}

/** Convenience: quick overlay creator with defaults.
 *  Example: overlay('sma', { lineColor: '#f90' }, { connectNulls: false })
 */
export function overlay(
    kindOrSpec?: OverlayCalcSpec | OverlayKind | OverlayPriceKey,
    style?: DeepPartial<OverlayOptions>,
    extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>
): OverlayWithCalc {
    let calc: OverlayCalcSpec;
    if (!kindOrSpec) {
        calc = {kind: OverlayPriceKey.close};
    } else if (typeof kindOrSpec === 'string') {
        switch (kindOrSpec) {
            case OverlayKind.sma:
                calc = {kind: OverlayKind.sma, period: 20, price: OverlayPriceKey.close};
                break;
            case OverlayKind.ema:
                calc = {kind: OverlayKind.ema, period: 20, price: OverlayPriceKey.close};
                break;
            case OverlayKind.wma:
                calc = {kind: OverlayKind.wma, period: 20, price: OverlayPriceKey.close};
                break;
            case OverlayKind.vwap:
                calc = {kind: OverlayKind.vwap};
                break;
            case OverlayKind.bbands_mid:
                calc = {kind: OverlayKind.bbands_mid, period: 20, price: OverlayPriceKey.close};
                break;
            case OverlayKind.bbands_upper:
                calc = {kind: OverlayKind.bbands_upper, period: 20, stddev: 2, price: OverlayPriceKey.close};
                break;
            case OverlayKind.bbands_lower:
                calc = {kind: OverlayKind.bbands_lower, period: 20, stddev: 2, price: OverlayPriceKey.close};
                break;
            case OverlayPriceKey.close:
            case OverlayPriceKey.open:
            case OverlayPriceKey.high:
            case OverlayPriceKey.low:
                calc = {kind: kindOrSpec as OverlayPriceKey};
                break;
            default:
                calc = {kind: OverlayPriceKey.close};
        }
    } else {
        calc = kindOrSpec as OverlayCalcSpec;
    }
    let defaultStyle: DeepRequired<OverlayOptions> = {
        lineColor: '#2962ff',
        lineWidth: 2,
        lineStyle: 'solid',
    };
    defaultStyle = {...defaultStyle, ...style};
    return makeOverlay(defaultStyle, calc, extras);
}

export function drawOverlay(
    ctx: CanvasRenderingContext2D,
    context: ChartRenderContext,
    visiblePriceRange: PriceRange,
    overlaysOrKind?: OverlayWithCalc[] | OverlayCalcSpec | OverlayKind,
    style?: DeepRequired<OverlayOptions>,
    extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>
) {
    let overlays: OverlayWithCalc[] | undefined;

    if (Array.isArray(overlaysOrKind)) {
        // Case 1: user supplied overlays[] directly
        overlays = overlaysOrKind;
    } else if (overlaysOrKind) {
        // Case 2: user supplied a kind string or a full calc spec; build single overlay
        const single = overlay(overlaysOrKind as any, style, extras);
        overlays = [single];
    } else {
        // No input → nothing to draw
        return;
    }

    return drawOverlaysFromOptions(ctx, context, visiblePriceRange, overlays);
}


// File: src/components/Canvas/utils/generateTicks.ts
import {
    addDays,
    addHours,
    addMonths,
    addYears,
    differenceInDays,
    differenceInHours,
    differenceInMonths,
    differenceInYears,
    format,
    startOfDay,
    startOfHour,
    startOfMonth,
    startOfYear,
} from 'date-fns';
import {DrawTicksOptions, Tick, TimeRange} from "../../../types/Graph";
import {TimeDetailLevel} from "../../../types/chartOptions";
import {AlignOptions, AxesPosition} from "../../../types/types";

const TICK_FONT_SIZE_PX = 12;


function selectTimeDetailLevel(
    startDate: Date,
    endDate: Date,
    canvasWidth: number,
    maxTicks: number,
    timeFormat: string,
    timeFormat12h: boolean,
    timeDetailLevel: TimeDetailLevel,
    ctx: CanvasRenderingContext2D
): {
    intervalFn: (date: Date, amount: number) => Date;
    startOfFn: (date: Date) => Date;
    formatStr: string;
    step: number
} | null {
    const durationHours = differenceInHours(endDate, startDate);

    const levels = [
        {
            condition: timeDetailLevel === TimeDetailLevel.High || (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 48),
            intervalFn: addHours,
            startOfFn: startOfHour,
            diffFn: differenceInHours,
            formatStr: timeFormat12h ? 'h:mm a' : 'HH:mm',
            stepFactor: 4
        },
        {
            condition: timeDetailLevel === TimeDetailLevel.Medium || (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 24 * 7),
            intervalFn: addDays,
            startOfFn: startOfDay,
            diffFn: differenceInDays,
            formatStr: timeFormat.includes('DD') ? 'MMM DD' : 'MMM d',
            stepFactor: 1
        },
        {
            condition: timeDetailLevel === TimeDetailLevel.Low || (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 24 * 365),
            intervalFn: addMonths,
            startOfFn: startOfMonth,
            diffFn: differenceInMonths,
            formatStr: timeFormat.includes('YYYY') ? 'MMM YYYY' : 'MMM yyyy',
            stepFactor: 1
        },
        {
            condition: true,
            intervalFn: addYears,
            startOfFn: startOfYear,
            diffFn: differenceInYears,
            formatStr: timeFormat.includes('YYYY') ? 'YYYY' : 'yyyy',
            stepFactor: 1
        }
    ];

    for (const level of levels) {
        if (level.condition) {
            const totalUnits = Math.max(1, Math.floor(level.diffFn(endDate, startDate) / level.stepFactor));
            const sampleLabel = format(new Date(), level.formatStr);
            const labelWidth = ctx.measureText(sampleLabel).width;

            if (totalUnits <= maxTicks && labelWidth * totalUnits <= canvasWidth) {
                const step = Math.max(1, Math.floor(totalUnits / maxTicks));
                return {intervalFn: level.intervalFn, startOfFn: level.startOfFn, formatStr: level.formatStr, step};
            }
        }
    }

    return null;
}

function generateAndDrawTicksForLevel(
    canvas: HTMLCanvasElement,
    startDate: Date,
    endDate: Date,
    durationSec: number,
    canvasWidth: number,
    level: {
        intervalFn: (date: Date, amount: number) => Date;
        startOfFn: (date: Date) => Date;
        formatStr: string;
        step: number
    },
    options: DrawTicksOptions,
    strokeStyle: string,
    xAxisHeight: number
): Tick[] {
    const {intervalFn, startOfFn, formatStr, step} = level;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    const {
        tickHeight = 10,
        tickColor = strokeStyle,
        labelColor = strokeStyle,
        labelFont = `${TICK_FONT_SIZE_PX}px Arial`,
        labelOffset = 15,
        axisY = canvas.clientHeight - xAxisHeight
    } = options;

    const ticks: Tick[] = [];
    let currentTickDate = startOfFn(startDate);

    if (currentTickDate.getTime() < startDate.getTime()) {
        currentTickDate = intervalFn(currentTickDate, step);
    }

    while (currentTickDate.getTime() / 1000 <= endDate.getTime() / 1000) {
        const tickTime = currentTickDate.getTime();
        const tickTimeSec = tickTime / 1000;
        const startTimeSec = startDate.getTime() / 1000;
        const pos = ((tickTimeSec - startTimeSec) / durationSec) * canvasWidth;

        if (pos >= 0 && pos <= canvasWidth) {
            const label = format(currentTickDate, formatStr);
            ticks.push({position: pos, label});
        }

        currentTickDate = intervalFn(currentTickDate, step);
    }

    if (ticks.length === 0) {
        ticks.push(
            {position: 0, label: format(startDate, formatStr)},
            {position: canvasWidth, label: format(endDate, formatStr)}
        );
    }

    drawXTicks(ctx, canvasWidth, ticks, tickHeight, tickColor, labelColor, labelFont, labelOffset, axisY);

    return ticks;
}

export function generateAndDrawTimeTicks(
    canvas: HTMLCanvasElement,
    timeRange: TimeRange,
    numberOfXTicks: number,
    timeFormat: string,
    timeFormat12h: boolean,
    xAxisHeight: number,
    strokeStyle: string,
    timeDetailLevel: TimeDetailLevel,
    options: DrawTicksOptions
): Tick[] {
    const {start, end} = timeRange;
    const canvasWidth = canvas.clientWidth;

    if (start >= end || canvasWidth <= 0 || numberOfXTicks <= 0) {
        return [];
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    const durationSec = end - start;
    const startDate = new Date(start * 1000);
    const endDate = new Date(end * 1000);

    const pixelsPerTick = 150;
    const estimatedTicks = Math.floor(canvasWidth / pixelsPerTick);
    const maxTicks = Math.min(estimatedTicks, numberOfXTicks);

    const selectedLevel = selectTimeDetailLevel(startDate, endDate, canvasWidth, maxTicks, timeFormat, timeFormat12h, timeDetailLevel, ctx);

    if (!selectedLevel) {
        return [];
    }

    return generateAndDrawTicksForLevel(canvas, startDate, endDate, durationSec, canvasWidth, selectedLevel, options, strokeStyle, xAxisHeight);
}


export function generateAndDrawYTicks(
    canvas: HTMLCanvasElement,
    minValue: number,
    maxValue: number,
    numberOfYTicks: number,
    yAxisPosition: AxesPosition = AxesPosition.left,
    tickColor: string = 'black',
    labelColor: string = 'black',
    labelFont: string = '12px Arial',
    tickLength: number = 5,
    labelOffset: number = 5
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Cannot get canvas context');
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const paddingTop = 10;
    const paddingBottom = 10;
    const effectiveHeight = height - paddingTop - paddingBottom;
    const range = maxValue - minValue;

    ctx.clearRect(0, 0, width, height);

    const ticks = Array.from({length: numberOfYTicks}, (_, i) => {
        const ratio = i / (numberOfYTicks - 1);
        const y = paddingTop + ratio * effectiveHeight;
        const value = maxValue - ratio * range;
        return {
            y,
            label: value.toFixed(2)
        };
    });

    drawYTicks(ctx, ticks, width, yAxisPosition, tickColor, labelColor, labelFont, tickLength, labelOffset);
}

function drawXTicks(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    ticks: Tick[],
    tickHeight: number,
    tickColor: string,
    labelColor: string,
    labelFont: string,
    labelOffset: number,
    axisY: number
): void {
    ctx.save();

    const crisp = (v: number) => Math.round(v) + 0.5;

    ctx.strokeStyle = tickColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(crisp(0), axisY);
    ctx.lineTo(crisp(canvasWidth), axisY);
    ctx.stroke();

    let lastRight = -Infinity;

    // drawing each tick and its label
    ticks.forEach(tick => {
        const x = crisp(tick.position);

        ctx.strokeStyle = tickColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, axisY);
        ctx.lineTo(x, axisY + tickHeight);
        ctx.stroke();

        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const w = ctx.measureText(tick.label).width;
        const labelLeft = tick.position - w / 2;
        const labelRight = tick.position + w / 2;

        if (labelLeft > lastRight + 4) {
            ctx.fillText(tick.label, tick.position, axisY + labelOffset + 5);
            lastRight = labelRight;
        }
    });

    ctx.restore();
}

// Draw Y-axis ticks helper
function drawYTicks(
    ctx: CanvasRenderingContext2D,
    ticks: { y: number; label: string }[],
    width: number,
    yAxisPosition: AxesPosition,
    tickColor: string,
    labelColor: string,
    labelFont: string,
    tickLength: number,
    labelOffset: number
): void {
    ctx.strokeStyle = tickColor;
    ctx.fillStyle = labelColor;
    ctx.font = labelFont;
    ctx.textAlign = yAxisPosition == AxesPosition.left ? AlignOptions.right : AlignOptions.left;
    ctx.textBaseline = 'middle';

    // draw Y-axis line
    const axisX = yAxisPosition == AxesPosition.left ? width : 0;
    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, ctx.canvas.clientHeight);
    ctx.stroke();

    for (const tick of ticks) {
        const x = yAxisPosition == AxesPosition.left ? width : 0;
        const tickEndX = yAxisPosition == AxesPosition.left ? width - tickLength : tickLength;
        const labelX = yAxisPosition == AxesPosition.left ? tickEndX - labelOffset : tickEndX + labelOffset;

        ctx.beginPath();
        ctx.moveTo(x, tick.y);
        ctx.lineTo(tickEndX, tick.y);
        ctx.stroke();

        ctx.fillText(tick.label, labelX, tick.y);
    }
}


// File: src/components/Canvas/utils/helpers.ts
import {Interval} from "../../../types/Interval";
import {PriceRange} from "../../../types/Graph";

export function findPriceRange(allCandles: Interval[], startIndex: number, endIndex: number): PriceRange {
    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = startIndex; i <= endIndex; i++) {
        const candle = allCandles[i];
        if (candle.h > maxPrice) maxPrice = candle.h;
        if (candle.l < minPrice) minPrice = candle.l;
    }
    return {min: minPrice, max: maxPrice, range: maxPrice - minPrice || 1};
}


export function isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return false;

    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const closestX = t < 0 ? x1 : t > 1 ? x2 : x1 + t * dx;
    const closestY = t < 0 ? y1 : t > 1 ? y2 : y1 + t * dy;

    const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
    return distSq <= tolerance ** 2;
}


// File: src/components/DefaultData.ts
import {AxesPosition, DeepRequired} from "../types/types";
import {
    AreaStyleOptions, AxesStyleOptions,
    BarStyleOptions,
    CandleStyleOptions, ChartOptions, ChartType, GridStyleOptions,
    HistogramStyleOptions,
    LineStyleOptions, StyleOptions
} from "../types/chartOptions";
import {OverlayOptions} from "../types/overlay";
import {DrawingStyleOptions} from "../types/Drawings";

const CANDLES_DEFAULT_STYLE: DeepRequired<CandleStyleOptions> = {
    bullColor: "#26a69a",
    bearColor: "#ef5350",
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderColor: "#333333",
    borderWidth: 1,
    bodyWidthFactor: 0.6,
    spacingFactor: 0.2,
}
const LINE_DEFAULT_STYLE: DeepRequired<LineStyleOptions> = {
    color: "#2962ff",
    lineWidth: 2,
}
const AREA_DEFAULT_STYLE: DeepRequired<AreaStyleOptions> = {
    fillColor: "rgba(41, 98, 255, 0.2)",
    strokeColor: "rgba(41, 98, 255, 1)",
    lineWidth: 2,
}
const HISTOGRAM_DEFAULT_STYLE: DeepRequired<HistogramStyleOptions> = {
    bullColor: "#26a69a",
    bearColor: "#ef5350",
    opacity: 0.5,
    heightRatio: 0.3,
}
const BAR_DEFAULT_STYLE: DeepRequired<BarStyleOptions> = {
    bullColor: "#26a69a",
    bearColor: "#ef5350",
    opacity: 0.7,
}
const GRID_DEFAULT_STYLE: DeepRequired<GridStyleOptions> = {
    color: "#e0e0e0",
    lineWidth: 1,
    gridSpacing: 50,
    lineColor: "#e0e0e0",
    lineDash: [],
}
const OVERLAY_DEFAULT_STYLE: DeepRequired<OverlayOptions> = {
    lineColor: "#ff9800", // Orange
    lineWidth: 1,
    lineStyle: "solid",
}
const AXES_DEFAULT_STYLE: DeepRequired<AxesStyleOptions> = {
    axisPosition: AxesPosition.left,
    textColor: "#424242",
    font: "12px Arial",
    lineColor: "#9e9e9e",
    lineWidth: 1,
    numberLocale: "en-US",
    dateLocale: "en-US",
    numberFractionDigits: 2,
}
const DRAWINGS_DEFAULT_STYLE: DeepRequired<DrawingStyleOptions> = {
    lineColor: "#2196f3", // A nice blue
    lineWidth: 2,
    lineStyle: "solid",
    fillColor: "rgba(33, 150, 243, 0.2)", // Semi-transparent version of the line color
    selected: {
        lineColor: "#ff9800", // Orange for highlight, consistent with overlays
        lineWidthAdd: 1, // Make the line thicker when selected
        lineStyle: "dashed", // Make the line dashed to indicate selection
        fillColor: "rgba(255, 152, 0, 0.3)", // Semi-transparent orange fill
    },
}
const DEFAULT_STYLES: DeepRequired<StyleOptions> = {
    candles: CANDLES_DEFAULT_STYLE,
    line: LINE_DEFAULT_STYLE,
    area: AREA_DEFAULT_STYLE,
    histogram: HISTOGRAM_DEFAULT_STYLE,
    bar: BAR_DEFAULT_STYLE,
    grid: GRID_DEFAULT_STYLE,
    overlay: OVERLAY_DEFAULT_STYLE,
    axes: AXES_DEFAULT_STYLE,
    drawings: DRAWINGS_DEFAULT_STYLE,
    backgroundColor: "#ffffff",
    showGrid: true,
};
export const DEFAULT_GRAPH_OPTIONS: DeepRequired<ChartOptions> = {
    base: {
        chartType: ChartType.Candlestick,
        theme: 'light',
        showOverlayLine: false,
        showHistogram: true,
        style: DEFAULT_STYLES,
        overlays: [],
        overlayKinds: [],
    },
    axes: {
        yAxisPosition: AxesPosition.left,
        currency: 'USD',
        numberOfYTicks: 5,
    }
};


// File: src/components/Drawing/AngleShape.ts
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {timeToX, priceToY} from "../Canvas/utils/GraphHelpers";
import {AngleShapeArgs, CanvasPoint, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";
import {pointerTolerance} from "./drawHelper";
import {ShapeType} from "./types";

export class AngleShape implements IDrawingShape {

    public id: string;
    public type = ShapeType.Triangle;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: AngleShapeArgs, public styleOptions: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOptions;
        this.points = args.points ?? [];
    }

    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        if (this.points.length < 2) {
            return;
        }
        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        const p1: CanvasPoint = {x: x1, y: y1};
        const p2: CanvasPoint = {x: x2, y: y2};
        const vertex: CanvasPoint = {x: p2.x, y: p1.y};

        // Apply the final calculated style
        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        if (style.lineStyle === 'dashed') ctx.setLineDash([5, 5]);
        else if (style.lineStyle === 'dotted') ctx.setLineDash([1, 2]);
        else ctx.setLineDash([]);

        // Draw the main angle lines
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(vertex.x, vertex.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Draw the visuals (arc and text)
        this.drawAngleVisuals(ctx, p1, vertex, p2, style.lineColor);
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const p1 = {
            x: timeToX(this.points[0].time, canvasWidth, visibleRange),
            y: priceToY(this.points[0].price, canvasHeight, visiblePriceRange)
        };
        const p2 = {
            x: timeToX(this.points[1].time, canvasWidth, visibleRange),
            y: priceToY(this.points[1].price, canvasHeight, visiblePriceRange)
        };
        const vertex = {x: p2.x, y: p1.y};

        return this.isPointNearLine(px, py, p1.x, p1.y, vertex.x, vertex.y, pointerTolerance) ||
            this.isPointNearLine(px, py, vertex.x, vertex.y, p2.x, p2.y, pointerTolerance);
    }

    private drawAngleVisuals(ctx: CanvasRenderingContext2D, p1: CanvasPoint, vertex: CanvasPoint, p2: CanvasPoint, color: string) {
        const radius = 25;

        const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);

        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, radius, angle1, angle2);
        ctx.stroke();

        const angleDeg = this.calculateAngle(p1, vertex, p2);
        const midAngle = (angle1 + angle2) / 2;
        const textRadius = radius + 15;
        const textX = vertex.x + textRadius * Math.cos(midAngle);
        const textY = vertex.y + textRadius * Math.sin(midAngle);

        ctx.fillStyle = color;
        ctx.font = '12px sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(angleDeg.toFixed(1) + '°', textX, textY);
    }

    private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
        const dx = x2 - x1;
        const dy = y2 - y1;
        if (dx === 0 && dy === 0) return false;

        const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
        const closestX = t < 0 ? x1 : t > 1 ? x2 : x1 + t * dx;
        const closestY = t < 0 ? y1 : t > 1 ? y2 : y1 + t * dy;

        const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
        return distSq <= tolerance ** 2;
    }

    private calculateAngle(p1: CanvasPoint, vertex: CanvasPoint, p2: CanvasPoint): number {
        const v1 = {x: p1.x - vertex.x, y: p1.y - vertex.y};
        const v2 = {x: p2.x - vertex.x, y: p2.y - vertex.y};
        const angleRad = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
        let angleDeg = Math.abs(angleRad * (180 / Math.PI));
        if (angleDeg > 180) angleDeg = 360 - angleDeg;
        return angleDeg;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points;
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }

    }

    getPoints(): DrawingPoint[] {
        return [];
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

}

// File: src/components/Drawing/ArrowShape.ts
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {timeToX, priceToY} from "../Canvas/utils/GraphHelpers";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {ArrowShapeArgs, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";
import {pointerTolerance} from "./drawHelper";
import {ShapeType} from "./types";


export class ArrowShape implements IDrawingShape {

    public id: string;
    public type = ShapeType.Arrow;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: ArrowShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.points = args?.points ?? [];
    }

    /**
     * Draws the arrow shape on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        if (this.points.length < 2) {
            return;
        }
        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        // Apply the final calculated style
        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.lineColor; // Arrowhead fill matches the line color
        if (style.lineStyle === 'dashed') ctx.setLineDash([5, 5]);
        else if (style.lineStyle === 'dotted') ctx.setLineDash([1, 2]);
        else ctx.setLineDash([]);

        // Draw the main line of the arrow
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw the arrowhead
        const headLength = 8 + (style.lineWidth - 1) * 2; // Make arrowhead scale with line width
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Checks if a point (in pixel coordinates) is hitting the shape's line.
     */
    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        return isPointNearLine(px, py, x1, y1, x2, y2, pointerTolerance);
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point; // Update the end point if already two points exist
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points.slice(0, 2); // Ensure only two points are kept
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

}

// File: src/components/Drawing/CircleShape.ts
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {CircleShapeArgs, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";
import {pointerTolerance} from "./drawHelper";
import {ShapeType} from "./types";


export class CircleShape implements IDrawingShape {
    public id: string;
    public type = ShapeType.Circle;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: CircleShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.points = args?.points ?? [];
    }

    /**
     * Draws the circle/ellipse shape on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        if (this.points.length < 2) {
            return;
        }
        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;

        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.fillColor;

        if (style.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === 'dotted') {
            ctx.setLineDash([1, 2]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

        if (style?.fillColor !== 'transparent') {
            ctx.fill();
        }
        ctx.stroke();
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const radiusX = Math.abs(x2 - x1) / 2;
        const radiusY = Math.abs(y2 - y1) / 2;

        if (radiusX === 0 || radiusY === 0) return false;

        // Check if the point is on the boundary of the ellipse
        const normalized = ((px - centerX) / radiusX) ** 2 + ((py - centerY) / radiusY) ** 2;
        return normalized >= 1 - pointerTolerance && normalized <= 1 + pointerTolerance;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points.slice(0, 2);
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }
}

// File: src/components/Drawing/CustomSymbolShape.ts
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {CustomSymbolShapeArgs, DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";
import {ShapeType} from "./types";


export class CustomSymbolShape implements IDrawingShape {
    public id: string;
    public type = ShapeType.CustomSymbol;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];
    public symbol: string;
    public size: number;

    constructor(public args: CustomSymbolShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.points = args?.points ?? [];
        this.symbol = args.symbol;
        this.size = args.size;
    }

    /**
     * Draws the symbol on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {points, symbol, size} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x = timeToX(points[0].time, canvasWidth, visibleRange);
        const y = priceToY(points[0].price, canvasHeight, visiblePriceRange);


        ctx.fillStyle = style.fillColor !== 'transparent' ? style.fillColor : style.lineColor;
        ctx.font = `${size || 20}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(symbol, x, y);
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {points, size} = this.args;
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x = timeToX(points[0].time, canvasWidth, visibleRange);
        const y = priceToY(points[0].price, canvasHeight, visiblePriceRange);
        const s = size || 20;

        // Bounding box hit test
        return px >= x - s / 2 &&
            px <= x + s / 2 &&
            py >= y - s / 2 &&
            py <= y + s / 2;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 1) {
            this.points.push(point);
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points;
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length > 0) {
            this.points[0] = point;
        } else {
            this.points.push(point);
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[this.points.length - 1] = point;
        }
    }
}

// File: src/components/Drawing/IDrawingShape.ts
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle} from "../../types/Drawings";

export interface IDrawingShape {
    id: string ;
    style: DrawingStyleOptions;
    points: DrawingPoint[];

    /**
     * Draws the shape on the canvas.
     * @param ctx
     * @param renderContext
     * @param visiblePriceRange
     * @param style The final, calculated style object to use for drawing.
     */
    draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void;

    /**
     * Checks if a point (in pixel coordinates) is hitting the shape.
     */
    isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean;

    setPoints(points: DrawingPoint[]): void;

    setPointAt(index: number, point: DrawingPoint): void;

    setFirstPoint(point: DrawingPoint): void;

    addPoint(point: DrawingPoint): void;

    updateLastPoint(point: DrawingPoint): void;

    getPoints(): DrawingPoint[];
}

// Internal counter for unique IDs
let _drawingShapeIdCounter = 0;

/**
 * Helper to generate a unique id string for drawing shapes.
 */
export function generateDrawingShapeId(): string {
    _drawingShapeIdCounter += 1;
    return `drawing-shape-${_drawingShapeIdCounter}`;
}


// File: src/components/Drawing/LineShape.ts
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {timeToX, priceToY} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle, LineShapeArgs} from "../../types/Drawings";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {pointerTolerance} from "./drawHelper";
import {ShapeType} from "./types";

export class LineShape implements IDrawingShape {
    public id: string;
    public type = ShapeType.Line;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];


    constructor(public args: LineShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.points = args?.points ?? [];
    }

    /**
     * Draws the line shape on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;
        if (this.points.length < 2) {
            return;
        }
        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;

        if (style.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === 'dotted') {
            ctx.setLineDash([1, 2]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);

        return isPointNearLine(px, py, x1, y1, x2, y2, pointerTolerance);
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points;
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            console.warn("LineShape can only have two points.");
        }
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index < 0) {
            throw new Error("Index out of bounds");
        }
        if (index == this.points.length - 1) {
            this.points[index] = point;
        } else if (index === this.points.length + 1) {
            this.addPoint(point);
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }


}

// File: src/components/Drawing/Polyline.ts
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle, PolylineShapeArgs} from "../../types/Drawings";
import {ShapeType} from "./types";


export class Polyline implements IDrawingShape {

    public id: string;
    public type = ShapeType.Polyline;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: PolylineShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;

    }

    public addPoint(point: DrawingPoint): void {
        this.points.push(point);
    }

    /**
     * Draws the polyline/polygon shape on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {points} = this.args;
        if (points.length < 2) return;

        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.fillColor;
        if (style.lineStyle === 'dashed') ctx.setLineDash([5, 5]);
        else if (style.lineStyle === 'dotted') ctx.setLineDash([1, 2]);
        else ctx.setLineDash([]);

        const pixelPoints = points.map(p => ({
            x: timeToX(p.time, canvasWidth, visibleRange),
            y: priceToY(p.price, canvasHeight, visiblePriceRange)
        }));

        ctx.beginPath();
        ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
        for (let i = 1; i < pixelPoints.length; i++) {
            ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
        }

        if (points.length > 2) {
            ctx.closePath();
        }

        if (style.fillColor !== 'transparent') {
            ctx.fill();
        }

        ctx.stroke();
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {points} = this.args;
        if (points.length < 2) return false;

        const {canvasWidth, canvasHeight, visibleRange} = renderContext;
        const tolerance = 6;

        const pixelPoints = points.map(p => ({
            x: timeToX(p.time, canvasWidth, visibleRange),
            y: priceToY(p.price, canvasHeight, visiblePriceRange)
        }));

        // Check for a hit on any of the line segments
        for (let i = 0; i < pixelPoints.length - 1; i++) {
            if (isPointNearLine(px, py, pixelPoints[i].x, pixelPoints[i].y, pixelPoints[i + 1].x, pixelPoints[i + 1].y, tolerance)) {
                return true;
            }
        }

        // If it's a closed polygon, also check the last segment connecting back to the first point
        if (points.length > 2) {
            const lastPoint = pixelPoints[pixelPoints.length - 1];
            const firstPoint = pixelPoints[0];
            if (isPointNearLine(px, py, lastPoint.x, lastPoint.y, firstPoint.x, firstPoint.y, tolerance)) {
                return true;
            }
        }

        return false;
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points;
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[this.points.length - 1] = point;
        }
    }
}

// File: src/components/Drawing/RectangleShape.ts
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle, RectangleShapeArgs} from "../../types/Drawings";
import {pointerTolerance} from "./drawHelper";
import {ShapeType} from "./types";


export class RectangleShape implements IDrawingShape {
    public id: string;
    public type = ShapeType.Rectangle;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: RectangleShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.points = args?.points ?? [];
    }

    /**
     * Draws the rectangle shape on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        if (this.points.length < 2) {
            return;
        }

        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);


        const width = x2 - x1;
        const height = y2 - y1;

        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.fillColor;

        if (style.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === 'dotted') {
            ctx.setLineDash([1, 2]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        if (style?.fillColor !== 'transparent') {
            ctx.fillRect(x1, y1, width, height);
        }
        ctx.strokeRect(x1, y1, width, height);
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const x1 = timeToX(this.points[0].time, canvasWidth, visibleRange);
        const y1 = priceToY(this.points[0].price, canvasHeight, visiblePriceRange);
        const x2 = timeToX(this.points[1].time, canvasWidth, visibleRange);
        const y2 = priceToY(this.points[1].price, canvasHeight, visiblePriceRange);


        // Check for a hit on any of the 4 lines of the rectangle
        return isPointNearLine(px, py, x1, y1, x2, y1, pointerTolerance) ||
            isPointNearLine(px, py, x2, y1, x2, y2, pointerTolerance) ||
            isPointNearLine(px, py, x2, y2, x1, y2, pointerTolerance) ||
            isPointNearLine(px, py, x1, y2, x1, y1, pointerTolerance);
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

    setPoints(points: DrawingPoint[]): void {
        if (points.length >= 2) {
            this.points = [points[0], points[1]];
        }
    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index >= 0 && index < this.points.length) {
            this.points[index] = point;
        }
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
        }
    }

}

// File: src/components/Drawing/TriangleShape.ts
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {priceToY, timeToX} from "../Canvas/utils/GraphHelpers";
import {ChartRenderContext} from "../../types/chartOptions";
import {PriceRange} from "../../types/Graph";
import {DrawingPoint, DrawingStyleOptions, FinalDrawingStyle, TriangleShapeArgs} from "../../types/Drawings";
import {isPointNearLine} from "../Canvas/utils/helpers";
import {pointerTolerance, pointInTriangle} from "./drawHelper";
import {ShapeType} from "./types";


export class TriangleShape implements IDrawingShape {

    public id: string;
    public type = ShapeType.Triangle;
    public style: DrawingStyleOptions;
    public points: DrawingPoint[] = [];

    constructor(public args: TriangleShapeArgs, public styleOverride: DrawingStyleOptions, id?: string | undefined) {
        this.id = id ?? generateDrawingShapeId();
        this.style = styleOverride;
        this.points = args?.points ?? [];
        this.recalculateThirdVertex();

    }

    /**
     * Draws the triangle shape on the canvas using a provided style.
     * @param ctx The canvas 2D rendering context.
     * @param renderContext The context containing canvas dimensions and visible ranges.
     * @param visiblePriceRange The currently visible price range for price-axis scaling.
     * @param style The final, calculated style object to apply.
     */
    public draw(
        ctx: CanvasRenderingContext2D,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange,
        style: FinalDrawingStyle
    ): void {


        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        if (this.points.length < 3) {
            return;
        }

        const p1 = {
            x: timeToX(this.points[0].time, canvasWidth, visibleRange),
            y: priceToY(this.points[0].price, canvasHeight, visiblePriceRange)
        };
        const p2 = {
            x: timeToX(this.points[1].time, canvasWidth, visibleRange),
            y: priceToY(this.points[1].price, canvasHeight, visiblePriceRange)
        };

        const p3 = {
            x: timeToX(this.points[2].time, canvasWidth, visibleRange),
            y: priceToY(this.points[2].price, canvasHeight, visiblePriceRange)
        };


        ctx.strokeStyle = style.lineColor;
        ctx.lineWidth = style.lineWidth;
        ctx.fillStyle = style.fillColor;

        if (style.lineStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else if (style.lineStyle === 'dotted') {
            ctx.setLineDash([1, 2]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        if (style?.fillColor !== 'transparent') {
            ctx.fill();
        }
        ctx.stroke();
    }

    public isHit(
        px: number,
        py: number,
        renderContext: ChartRenderContext,
        visiblePriceRange: PriceRange
    ): boolean {
        const {canvasWidth, canvasHeight, visibleRange} = renderContext;

        const a = {
            x: timeToX(this.points[0].time, canvasWidth, visibleRange),
            y: priceToY(this.points[0].price, canvasHeight, visiblePriceRange),
        };
        const b = {
            x: timeToX(this.points[1].time, canvasWidth, visibleRange),
            y: priceToY(this.points[1].price, canvasHeight, visiblePriceRange),
        };
        const c = {
            x: timeToX(this.points[2].time, canvasWidth, visibleRange),
            y: priceToY(this.points[2].price, canvasHeight, visiblePriceRange),
        };

        if (
            isPointNearLine(px, py, a.x, a.y, b.x, b.y, pointerTolerance) ||
            isPointNearLine(px, py, b.x, b.y, c.x, c.y, pointerTolerance) ||
            isPointNearLine(px, py, c.x, c.y, a.x, a.y, pointerTolerance)
        ) {
            return true;
        }

        return pointInTriangle(px, py, a, b, c);
    }

    recalculateThirdVertex(): void {
        if (this.points.length < 2) return;

        const xmin = Math.min(this.points[0].time, this.points[1].time);
        const xmax = Math.max(this.points[0].time, this.points[1].time);
        const ymin = Math.min(this.points[0].price, this.points[1].price);
        const ymax = Math.max(this.points[0].price, this.points[1].price);

        const dx = this.points[1].time - this.points[0].time;
        const dy = this.points[1].price - this.points[0].price;
        const isLeftToRight = dx >= 0;
        const isUp = dy > 0;
        let rx: number, ry: number;

        if (isLeftToRight) {
            rx = xmax;
            ry = isUp ? ymax : ymin;
        } else {
            rx = xmin;
            ry = isUp ? ymax : ymin;
        }

        if (this.points.length === 2) {
            this.points.push({time: rx, price: ry});
        } else {
            this.points[2] = {time: rx, price: ry};
        }
    }

    addPoint(point: DrawingPoint): void {
        if (this.points.length < 2) {
            this.points.push(point);
        } else {
            this.points[1] = point;
            this.recalculateThirdVertex();
        }
    }

    setPoints(points: DrawingPoint[]): void {
        this.points = points.slice(0, 2);
        this.recalculateThirdVertex();

    }

    setPointAt(index: number, point: DrawingPoint): void {
        if (index < 0 || index > 1) return;
        this.points[index] = point;
        this.recalculateThirdVertex();
    }

    getPoints(): DrawingPoint[] {
        return this.points;
    }

    setFirstPoint(point: DrawingPoint): void {

        if (this.points.length === 0) {
            this.points.push(point);
        } else {
            this.points[0] = point;
            this.recalculateThirdVertex();
        }
    }

    updateLastPoint(point: DrawingPoint): void {
        if (this.points.length === 0) {
            this.points.push(point);
        } else if (this.points.length === 1) {
            this.points.push(point);
        } else {
            this.points[1] = point;
            this.recalculateThirdVertex();
        }
    }


}

// File: src/components/Drawing/drawHelper.ts
import {
    AngleShapeArgs, ArrowShapeArgs,
    CanvasPoint, CircleShapeArgs, CustomSymbolShapeArgs,
    DrawingStyleOptions,
    LineShapeArgs, PolylineShapeArgs,
    RectangleShapeArgs, TriangleShapeArgs
} from "../../types/Drawings";
import {Drawing, ShapeType} from "./types";
import {Mode} from "../../contexts/ModeContext";
import {LineShape} from "./LineShape";
import {RectangleShape} from "./RectangleShape";
import {CircleShape} from "./CircleShape";
import {TriangleShape} from "./TriangleShape";
import {ArrowShape} from "./ArrowShape";
import {Polyline} from "./Polyline";
import {CustomSymbolShape} from "./CustomSymbolShape";
import {generateDrawingShapeId, IDrawingShape} from "./IDrawingShape";
import {AngleShape} from "./AngleShape";
import {deepMerge} from "../../utils/deepMerge";
import {DeepRequired} from "../../types/types";
import {ChartOptions} from "../../types/chartOptions";


export const pointerTolerance = 5; // pixels
export function pointInTriangle(
    px: number,
    py: number,
    a: CanvasPoint,
    b: CanvasPoint,
    c: CanvasPoint
): boolean {
    const v0x = c.x - a.x, v0y = c.y - a.y;
    const v1x = b.x - a.x, v1y = b.y - a.y;
    const v2x = px - a.x, v2y = py - a.y;

    const den = v0x * v1y - v1x * v0y;
    if (den === 0) return false;

    const u = (v2x * v1y - v1x * v2y) / den;
    const v = (v0x * v2y - v2x * v0y) / den;

    return u >= 0 && v >= 0 && (u + v) <= 1;
}


export function createShape(newDraw: Drawing): IDrawingShape {
    let shape: IDrawingShape;
    const shapeId = generateDrawingShapeId();
    switch (newDraw.mode) {
        case Mode.drawLine:
            shape = new LineShape(newDraw.args as LineShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawRectangle:
            shape = new RectangleShape(newDraw.args as RectangleShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawCircle:
            shape = new CircleShape(newDraw.args as CircleShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawTriangle:
            shape = new TriangleShape(newDraw.args as TriangleShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawAngle:
            shape = new AngleShape(newDraw.args as AngleShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawArrow:
            shape = new ArrowShape(newDraw.args as ArrowShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawPolyline:
            shape = new Polyline(newDraw.args as PolylineShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        case Mode.drawCustomSymbol:
            shape = new CustomSymbolShape(newDraw.args as CustomSymbolShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
            break;
        default:
            shape = new CustomSymbolShape(newDraw.args as CustomSymbolShapeArgs, newDraw.style as DrawingStyleOptions, shapeId);
    }

    return shape;
}


export function validateAndNormalizeShape(
    shape: any,
    chartOptions: DeepRequired<ChartOptions>
): IDrawingShape | null {
    if ('type' in shape) {
        if (!Object.values(ShapeType).includes(shape.type)) {
            console.warn("Invalid shape type passed:", shape);
            return null;
        }
    }

    // Check points
    if (!Array.isArray(shape.points)) {
        console.warn("Invalid shape: missing points", shape);
        return null;
    }

    // Normalize style
    const defaultStyle = chartOptions.base.style.drawings as DrawingStyleOptions;
    if (shape.style) {
        shape.style = deepMerge(defaultStyle as DeepRequired<DrawingStyleOptions>, shape.style);
    } else {
        shape.style = defaultStyle;
    }

    return shape;
}

// File: src/components/Drawing/types.ts
import {Mode} from "../../contexts/ModeContext";
import {
    AngleShapeArgs, ArrowShapeArgs,
    CircleShapeArgs, CustomSymbolShapeArgs,
    DrawingPoint,
    DrawingStyleOptions,
    LineShapeArgs, PolylineShapeArgs,
    RectangleShapeArgs, TriangleShapeArgs
} from "../../types/Drawings";

export type ShapeBaseArgs = {
    points: DrawingPoint[];
}
export type ShapeArgs =
    LineShapeArgs
    | RectangleShapeArgs
    | CircleShapeArgs
    | TriangleShapeArgs
    | AngleShapeArgs
    | PolylineShapeArgs
    | ArrowShapeArgs
    | CustomSymbolShapeArgs;

export type Drawing = {
    mode: Mode;
    args?: ShapeArgs;
    style?: DrawingStyleOptions;
}


export enum ShapeType {
    Line = "Line",
    Rectangle = "Rectangle",
    Circle = "Circle",
    Triangle = "Triangle",
    Angle = "Angle",
    Arrow = "Arrow",
    Polyline = "Polyline",
    CustomSymbol = "CustomSymbol",
}

// File: src/components/SimpleChartEdge.tsx
import React, {useMemo, useState, forwardRef, useImperativeHandle, useRef} from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {Interval} from '../types/Interval';
import {TimeRange} from '../types/Graph';
import {DeepPartial, DeepRequired} from '../types/types';
import {
    ChartOptions,
    ChartType,
    TimeDetailLevel
} from '../types/chartOptions';
import {ModeProvider} from '../contexts/ModeContext';
import {deepMerge} from "../utils/deepMerge";
import {
    GlobalStyle,
    MainAppWindow,
    LowerContainer,
    ToolbarArea,
    ChartStageArea,
    SettingsArea
} from '../styles/App.styles';
import {DEFAULT_GRAPH_OPTIONS} from "./DefaultData";

export interface SimpleChartEdgeHandle {
    addShape: (shape: any) => void;
    updateShape: (shapeId: string, newShape: any) => void;
    deleteShape: (shapeId: string) => void;
    addInterval: (interval: Interval) => void;
    updateInterval: (intervalId: string, newInterval: Interval) => void;
    deleteInterval: (intervalId: string) => void;
    getViewInfo: () => any;
    getCanvasSize: () => { width: number; height: number } | null;
    clearCanvas: () => void;
    redrawCanvas: () => void;
}

export type SimpleChartEdgeProps = {
    intervalsArray?: Interval[];
    initialNumberOfYTicks?: number;
    initialXAxisHeight?: number;
    initialYAxisWidth?: number;
    initialTimeDetailLevel?: TimeDetailLevel;
    initialTimeFormat12h?: boolean;
    initialVisibleTimeRange?: TimeRange;
    chartOptions?: DeepPartial<ChartOptions>
};

export const SimpleChartEdge = forwardRef<SimpleChartEdgeHandle, SimpleChartEdgeProps>(({
                                                                                            intervalsArray = [],
                                                                                            initialNumberOfYTicks = 5,
                                                                                            initialTimeDetailLevel = TimeDetailLevel.Auto,
                                                                                            initialTimeFormat12h = false,
                                                                                            chartOptions = {} as DeepPartial<ChartOptions>
                                                                                        }, ref) => {

    const [finalStyleOptions, setStyleOptions] = useState<DeepRequired<ChartOptions>>(deepMerge(DEFAULT_GRAPH_OPTIONS, chartOptions));
    const [selectedIndex, setSelectedIndex] = useState<null | number>(null);
    const stageRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        addShape: (shape: any) => {
            if (stageRef.current && stageRef.current.addShape) {
                stageRef.current.addShape(shape);
            }
        },
        updateShape: (shapeId: string, newShape: any) => {
            if (stageRef.current && stageRef.current.updateShape) {
                stageRef.current.updateShape(shapeId, newShape);
            }
        },
        deleteShape: (shapeId: string) => {
            if (stageRef.current && stageRef.current.deleteShape) {
                stageRef.current.deleteShape(shapeId);
            }
        },
        addInterval: (interval: Interval) => {
            if (stageRef.current && stageRef.current.addInterval) {
                stageRef.current.addInterval(interval);
            }
        },
        updateInterval: (intervalId: string, newInterval: Interval) => {
            if (stageRef.current && stageRef.current.updateInterval) {
                stageRef.current.updateInterval(intervalId, newInterval);
            }
        },
        deleteInterval: (intervalId: string) => {
            if (stageRef.current && stageRef.current.deleteInterval) {
                stageRef.current.deleteInterval(intervalId);
            }
        },
        getViewInfo: () => {
            if (stageRef.current && stageRef.current.getViewInfo) {
                return stageRef.current.getViewInfo();
            }
            return null;
        },
        getCanvasSize: () => {
            if (stageRef.current && stageRef.current.getCanvasSize) {
                return stageRef.current.getCanvasSize();
            }
            return null;
        },
        clearCanvas: () => {
            if (stageRef.current && stageRef.current.clearCanvas) {
                stageRef.current.clearCanvas();
            }
        },
        redrawCanvas: () => {
            if (stageRef.current && stageRef.current.redrawCanvas) {
                stageRef.current.redrawCanvas();
            }
        },
        reloadCanvas: () => {
            if (stageRef.current && stageRef.current.reloadCanvas) {
                stageRef.current.reloadCanvas();
            }
        }
    }));

    const handleChartTypeChange = (newType: ChartType) => {
        setSelectedIndex(null);
        setStyleOptions(prev => {
            const updated = prev;
            updated.base.chartType = newType;
            return {...updated};
        });
        console.log(`Chart type changed to: ${newType}`);
    }
    return (
        <ModeProvider>
            <GlobalStyle/>
            <MainAppWindow className={'simple-chart-window'}>
                <SettingsArea className={"settings-area"}>
                    <SettingsToolbar handleChartTypeChange={handleChartTypeChange}
                                     selectedChartType={finalStyleOptions.base.chartType as ChartType}/>
                </SettingsArea>
                <LowerContainer className={"lower-container"}>
                    <ToolbarArea className={"toolbar-area"}>
                        <Toolbar/>
                    </ToolbarArea>
                    <ChartStageArea className={"chart-stage-area"}>
                        <ChartStage
                            ref={stageRef}
                            intervalsArray={intervalsArray}
                            numberOfYTicks={initialNumberOfYTicks}
                            timeDetailLevel={initialTimeDetailLevel}
                            timeFormat12h={initialTimeFormat12h}
                            selectedIndex={selectedIndex}
                            chartOptions={finalStyleOptions}
                        />
                    </ChartStageArea>
                </LowerContainer>
            </MainAppWindow>
        </ModeProvider>
    );
});

// File: src/components/Toolbar/Buttons.tsx
import React from 'react';
import {ToolbarVerticalButton} from '../../styles/Toolbar.styles';
import {ButtonProps, ModeButtonProps} from "../../types/buttons";
import {ToolbarHorizontalButtons} from "../../styles/SettingsToolbar.styles";


export const ModeButton: React.FC<ModeButtonProps> = ({mode, currentMode, onClickHandler, children}) => {

    return (
        <ToolbarVerticalButton
            $selected={mode === currentMode}
            onClick={() => onClickHandler(mode)}
        >
            {children}
        </ToolbarVerticalButton>
    );
};

export const Button: React.FC<ButtonProps> = ({onClickHandler, children}) => {

    return (
        <ToolbarHorizontalButtons
            onClick={() => onClickHandler()}
        >
            {children}
        </ToolbarHorizontalButtons>
    );
};


// File: src/components/Toolbar/ChartTypeSelectDropdown.tsx
import React, {useState} from "react";
import {
    ChartTypeDropdown,
    ChartTypeOption,
    ChartTypeSelectContainer, ChartTypeTrigger
} from "../../styles/ChartTypeSelectDropdown.styles";
import {ChartType} from "../../types/chartOptions";
import {IconChartLine, IconChartBar, IconChartCandle, IconChartArea, IconArrowDown} from './icons';

const icons: Record<ChartType, React.ReactNode> = {
    Line: <IconChartLine/>,
    Bar: <IconChartBar/>,
    Candlestick: <IconChartCandle/>,
    Area: <IconChartArea/>
};

interface Props {
    value: ChartType;
    onChange: (type: ChartType) => void;
}

export const ChartTypeSelectDropdown: React.FC<Props> = ({value, onChange}) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (type: ChartType) => {
        onChange(type);
        setOpen(false);
    };

    return (
        <ChartTypeSelectContainer className={"chart-type-select-dropdown"}>
            <ChartTypeTrigger onClick={() => setOpen(!open)}>
                {icons[value]}
                <IconArrowDown />
            </ChartTypeTrigger>
            {open && (
                <ChartTypeDropdown>
                    {(Object.keys(icons) as ChartType[]).map((type) => (
                        <ChartTypeOption
                            key={type}
                            onClick={() => handleSelect(type)}
                            $active={value === type}
                        >
                            {icons[type]}
                        </ChartTypeOption>
                    ))}
                </ChartTypeDropdown>
            )}
        </ChartTypeSelectContainer>
    );
};

// File: src/components/Toolbar/SettingsToolbar.tsx
import React from 'react';
import {
    SettingsToolbarContainer, SettingToolbarContent, Spacer,
    SymbolInput,
} from '../../styles/SettingsToolbar.styles';

import {Button} from './Buttons';
import {
    IconCamera,
    IconDownload,
    IconGear,
    IconRange,
    IconRefresh,
    IconSearch,
    IconTheme,
} from './icons';
import {ChartType} from "../../types/chartOptions";
import {Placement, TooltipAlign, TooltipAxis} from "../../types/buttons";
import {Tooltip} from "../Tooltip";
import {ChartTypeSelectDropdown} from "./ChartTypeSelectDropdown";

interface SettingToolbarProps {
    handleChartTypeChange: (type: ChartType) => void;
    selectedChartType?: ChartType;
}

export const SettingsToolbar = ({handleChartTypeChange, selectedChartType}: SettingToolbarProps) => {
    const handleDownload = () => {
        const canvas = document.querySelector('canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error('Canvas element not found or invalid.');
            return;
        }
        const link = document.createElement('a');
        link.download = 'chart-snapshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const openSettingsMenu = () => {
        console.log('Opening settings menu...');
    };

    const openSearch = () => {
        console.log('Opening search...');
    };

    const openRange = () => {
        console.log('Opening range selection...');
    };

    const doDownload = () => {
        console.log('Downloading data...');
    };

    const doRefresh = () => {
        console.log('Refreshing data...');
    };

    const toggleTheme = () => {
        console.log('Toggling theme...');
    };

    return (
        <SettingsToolbarContainer className="settings-toolbar">
            <SettingToolbarContent>
                <SymbolInput className={'symbol-choose-icon'} name={'symbol-input'} placeholder="Symbol"/>
                <ChartTypeSelectDropdown
                    value={selectedChartType || ChartType.Candlestick}
                    onChange={handleChartTypeChange}
                />
                <Tooltip content="Settings" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={openSettingsMenu}>
                        <IconGear/>
                    </Button>
                </Tooltip>
                <Tooltip content="Download" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={handleDownload}>
                        <IconCamera/>
                    </Button>
                </Tooltip>
                <Tooltip content="Search" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={openSearch}>
                        <IconSearch/>
                    </Button>
                </Tooltip>
                <Tooltip content="Range" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={openRange}>
                        <IconRange/>
                    </Button>
                </Tooltip>
                <Tooltip content="Download" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={doDownload}>
                        <IconDownload/>
                    </Button>
                </Tooltip>
                <Tooltip content="Refresh" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={doRefresh}>
                        <IconRefresh/>
                    </Button>
                </Tooltip>
                <Tooltip content="Toggle Theme" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={toggleTheme}>
                        <IconTheme/>
                    </Button>
                </Tooltip>
                <Spacer/>
            </SettingToolbarContent>
        </SettingsToolbarContainer>
    );
};

// File: src/components/Toolbar/Toolbar.tsx
import React, {useEffect} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {ModeButton} from './Buttons';
import {
    ToolbarContainer,
    ToolbarContent
} from '../../styles/Toolbar.styles';
import {Tooltip} from '../Tooltip';
import {Placement, TooltipAlign, TooltipAxis} from '../../types/buttons';
import {IconLine, IconRect, IconCircle, IconTriangle, IconAngle, IconSelect, IconPencil} from './icons';

export const Toolbar: React.FC = () => {
    const {mode, setMode} = useMode();

    useEffect(() => {
        console.log('Toolbar mode changed:', mode);
    }, [mode]);

    return (
        <ToolbarContainer >
            <ToolbarContent>
                <Tooltip content="Draw Line" tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawLine}
                        currentMode={mode}
                        onClickHandler={setMode}
                    >
                        <IconLine active={mode === Mode.drawLine}/>
                    </ModeButton>
                </Tooltip>

                <Tooltip content="Draw Rectangle" tooltipAxis={TooltipAxis.vertical} placement={Placement.right}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawRectangle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconRect active={mode === Mode.drawRectangle}/></ModeButton>
                </Tooltip>

                <Tooltip content="Draw Circle" tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawCircle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconCircle active={mode === Mode.drawCircle}/></ModeButton>
                </Tooltip>

                <Tooltip content="Draw Triangle" tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawTriangle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconTriangle active={mode === Mode.drawTriangle}/></ModeButton>
                </Tooltip>

                <Tooltip content="Draw Angle" tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.drawAngle}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconAngle active={mode === Mode.drawAngle}/></ModeButton>
                </Tooltip>

                <Tooltip content="Select" tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.select}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconSelect active={mode === Mode.select}/></ModeButton>
                </Tooltip>

                <Tooltip content="Edit Shape" tooltipAxis={TooltipAxis.vertical} placement={Placement.auto}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <ModeButton
                        mode={Mode.editShape}
                        currentMode={mode}
                        onClickHandler={setMode}
                    ><IconPencil active={mode === Mode.editShape}/></ModeButton>
                </Tooltip>
            </ToolbarContent>
        </ToolbarContainer>
    );
};

// File: src/components/Toolbar/icons.tsx
import React from 'react';

/**
 * IconBase — a clean, scalable SVG wrapper that fills its container
 * - No hardcoded pixels; uses 100%/100% so the parent controls size
 * - preserveAspectRatio keeps shapes undistorted
 * - vector-effect keeps stroke widths readable across scales
 */
export const IconBase: React.FC<{ active?: boolean; name: string; children: React.ReactNode }> = ({
                                                                                                      active,
                                                                                                      name,
                                                                                                      children
                                                                                                  }) => {
    const gradId = React.useId();
    const glowId = React.useId();
    return (
        <svg
            className={`icon-${name}`}
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={active ? '#3EC5FF' : '#2979FF'}/>
                    <stop offset="60%" stopColor={active ? '#6A5ACD' : '#4B32C3'}/>
                    <stop offset="100%" stopColor={active ? '#8A2BE2' : '#5B3FFF'}/>
                </linearGradient>
                <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#6A5ACD"
                                  floodOpacity={active ? '0.65' : '0'}/>
                </filter>
            </defs>

            {/* Foreground strokes, with inner padding so paths don't hug the edges */}
            <g stroke={`url(#${gradId})`} filter={`url(#${glowId})`} transform="translate(2,2) scale(0.8333)">
                {/* Keep strokes readable on small sizes */}
                <style>{`*{vector-effect:non-scaling-stroke}`}</style>
                {children}
            </g>
        </svg>
    );
};

// Stroke endTime tokens for consistency
const SW = {
    thick: 1.8,
    medium: 1.3,
    thin: 1.0,
} as const;

/* =========================
 *  SHAPE / DRAWING ICONS
 * ========================= */

export const IconLine: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="line">
        <path d="M4 16.5 L14.5 9.5 L20 6" strokeWidth={SW.thick}/>
        <circle cx="4" cy="16.5" r="1.2" fill="currentColor"/>
        <circle cx="14.5" cy="9.5" r="1.2" fill="currentColor"/>
        <circle cx="20" cy="6" r="1.2" fill="currentColor"/>
    </IconBase>
);

export const IconRect: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="rectangle">
        <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" strokeWidth={SW.thick}/>
        <line x1="8" y1="9.5" x2="16" y2="9.5" strokeWidth={SW.thin} opacity={0.8}/>
        <line x1="8" y1="14.5" x2="16" y2="14.5" strokeWidth={SW.thin} opacity={0.8}/>
    </IconBase>
);

export const IconCircle: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="circle">
        <circle cx="12" cy="12" r="7" strokeWidth={SW.thick}/>
        <polyline points="12,5 12,12 16.5,12" strokeWidth={SW.medium} opacity={0.9}/>
    </IconBase>
);

export const IconTriangle: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="triangle">
        <polygon points="12,4.5 19,18 5,18" fill="none" strokeWidth={SW.medium}/>
        <polygon points="12,9.5 15,15 9,15" fill="none" strokeWidth={SW.thin} opacity={0.85}/>
    </IconBase>
);

export const IconAngle: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="angle">
        <polyline points="5,18 12,6 19,18" strokeWidth={SW.thick}/>
        <path d="M12 6 A6.5 6.5 0 0 1 18 12.5" strokeWidth={SW.thin} opacity={0.9}/>
    </IconBase>
);

export const IconSelect: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="select">
        <polygon points="7,4 17,12 12,13 11,18" fill="none" strokeWidth={SW.thick}/>
        <line x1="12.2" y1="13" x2="16.5" y2="17.3" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconPencil: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="pencil">
        <polygon points="4,16.8 7.2,20 20,7.2 16.8,4" fill="none" strokeWidth={SW.thick}/>
        <line x1="14.2" y1="6.6" x2="17.4" y2="9.8" strokeWidth={SW.medium}/>
    </IconBase>
);

/* =========================
 *  SETTINGS / UTILITY ICONS
 * ========================= */

export const IconGear: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="gear">
        {/* gear ring */}
        <circle cx="12" cy="12" r="5.3" strokeWidth={SW.thick}/>
        {/* spokes */}
        <line x1="12" y1="5.5" x2="12" y2="7.2" strokeWidth={SW.medium}/>
        <line x1="12" y1="16.8" x2="12" y2="18.5" strokeWidth={SW.medium}/>
        <line x1="5.5" y1="12" x2="7.2" y2="12" strokeWidth={SW.medium}/>
        <line x1="16.8" y1="12" x2="18.5" y2="12" strokeWidth={SW.medium}/>
        <line x1="7.7" y1="7.7" x2="9.0" y2="9.0" strokeWidth={SW.medium}/>
        <line x1="15.0" y1="15.0" x2="16.3" y2="16.3" strokeWidth={SW.medium}/>
        <line x1="15.0" y1="9.0" x2="16.3" y2="7.7" strokeWidth={SW.medium}/>
        <line x1="7.7" y1="16.3" x2="9.0" y2="15.0" strokeWidth={SW.medium}/>
        {/* hub */}
        <circle cx="12" cy="12" r="2.0" strokeWidth={SW.thin}/>
    </IconBase>
);

export const IconCamera: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="camera">
        {/* body */}
        <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" strokeWidth={SW.thick}/>
        {/* top hump */}
        <path d="M8 6.5 L10 4.5 H14 L16 6.5" strokeWidth={SW.medium}/>
        {/* lens */}
        <circle cx="12" cy="12" r="3.2" strokeWidth={SW.thick}/>
        <circle cx="12" cy="12" r="1.2" strokeWidth={SW.thin} opacity={0.9}/>
        {/* flash dot */}
        <circle cx="6.2" cy="9.2" r="0.7" strokeWidth={SW.thin}/>
    </IconBase>
);

export const IconSearch: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="search">
        <circle cx="10.5" cy="10.5" r="4.8" strokeWidth={SW.thick}/>
        <line x1="14.2" y1="14.2" x2="19" y2="19" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconRange: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="range">
        {/* brackets */}
        <path d="M6 7 L6 17 M18 7 L18 17" strokeWidth={SW.thick}/>
        {/* arrows up/down */}
        <polyline points="9.5,9.5 12,7.8 14.5,9.5" strokeWidth={SW.medium}/>
        <polyline points="9.5,14.5 12,16.2 14.5,14.5" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconDownload: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="download">
        <path d="M12 5 L12 14" strokeWidth={SW.thick}/>
        <polyline points="8.5,11.5 12,15 15.5,11.5" strokeWidth={SW.thick}/>
        <rect x="5" y="16" width="14" height="2" rx="1" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconRefresh: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="refresh">
        <path d="M7.5 8.5 A5.5 5.5 0 1 1 8 18" strokeWidth={SW.thick}/>
        <polyline points="7.5,5.5 7.5,8.8 4.5,8.8" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconTheme: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="theme">
        {/* crescent moon */}
        <path d="M14.8 6.2 A6.8 6.8 0 1 0 18 16.2 A5.0 5.0 0 1 1 14.8 6.2" strokeWidth={SW.thick}/>
        {/* tiny stars */}
        <circle cx="16.8" cy="7.2" r="0.6" strokeWidth={SW.thin}/>
        <circle cx="17.6" cy="9.4" r="0.5" strokeWidth={SW.thin}/>
    </IconBase>
);

/* =========================
 *  CHART TYPE ICONS
 * ========================= */

export const IconChartLine: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="chart-line">
        <polyline points="4,16 10,10 16,14 20,6" strokeWidth={SW.thick}/>
        <circle cx="4" cy="16" r="1" fill="currentColor"/>
        <circle cx="10" cy="10" r="1" fill="currentColor"/>
        <circle cx="16" cy="14" r="1" fill="currentColor"/>
        <circle cx="20" cy="6" r="1" fill="currentColor"/>
    </IconBase>
);

export const IconChartBar: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="chart-bar">
        <rect x="5" y="10" width="3" height="8" strokeWidth={SW.thick}/>
        <rect x="11" y="7" width="3" height="11" strokeWidth={SW.thick}/>
        <rect x="17" y="4" width="3" height="14" strokeWidth={SW.thick}/>
    </IconBase>
);

export const IconChartCandle: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="chart-candle">
        {/* Left candle */}
        <line x1="8" y1="5" x2="8" y2="19" strokeWidth={SW.thin}/>
        <rect x="6" y="9" width="4" height="6" strokeWidth={SW.thick}/>
        <line x1="8" y1="9" x2="8" y2="15" strokeWidth={SW.thin}/>
        {/* add center wick inside the rectangle */}
        <line x1="8" y1="9" x2="8" y2="15" strokeWidth={SW.thin}/>

        {/* Right candle */}
        <line x1="16" y1="5" x2="16" y2="19" strokeWidth={SW.thin}/>
        <rect x="14" y="7" width="4" height="10" strokeWidth={SW.thick}/>
        <line x1="16" y1="7" x2="16" y2="17" strokeWidth={SW.thin}/>
        {/* add center wick inside the rectangle */}
        <line x1="16" y1="7" x2="16" y2="17" strokeWidth={SW.thin}/>
    </IconBase>
);

export const IconChartArea: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="chart-area">
        <path d="M4,16 L8,10 L14,14 L20,8 L20,20 L4,20 Z"
              strokeWidth={SW.thick}
              fill="currentColor"
              fillOpacity={0.2}/>
        <polyline points="4,16 8,10 14,14 20,8" strokeWidth={SW.thick}/>
    </IconBase>
);


/* =========================
 *  DROPDOWN / ARROW ICONS
 * ========================= */

export const IconArrowDown: React.FC<{ active?: boolean }> = ({active}) => {
    const gradId = React.useId();
    return (
        <svg
            className="icon-arrow-down"
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={active ? '#3EC5FF' : '#2979FF'}/>
                    <stop offset="60%" stopColor={active ? '#6A5ACD' : '#4B32C3'}/>
                    <stop offset="100%" stopColor={active ? '#8A2BE2' : '#5B3FFF'}/>
                </linearGradient>
            </defs>
            <polyline points="6,9 12,15 18,9" stroke={`url(#${gradId})`} strokeWidth="2"/>
        </svg>
    );
};


// File: src/components/Tooltip.tsx
const LIGHT_TOKENS = {
    bg: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.96) 100%)',
    border: 'rgba(123, 97, 255, 0.35)',
    text: '#1e2a44',
    shadow: '0 8px 24px rgba(17,19,39,0.18), inset 0 1px 0 rgba(255,255,255,0.45)'
};
const DARK_TOKENS = {
    bg: 'linear-gradient(180deg, rgba(22,24,36,0.92) 0%, rgba(16,18,30,0.94) 100%)',
    border: 'rgba(160, 170, 255, 0.40)',
    text: 'rgba(235,240,255,0.92)',
    shadow: '0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)'
};
const pickTokens = () => {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const hasDarkClass = typeof document !== 'undefined' && document.body && document.body.classList.contains('dark');
    return (prefersDark || hasDarkClass) ? DARK_TOKENS : LIGHT_TOKENS;
};
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Placement, TooltipAlign, TooltipAxis} from '../types/buttons';
import {TooltipArrow, TooltipBox, TooltipWrapper} from "../styles/Tooltip.styles";

type TooltipProps = {
    content: React.ReactNode;
    tooltipAxis: TooltipAxis;
    placement?: Placement;
    axis?: TooltipAxis;
    align?: TooltipAlign;
    offset?: number;
    autoFlip?: boolean;
    delayHideMs?: number;
    children: React.ReactElement<any>;
};

export const Tooltip: React.FC<TooltipProps> = ({
                                                    content,
                                                    tooltipAxis,
                                                    placement = Placement.auto,
                                                    axis = TooltipAxis.horizontal,
                                                    align = TooltipAlign.center,
                                                    offset = 10,
                                                    autoFlip = true,
                                                    delayHideMs = 120,
                                                    children,
                                                }) => {
    const [open, setOpen] = useState(false);
    const timer = useRef<number | undefined>(undefined);
    const containerRef = useRef<HTMLSpanElement | null>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const tipRef = useRef<HTMLSpanElement | null>(null);
    const [tipSize, setTipSize] = useState<{ w: number; h: number }>({w: 0, h: 0});
    const [effectivePlacement, setEffectivePlacement] = useState<Placement>(Placement.top);
    const arrowSize = 8;

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    const measure = () => {
        const el = containerRef.current;
        if (!el) return;
        setAnchorRect(el.getBoundingClientRect());
    };

    const show = () => {
        if (timer.current != undefined) {
            window.clearTimeout(timer.current!);
        }
        measure();
        setOpen(true);
    };

    const hide = () => {
        if (timer.current != undefined) {
            window.clearTimeout(timer.current!);
        }
        timer.current = window.setTimeout(() => setOpen(false), delayHideMs);
    };

    useEffect(
        () => () => {
            if (timer.current != undefined) {
                window.clearTimeout(timer.current!);
            }
        },
        []
    );

    useEffect(() => {
        if (!open) return;
        const onWinChange = () => measure();
        window.addEventListener('scroll', onWinChange, {passive: true});
        window.addEventListener('resize', onWinChange);
        measure();
        return () => {
            window.removeEventListener('scroll', onWinChange);
            window.removeEventListener('resize', onWinChange);
        };
    }, [open]);

    const measureTip = () => {
        const el = tipRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setTipSize({w: rect.width, h: rect.height});
    };

    const resolvePlacement = (
        pref: Placement,
        ax: TooltipAxis,
        rect: DOMRect,
        size: { w: number; h: number }
    ) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const spaceTop = rect.top;
        const spaceBottom = vh - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = vw - rect.right;
        let side: Placement;

        if (pref === Placement.auto) {
            if (ax === TooltipAxis.horizontal) {
                side = spaceRight >= spaceLeft ? Placement.right : Placement.left;
            } else if (ax === TooltipAxis.vertical) {
                side = spaceBottom >= spaceTop ? Placement.bottom : Placement.top;
            } else {
                const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
                side =
                    maxSpace === spaceBottom
                        ? Placement.bottom
                        : maxSpace === spaceTop
                            ? Placement.top
                            : maxSpace === spaceRight
                                ? Placement.right
                                : Placement.left;
            }
        } else {
            side = pref;
        }

        const wouldOverflow = () => {
            switch (side) {
                case Placement.top:
                    return size.h + offset > spaceTop;
                case Placement.bottom:
                    return size.h + offset > spaceBottom;
                case Placement.left:
                    return size.w + offset > spaceLeft;
                case Placement.right:
                    return size.w + offset > spaceRight;
            }
        };

        if (autoFlip && wouldOverflow()) {
            side =
                side === Placement.top
                    ? Placement.bottom
                    : side === Placement.bottom
                        ? Placement.top
                        : side === Placement.left
                            ? Placement.right
                            : Placement.left;
        }
        return side;
    };

    useLayoutEffect(() => {
        if (!open || !anchorRect) return;
        measureTip();
        queueMicrotask(() => {
            if (!anchorRect) return;
            const side = resolvePlacement(placement, axis, anchorRect, tipSize);
            setEffectivePlacement(side);
        });
    }, [open, anchorRect, placement, axis, tipSize.w, tipSize.h]);

    const {posStyle, arrowX, arrowY} = (() => {
        const rect = anchorRect;
        const base: React.CSSProperties = {position: 'fixed'};
        if (!rect) return {
            posStyle: base,
            arrowX: undefined as number | undefined,
            arrowY: undefined as number | undefined
        };

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = 0, top = 0, transform = '';
        const pad = 6;
        const arrowHalf = arrowSize / 2;

        if (effectivePlacement === Placement.bottom || effectivePlacement === Placement.top) {
            // Horizontal axis (top/bottom): compute clamped center and arrowX
            const rawCenterX =
                align === TooltipAlign.start ? rect.left + tipSize.w / 2 :
                    align === TooltipAlign.end ? rect.right - tipSize.w / 2 :
                        rect.left + rect.width / 2;

            const halfW = tipSize.w / 2;
            const centerX = clamp(rawCenterX, pad + halfW, vw - pad - halfW);

            left = centerX;
            top = effectivePlacement === Placement.bottom ? rect.bottom + offset : rect.top - offset;
            transform = `translate(-50%, ${effectivePlacement === Placement.bottom ? '0' : '-100%'})`;

            // Arrow X: anchor center (true) relative to tooltip's left edge after transform centering
            // Because we centered via translateX(-50%), the tooltip's left edge in screen coords is (left - halfW)
            const tooltipLeft = centerX - halfW;
            const anchorCenterX = rect.left + rect.width / 2;
            const rawArrowX = anchorCenterX - tooltipLeft;
            const arrowX = clamp(rawArrowX, arrowHalf, tipSize.w - arrowHalf);

            return {posStyle: {...base, left, top, transform}, arrowX, arrowY: undefined};
        } else {
            // Vertical axis (left/right): compute clamped center and arrowY
            const rawCenterY =
                align === TooltipAlign.start ? rect.top + tipSize.h / 2 :
                    align === TooltipAlign.end ? rect.bottom - tipSize.h / 2 :
                        rect.top + rect.height / 2;

            const halfH = tipSize.h / 2;
            const centerY = clamp(rawCenterY, pad + halfH, vh - pad - halfH);

            top = centerY;
            left = effectivePlacement === Placement.right ? rect.right + offset : rect.left - offset;
            transform = `translate(${effectivePlacement === Placement.right ? '0' : '-100%'}, -50%)`;

            const tooltipTop = centerY - halfH;
            const anchorCenterY = rect.top + rect.height / 2;
            const rawArrowY = anchorCenterY - tooltipTop;
            const arrowY = clamp(rawArrowY, arrowHalf, tipSize.h - arrowHalf);

            return {posStyle: {...base, left, top, transform}, arrowX: undefined, arrowY};
        }
    })();

    return (
        <TooltipWrapper
            ref={containerRef}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {open &&
                createPortal(
                    (() => {
                        const t = pickTokens();
                        return (
                            <TooltipBox
                                ref={tipRef}
                                id="ce-tooltip"
                                role="tooltip"
                                $left={posStyle.left as number}
                                $top={posStyle.top as number}
                                $transformCss={posStyle.transform as string}
                                $bg={t.bg}
                                $border={t.border}
                                $text={t.text}
                                $shadow={t.shadow}
                                $placement={effectivePlacement}
                                $arrowSize={arrowSize}
                            >
                                <TooltipArrow
                                    $placement={effectivePlacement}
                                    $size={arrowSize}
                                    $bg={t.bg}
                                    $border={t.border}
                                    $shadow={t.shadow}
                                    $anchorX={effectivePlacement === Placement.top || effectivePlacement === Placement.bottom ? arrowX : undefined}
                                    $anchorY={effectivePlacement === Placement.left || effectivePlacement === Placement.right ? arrowY : undefined}
                                    aria-hidden
                                />
                                {content}
                            </TooltipBox>
                        );
                    })(),
                    document.body
                )}
        </TooltipWrapper>
    );
};

// File: src/contexts/ModeContext.tsx
import React, {createContext, useContext, useState} from 'react';

export enum Mode {
    none,
    drawLine,
    drawRectangle,
    drawCircle,
    drawTriangle,
    drawAngle,
    select,
    editShape,
    drawPolyline,
    drawArrow,
    drawCustomSymbol,
    drawText
}

interface ModeContextProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextProps | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [mode, setModeState] = useState<Mode>(Mode.none);

    const setMode = (newMode: Mode) => {
        setModeState(prev => (prev === newMode ? Mode.none : newMode));
    };

    return (
        <ModeContext.Provider value={{mode, setMode}}>
            {children}
        </ModeContext.Provider>
    );
};

export const useMode = (): ModeContextProps => {
    const context = useContext(ModeContext);
    if (!context) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};

// File: src/hooks/useChartData.ts
import {useMemo} from 'react';
import {IndexRangePair, PriceRange, TimeRange} from "../types/Graph";
import {Interval} from "../types/Interval";
import {ChartRenderContext} from "../types/chartOptions";


export function useChartData(
    intervalsArray: Interval[],
    visibleRange: TimeRange,
    currentPoint: { x: number; y: number } | null,
    canvasWidth: number,
    canvasHeight: number
): { renderContext: ChartRenderContext | null; intervalSeconds: number } {
    const intervalSeconds = useMemo(() => {
        if (intervalsArray.length < 2) return 3600;
        return intervalsArray[1].t - intervalsArray[0].t;
    }, [intervalsArray]);

    const visibleCandles = useMemo<IndexRangePair>(() => {
        if (!intervalsArray.length || !visibleRange.end || intervalSeconds <= 0) {
            return {startIndex: 0, endIndex: 0};
        }
        const firstTime = intervalsArray[0].t;
        const startIndex = Math.floor((visibleRange.start - firstTime) / intervalSeconds);
        const endIndex = Math.ceil((visibleRange.end - firstTime) / intervalSeconds);
        return {
            startIndex: Math.max(0, startIndex),
            endIndex: Math.min(intervalsArray.length - 1, endIndex),
        };
    }, [intervalsArray, visibleRange, intervalSeconds]);

    const visiblePriceRange = useMemo<PriceRange>(() => {
        const {startIndex, endIndex} = visibleCandles;
        if (startIndex >= endIndex || !intervalsArray.length) {
            return {min: 0, max: 100, range: 100};
        }

        const candlesOnScreen = intervalsArray.slice(startIndex, endIndex + 1);

        let min = Infinity;
        let max = -Infinity;

        for (const candle of candlesOnScreen) {
            if (candle.l < min) min = candle.l;
            if (candle.h > max) max = candle.h;
        }

        const padding = (max - min) * 0.1;
        const finalMin = min - padding;
        const finalMax = max + padding;

        return {
            min: finalMin,
            max: finalMax,
            range: finalMax - finalMin,
        };
    }, [intervalsArray, visibleCandles]);

    const renderContext = useMemo<ChartRenderContext | null>(() => {
        if (canvasWidth === 0 || canvasHeight === 0) {
            return null;
        }
        return {
            allIntervals: intervalsArray,
            visibleStartIndex: visibleCandles.startIndex,
            visibleEndIndex: visibleCandles.endIndex,
            visiblePriceRange,
            visibleRange,
            intervalSeconds,
            canvasWidth,
            canvasHeight,
        };
    }, [
        intervalsArray,
        visibleCandles,
        visiblePriceRange,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight,
    ]);

    return {renderContext, intervalSeconds};
}

// File: src/hooks/useElementSize.ts
import {useLayoutEffect, useRef, useState} from "react";
import type {RefObject} from "react";
import type {CanvasSizes} from "../types/types";

interface UseElementSizeReturn<T extends HTMLElement> {
    ref: RefObject<T>;
    size: CanvasSizes;
}

/**
 * Measures an element's rendered size (CSS pixels, fractional allowed) using ResizeObserver.
 * - Returns a stable ref to attach to the measured element
 * - Updates on layout changes and window resize (covers DPR/zoom changes)
 */
export function useElementSize<T extends HTMLElement>(): UseElementSizeReturn<T> {
    const ref = useRef<T>(null!);
    const [size, setSize] = useState<CanvasSizes>({width: 0, height: 0});

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const measure = () => {
            const r = el.getBoundingClientRect();
            setSize((prev) => {
                const w = r.width;
                const h = r.height;
                if (prev.width === w && prev.height === h) return prev;
                return {width: w, height: h};
            });
        };

        measure();

        const ro = new ResizeObserver(() => {
            requestAnimationFrame(measure);
        });
        ro.observe(el);

        window.addEventListener("resize", measure);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    return {ref, size};
}

// File: src/hooks/usePanAndZoom.ts
import React, {useEffect, useRef} from 'react';
import {Interval} from "../types/Interval";
import {TimeRange} from "../types/Graph";

const PAN_SENSITIVITY = 1.0;
const ZOOM_SENSITIVITY = 0.1;
const WHEEL_END_DEBOUNCE = 150;

interface PanAndZoomHandlers {
    onPanStart: () => void;
    onPan: (dx: number) => void;
    onPanEnd: (dx: number) => void;
    onWheelStart: () => void;
    onWheelEnd: () => void;
}

export function usePanAndZoom(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    isEnabled: boolean,
    intervalsArray: Interval[],
    visibleRange: TimeRange,
    setVisibleRange: (range: TimeRange) => void,
    intervalSeconds: number,
    handlers: PanAndZoomHandlers,
    getCssWidth?: () => number,
) {
    const wheelingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const latestPropsRef = useRef({
        visibleRange,
        setVisibleRange,
        intervalsArray,
        intervalSeconds,
        handlers,
        getCssWidth,
    });

    useEffect(() => {
        latestPropsRef.current = {
            visibleRange,
            setVisibleRange,
            intervalsArray,
            intervalSeconds,
            handlers,
            getCssWidth,
        };
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isEnabled || intervalsArray.length === 0) return;

        const isPanningRef = {current: false};
        const lastPosRef = {x: 0, y: 0};

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            isPanningRef.current = true;
            lastPosRef.x = e.clientX;
            lastPosRef.y = e.clientY;
            latestPropsRef.current.handlers.onPanStart();
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;
            const {visibleRange, setVisibleRange, intervalsArray, intervalSeconds} = latestPropsRef.current;

            const dx = e.clientX - lastPosRef.x;
            const dy = e.clientY - lastPosRef.y;
            const delta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
            const canvas = canvasRef.current!;
            const cssWidth = latestPropsRef.current.getCssWidth?.() ?? canvas.getBoundingClientRect().width;
            const duration = visibleRange.end - visibleRange.start;
            const timePerPixel = cssWidth > 0 ? (duration / cssWidth) : 0;
            if (!isFinite(timePerPixel) || timePerPixel === 0) {
                lastPosRef.x = e.clientX;
                lastPosRef.y = e.clientY;
                return;
            }

            const timeOffset = -delta * timePerPixel * PAN_SENSITIVITY;
            let newStart = visibleRange.start + timeOffset;

            const dataStart = intervalsArray[0].t;
            const dataEnd = intervalsArray[intervalsArray.length - 1].t + intervalSeconds;
            const minStart = dataStart - (duration - intervalSeconds);
            const maxStart = dataEnd - intervalSeconds;

            newStart = Math.max(minStart, Math.min(newStart, maxStart));
            setVisibleRange({start: newStart, end: newStart + duration});

            lastPosRef.x = e.clientX;
            lastPosRef.y = e.clientY;
        };

        const stopPanning = () => {
            if (!isPanningRef.current) return;
            isPanningRef.current = false;
            latestPropsRef.current.handlers.onPanEnd(0);
        };

        const handleMouseUp = () => stopPanning();
        const handleMouseLeave = () => stopPanning();

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const {visibleRange, setVisibleRange, intervalsArray, intervalSeconds, handlers} = latestPropsRef.current;
            const isZoomGesture = e.ctrlKey || e.metaKey;

            if (isZoomGesture) {
                handlers.onWheelStart();
                if (wheelingTimeoutRef.current) {
                    clearTimeout(wheelingTimeoutRef.current!);
                }
                wheelingTimeoutRef.current = setTimeout(() => {
                    handlers.onWheelEnd();
                }, WHEEL_END_DEBOUNCE);

                const duration = visibleRange.end - visibleRange.start;
                const zoomAmount = -duration * ZOOM_SENSITIVITY * (e.deltaY / 100);
                if (Math.abs(e.deltaY) < 1) return;
                const rect = canvas.getBoundingClientRect();
                const cssWidth = latestPropsRef.current.getCssWidth?.() ?? rect.width;
                const mouseX = e.clientX - rect.left;
                const mouseRatio = cssWidth > 0 ? (mouseX / cssWidth) : 0.5;

                let newStart = visibleRange.start + zoomAmount * mouseRatio;
                let newEnd = visibleRange.end - zoomAmount * (1 - mouseRatio);

                const minDuration = (intervalsArray[1]?.t - intervalsArray[0]?.t || intervalSeconds) * 5;
                if (newEnd - newStart < minDuration) return;

                newStart = Math.max(newStart, intervalsArray[0].t);
                setVisibleRange({start: newStart, end: newEnd});
            } else {
                const duration = visibleRange.end - visibleRange.start;
                const cssWidth = latestPropsRef.current.getCssWidth?.() ?? canvas.getBoundingClientRect().width;
                const timePerPixel = cssWidth > 0 ? (duration / cssWidth) : 0;
                if (!isFinite(timePerPixel) || timePerPixel === 0) return;

                const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                const timeOffset = delta * timePerPixel * PAN_SENSITIVITY;
                let newStart = visibleRange.start + timeOffset;
                const dataStart = intervalsArray[0].t;
                const dataEnd = intervalsArray[intervalsArray.length - 1].t + intervalSeconds;
                const minStart = dataStart - (duration - intervalSeconds);
                const maxStart = dataEnd - intervalSeconds;

                newStart = Math.max(minStart, Math.min(newStart, maxStart));
                setVisibleRange({start: newStart, end: newStart + duration});
            }
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('wheel', handleWheel, {passive: false});

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('wheel', handleWheel);
            if (wheelingTimeoutRef.current) {
                clearTimeout(wheelingTimeoutRef.current!);
            }
        };
    }, [canvasRef, isEnabled]);
}

// File: src/index.ts
// Props and Types
export type {SimpleChartEdgeProps} from './components/SimpleChartEdge';
export type {Interval} from './types/Interval';
export type {TimeRange} from './types/Graph';
export type {ChartDimensionsData} from './types/Graph';
export type {OverlayWithCalc, OverlaySeries, OverlayOptions} from './types/overlay';
export type {ShapeBaseArgs, Drawing, ShapeType} from './components/Drawing/types';
export type {DrawingStyleOptions, DrawingPoint, CanvasPoint} from './types/Drawings';
export type {IDrawingShape} from './components/Drawing/IDrawingShape';


export type {
    LineShapeArgs,
    RectangleShapeArgs,
    CircleShapeArgs,
    TriangleShapeArgs,
    AngleShapeArgs,
    ArrowShapeArgs,
    PolylineShapeArgs,
    CustomSymbolShapeArgs
} from './types/Drawings';
// Enums
export {AxesPosition} from './types/types';
export {TimeDetailLevel, ChartType} from './types/chartOptions';
export {OverlayPriceKey, OverlayKind} from './types/overlay';

// Components
export {SimpleChartEdge} from './components/SimpleChartEdge';
export {ModeProvider, useMode} from './contexts/ModeContext';
export {withOverlayStyle, OverlaySpecs, overlay} from './components/Canvas/utils/drawOverlay';
export {GlobalStyle} from './styles/App.styles';
export {generateDrawingShapeId} from './components/Drawing/IDrawingShape';


// Drawing Shapes
export {CustomSymbolShape} from './components/Drawing/CustomSymbolShape';
export {LineShape} from './components/Drawing/LineShape';
export {RectangleShape} from './components/Drawing/RectangleShape';
export {CircleShape} from './components/Drawing/CircleShape';
export {TriangleShape} from './components/Drawing/TriangleShape';
export {AngleShape} from './components/Drawing/AngleShape';
export {ArrowShape} from './components/Drawing/ArrowShape';
export {Polyline} from './components/Drawing/Polyline';


// graph helpers
export {
    timeToX, xToTime, priceToY, yToPrice, interpolatedCloseAtTime, lerp, xFromCenter, xFromStart
} from './components/Canvas/utils/GraphHelpers';

// File: src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import {SimpleChartEdge} from './components/SimpleChartEdge';
import {ModeProvider} from './contexts/ModeContext';

const root = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <ModeProvider>
            <SimpleChartEdge/>
        </ModeProvider>
    </React.StrictMode>
);

// File: src/styles/App.styles.ts
import styled, { createGlobalStyle } from 'styled-components';

/**
 * Global styles applied to html, body and root element
 */
export const GlobalStyle = createGlobalStyle`
    html, body, #root {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        min-height: 0;
        min-width: 0;
        box-sizing: border-box;
        background-color: white;
    }
`;

export const MainAppWindow = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    min-height: fit-content;
    min-width: 0;
    box-sizing: border-box;
`;

export const LowerContainer = styled.div`
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
`;

export const ToolbarArea = styled.div`
    height: 100%;
    width: fit-content;
    box-sizing: border-box;
`;

export const ChartStageArea = styled.div`
    flex: 1 1 auto;
    padding: 5px;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

export const SettingsArea = styled.div`
  display: flex;
  flex-direction: row;
  height: fit-content;
  width: 100%;
`;

// File: src/styles/ChartCanvas.styles.ts
import styled from 'styled-components';

interface CanvasContainerProps {
    $heightPrecent: number;
    $zIndex?: number;
}

export const StyledCanvasNonResponsive = styled.canvas<CanvasContainerProps>`
    display: flex;
    width: 100% !important;
    height: ${({$heightPrecent}) => `${$heightPrecent}%`} !important;
    padding: 0;
    margin: 0;
    bottom: 0;
    background-color: transparent;
    border: none;
    touch-action: none;
    overscroll-behavior: none;
    font-size: 12px;
    position: absolute;
    z-index: ${({$zIndex}) => ($zIndex !== undefined ? $zIndex : 0)};
    pointer-events: none;
`;

export const StyledCanvasResponsive = styled.canvas<CanvasContainerProps>`
    display: flex;
    width: 100% !important;
    height: ${({$heightPrecent}) => `${$heightPrecent}%`} !important;
    padding: 0;
    margin: 0;
    bottom: 0;
    background-color: transparent;
    border: none;
    touch-action: none;
    overscroll-behavior: none;
    font-size: 12px;
    position: absolute;
    z-index: ${({$zIndex}) => ($zIndex !== undefined ? $zIndex : 0)};
    pointer-events: auto;
`;


interface InnerCanvasContainerProps {
    $xAxisHeight: number;
}

export const InnerCanvasContainer = styled.div<InnerCanvasContainerProps>`
    position: relative;
    width: 100%;
    height: 100%;
`;
export const ChartingContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

interface HoverTooltipProps {
    $isPositive: boolean;
}

export const HoverTooltip = styled.div<HoverTooltipProps>`
    position: absolute;
    bottom: 5px;
    right: 10px;
    opacity: 0.8;
    background-color: rgba(255, 255, 255, 0.4);
    padding: 6px 10px;
    color: ${({$isPositive}) => ($isPositive ? 'rgba(0,128,0,0.8)' : 'rgba(204,0,0,0.8)')};
    border: 1px solid ${({$isPositive}) => ($isPositive ? 'rgba(0,128,0,0.8)' : 'rgba(204,0,0,0.8)')};
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    gap: 10px;
    z-index: 50;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    pointer-events: none;
`;


// File: src/styles/ChartStage.styles.ts
import styled from 'styled-components';
import {windowSpread} from "../types/types";
import XAxis from "../components/Canvas/Axes/XAxis";

export const ChartStageContainer = styled.div`
    display: grid;
    flex: 1 1 auto;
    height: 100%;
    width: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
`;

export const TopBar = styled.div`
    grid-row: 1;
`;
export const LeftBar = styled.div`
    grid-column: 1;
`;

interface StageViewProps {
    $yAxisWidth: number,
    $xAxisHeight: number
}

export const ChartView = styled.div<StageViewProps>`
    display: grid;
    grid-template-columns: ${({$yAxisWidth}) => `${$yAxisWidth}px`} 1fr;
    grid-template-rows: 1fr ${({$xAxisHeight}) => `${$xAxisHeight}px`};
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
`;

interface XAxisProps {
    xAxisHeight?: number;
}

export const CanvasAxisContainer = styled.div<XAxisProps>`
    display: grid;
    grid-column: 2;
    grid-row: 1 / span 2;
    grid-template-rows: 1fr ${({xAxisHeight}) => (xAxisHeight ? `${xAxisHeight}px` : '30px')};
    grid-template-columns: 1fr;
    height: 100%;
    min-width: 0;
    min-height: 0;
    position: relative;
    box-sizing: border-box;
`;

export const LeftYAxisContainer = styled.div`
    flex: 0 0 auto;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    grid-column: 1;
    grid-row: 1 / span 1;
`;

export const RightYAxisContainer = styled.div`
    flex: 0 0 auto;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    grid-column: 2;
    grid-row: 1
`;


export const XAxisContainer = styled.div<XAxisProps>`
    grid-row: 2;
    grid-column: 1;
    height: ${({xAxisHeight}) => (xAxisHeight ? `${xAxisHeight}px` : '40px')};
    box-sizing: border-box;
`;

export const CanvasContainer = styled.div`
    grid-row: 1;
    grid-column: 1;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
`;

// File: src/styles/ChartTypeSelectDropdown.styles.ts
import styled from "styled-components";

export const ChartTypeSelectContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;
    width: 80px;
`;

export const ChartTypeTrigger = styled.div`
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    aspect-ratio: auto;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 0 8px;
    cursor: pointer;
    color: inherit;
    line-height: 0;
    overflow: visible;

    svg {
        width: 20px;
        height: 20px;
    }
`;

export const ChartTypeDropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    z-index: 10;
`;

export const ChartTypeOption = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: none;
    background: ${({$active}) => $active ? "rgba(120,130,255,0.15)" : "transparent"};
    cursor: pointer;

    &:hover {
        background: rgba(120, 130, 255, 0.25);
    }

    svg {
        width: 70%;
        height: 70%;
    }
`;

// File: src/styles/SettingsToolbar.styles.ts
import styled from 'styled-components';

export const SettingsToolbarContainer = styled.div.attrs({className: 'settings-toolbar-container'})`
    display: flex;
    flex-direction: row;
    width: 100%;
    background: transparent;
    border-radius: 14px;
    position: relative;
    height: clamp(30px, 6vh, 40px);
    border: 1px solid rgba(128, 140, 255, 0.18);
    box-shadow: 0 10px 28px rgba(17, 19, 39, 0.20),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
    overflow: hidden;
    flex: 0 0 auto;

`;

const Control = styled.div`
    height: 36px;
    border-radius: 10px;
    border: 1px solid transparent;
    background-color: rgba(255, 255, 255, 0.06);
    background-image: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65));
    background-origin: border-box;
    background-clip: padding-box, border-box;
    color: #e7ebff;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
    outline: none;
    transition: box-shadow 160ms ease, background 160ms ease, transform 120ms ease, border-color 160ms ease;

    &:hover {
        background-color: rgba(255, 255, 255, 0.09);
        background-image: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65));
    }

    &:focus-within, &:focus {
        box-shadow: 0 0 0 3px rgba(120, 130, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }
`;
export const SettingToolbarContent = styled.div.attrs({className: 'setting-toolbar-content'})`
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-start;
    overflow: hidden;
    gap: 2px;
    padding: 1px;
    flex: 0 0 auto;
`;

export const SymbolInput = styled(Control).attrs({as: 'input', type: 'text'})`
    width: 70px;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;
    background-color: white;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px 0 16px;

    &::placeholder {
        color: rgba(50, 60, 90, 0.70);
    }
`;

export const Spacer = styled.div.attrs({className: 'spacer'})`
    position: relative;
    display: inline-block;
    flex-grow: 1;
    min-width: 0;
`;
export const ToolbarHorizontalButtons = styled.button.attrs({className: 'toolbar-button'})`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: clamp(30px, 6vh, 40px);
    box-sizing: border-box;
    flex: 0 0 auto;
    padding: 0;
    margin: 0;
    overflow: hidden;
    text-align: center;
    font-size: 18px;
    cursor: pointer;
    outline: none;
    border-radius: 12px;
    border: 1px solid rgba(120, 100, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.06);
    background-clip: border-box, padding-box;

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        background: radial-gradient(120% 120% at 30% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(112, 124, 255, 0.08) 50%, rgba(32, 40, 78, 0.18) 100%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
        opacity: 0.9;
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(25, 30, 60, 0.25);
        background-color: rgba(255, 255, 255, 0.09);
        background-image: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65));
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 3px 10px rgba(25, 30, 60, 0.22), inset 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    /* Make inner SVG breathe inside the square */

    svg {
        width: 100%;
        height: 100%;
        display: block;
    }

    /* keep strokes readable on small sizes */

    svg * {
        vector-effect: non-scaling-stroke;
    }

    /* Icon background reacts on states */

    &:hover svg .icon-bg {
        fill: rgba(180, 200, 255, 0.30);
        stroke: rgba(120, 100, 255, 0.60);
    }
`;


// File: src/styles/Toolbar.styles.ts
import styled from 'styled-components';

export const ToolbarContainer = styled.div.attrs({className: 'toolbar-container'})`
    box-sizing: border-box;
    width: clamp(30px, 6vw, 40px); 
    display: flex;
    flex-direction: column;
    height: 100%;

    /* Transparent surface with subtle frame and depth */
    background: transparent;
    border-radius: 14px;
    position: relative;

    /* soft frame */
    border: 1px solid rgba(128, 140, 255, 0.18);
    box-shadow: 0 10px 28px rgba(17, 19, 39, 0.20),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
`;

export const ToolbarContent = styled.div.attrs({className: 'toolbar-content'})`
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    overflow: hidden;
    gap: 2px;
    padding: 1px;
`;

interface ToolbarButtonProps {
    $selected?: boolean;
}

export const ToolbarVerticalButton = styled.button.attrs({className: 'toolbar-button'})<ToolbarButtonProps>`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1 / 1;
    padding: 0;
    margin: 0;
    overflow: hidden;
    text-align: center;
    font-size: 18px;
    cursor: pointer;
    outline: none;
    border-radius: 12px;
    border: 1px solid rgba(120, 100, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.06);
    background-clip: border-box, padding-box;


    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        background: radial-gradient(120% 120% at 30% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(112, 124, 255, 0.08) 50%, rgba(32, 40, 78, 0.18) 100%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
        opacity: 0.9;
        pointer-events: none;

    }

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(25, 30, 60, 0.25);
        background-color: rgba(255, 255, 255, 0.09);
        background-image: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65));
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 3px 10px rgba(25, 30, 60, 0.22), inset 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    ${({$selected}) => $selected && `
        box-shadow: 0 10px 28px rgba(80, 90, 220, 0.35), 0 0 0 3px rgba(120, 130, 255, 0.28);
        &::after { opacity: 1; }
    `}
        /* Make inner SVG breathe inside the square */
    svg {
        width: 100%;
        height: 100%;
        display: block;
    }

    /* keep strokes readable on small sizes */

    svg * {
        vector-effect: non-scaling-stroke;
    }

    /* Icon background reacts on states */

    &:hover svg {
        fill: rgba(180, 200, 255, 0.30);
        stroke: rgba(120, 100, 255, 0.60);
    }
`;


// File: src/styles/Tooltip.styles.ts
import styled, {css} from 'styled-components';
import {Placement, TooltipAxis} from '../types/buttons';

export const TooltipWrapper = styled.span.attrs({className: 'tooltip-wrapper'})`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    line-height: 0;
    width: auto;
    height: auto;
    position: relative;
    flex: 0 0 auto;
`;

const bgGradLight =
    'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.96) 100%)';
const borderColorLight = 'rgba(123, 97, 255, 0.35)';
const textColorLight = '#1e2a44';
const shadowLight = '0 8px 24px rgba(17,19,39,0.18), inset 0 1px 0 rgba(255,255,255,0.45)';

export const TooltipBox = styled.span<{
    $left: number;
    $top: number;
    $transformCss: string;
    $bg: string;
    $border: string;
    $text: string;
    $shadow: string;
    $placement: Placement;
    $arrowSize?: number;
}>`
    position: fixed;
    z-index: 1000;
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    max-height: 100% !important;
    max-width: 100% !important;
    flex: 1 1 auto !important;
    ${({$placement}) =>
            $placement === Placement.left && css`padding-left: 14px;`}
    ${({$placement}) =>
            $placement === Placement.right && css`padding-right: 14px;`}
    /* For top and bottom, keep original vertical padding only (6px), no extra logic */
    border-radius: 10px;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    color: ${({$text}) => $text || textColorLight};
    background: ${({$bg}) => $bg || bgGradLight};
    border: 1px solid ${({$border}) => $border || borderColorLight};
    box-shadow: ${({$shadow}) => $shadow || shadowLight};
    backdrop-filter: blur(6px);
    pointer-events: none;
    left: ${({$left}) => $left}px;
    top: ${({$top}) => $top}px;
    transform: ${({$transformCss}) => $transformCss};
`;


export const TooltipArrow = styled.span<{
    $placement: Placement;
    $size: number;
    $bg: string;
    $border: string;
    $shadow: string;
    $anchorX?: number;
    $anchorY?: number;
}>`
    position: absolute;
    width: ${({$size}) => $size}px;
    height: ${({$size}) => $size}px;
    background: ${({$bg}) => $bg || bgGradLight};
    box-shadow: ${({$shadow}) => $shadow || shadowLight};
    pointer-events: none;
    transform: rotate(45deg);

    ${({$placement, $size, $border, $anchorX, $anchorY}) => {
        const borderCss = $border || borderColorLight;
        const half = $size / 2;
        switch ($placement) {
            case Placement.bottom:
                return css`
                    top: -${half}px;
                    left: ${$anchorX == null ? '50%' : `${$anchorX}px`};
                    transform: translateX(-50%) rotate(45deg);
                    border-left: 1px solid ${borderCss};
                    border-top: 1px solid ${borderCss};
                `;
            case Placement.top:
                return css`
                    bottom: -${half}px;
                    left: ${$anchorX == null ? '50%' : `${$anchorX}px`};
                    transform: translateX(-50%) rotate(45deg);
                    border-right: 1px solid ${borderCss};
                    border-bottom: 1px solid ${borderCss};
                `;
            case Placement.left:
                return css`
                    right: -${half}px;
                    top: ${$anchorY == null ? '50%' : `${$anchorY}px`};
                    transform: translateY(-50%) rotate(45deg);
                    border-right: 1px solid ${borderCss};
                    border-top: 1px solid ${borderCss};
                `;
            case Placement.right:
                return css`
                    left: -${half}px;
                    top: ${$anchorY == null ? '50%' : `${$anchorY}px`};
                    transform: translateY(-50%) rotate(45deg);
                    border-left: 1px solid ${borderCss};
                    border-bottom: 1px solid ${borderCss};
                `;
            default:
                return css``;
        }
    }}
`;

// File: src/styles/XAxis.styles.ts
import styled from 'styled-components';

interface StyledXAxisCanvasProps {
    $height: number;
}

export const StyledXAxisCanvas = styled.canvas<StyledXAxisCanvasProps>`
    display: flex;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
    padding: 0;
    margin: 0;
    background-color: transparent;
    border: none;
    pointer-events: none;
`;

// File: src/styles/YAxis.styles.ts
import styled from 'styled-components';
import {AxesPosition} from "../types/types";

interface StyledYAxisCanvasProps {
    $position: AxesPosition;
}

export const StyledYAxisCanvas = styled.canvas<StyledYAxisCanvasProps>`
    display: flex;
    width: 100%;
    height: 100% !important;
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
    padding: 0;
    margin: 0;
    background-color: transparent;
    border: none;
    pointer-events: none;
`;

// File: src/types/Drawings.ts
import {ShapeBaseArgs} from "../components/Drawing/types";

export interface DrawingPoint {
    time: number;
    price: number;
}

export interface CanvasPoint {
    x: number;
    y: number;
}


export interface DrawingStyleOptions {
    lineColor: string;
    lineWidth: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    fillColor: string; // such as 'rgba(255, 0, 0, 0.2)'

    selected: {
        lineColor: string;
        lineWidthAdd?: number;
        lineStyle?: 'solid' | 'dashed' | 'dotted';
        fillColor?: string;
    }
}

export type FinalDrawingStyle = {
    lineColor: string;
    lineWidth: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    fillColor: string | 'transparent';
};


export interface AngleShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface PolylineShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface LineShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface RectangleShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface CircleShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface TriangleShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface ArrowShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
}

export interface CustomSymbolShapeArgs extends ShapeBaseArgs {
    points: DrawingPoint[];
    symbol: string;
    size: number;
}

// File: src/types/Graph.ts
export interface TimeRange {
    start: number;
    end: number;
}

export interface Tick {
    position: number;
    label: string;
}

export interface PriceRange {
    min: number;
    max: number;
    range: number;
}

export interface DrawTicksOptions {
    tickHeight: number;
    tickColor: string;
    labelColor: string;
    labelFont: string;
    labelOffset: number;
    axisY: number;
}

export type IndexRangePair = {
    startIndex: number;
    endIndex: number;
}
export type ChartDimensionsData = {
    cssWidth: number;
    cssHeight: number;
    dpr: number;
    width: number;
    height: number;
    clientWidth: number;
    clientHeight: number;
}

// File: src/types/Interval.ts
export interface Interval {
    t: number;
    o: number;
    c: number;
    l: number;
    h: number;
    v?: number;
}

export interface CandleWithIndex extends Interval {
    index: number; // index in the original array
}

// File: src/types/buttons.ts
import type {ReactNode} from 'react';
import {Mode} from "../contexts/ModeContext";

export interface ModeButtonProps {
    mode: Mode;
    currentMode: Mode;
    onClickHandler: any;
    children?: ReactNode;
}

export interface ButtonProps {
    onClickHandler: any;
    children?: ReactNode;
}


export enum Placement {
    top,
    right,
    bottom,
    left,
    auto
}

export enum TooltipAlign {
    start,
    center,
    end
}

export enum TooltipAxis {
    horizontal,
    vertical
}

// File: src/types/chartOptions.ts
// chartOptions.ts

import {AxesOptions, AxesPosition, ChartTheme} from "./types";
import type {Interval} from "./Interval";
import type {TimeRange} from "./Graph";
import {OverlayCalcSpec, OverlayKind, OverlayOptions, OverlayWithCalc} from "./overlay";
import {DrawingStyleOptions} from "./Drawings";

export enum TimeDetailLevel {
    Auto = 'auto',
    Low = 'low',
    Medium = 'medium',
    High = 'high',
}

export enum ChartType {
    Candlestick = 'Candlestick',
    Line = 'Line',
    Area = 'Area',
    Bar = 'Bar',
}


export interface ChartRenderContext {
    allIntervals: Interval[];
    visibleStartIndex: number;
    visibleEndIndex: number;
    visibleRange: TimeRange;
    intervalSeconds: number;
    canvasWidth: number;
    canvasHeight: number;
}

export interface CandleStyleOptions {
    bullColor: string;
    bearColor: string;
    upColor: string;
    downColor: string;
    borderColor: string;
    borderWidth: number;
    bodyWidthFactor: number;
    spacingFactor: number;
}

export interface LineStyleOptions {
    color: string;
    lineWidth: number;
}

export interface AreaStyleOptions {
    fillColor: string;
    strokeColor: string;
    lineWidth: number;
}

export interface HistogramStyleOptions {
    bullColor: string;
    bearColor: string;
    opacity: number;
    heightRatio: number;
}

export interface BarStyleOptions {
    bullColor: string;
    bearColor: string;
    opacity: number;
}

export interface GridStyleOptions {
    color: string;
    lineWidth: number;
    gridSpacing: number;
    lineColor: string;
    lineDash: number[];
}

export interface AxesStyleOptions {
    axisPosition: AxesPosition;
    textColor: string;
    font: string;
    lineColor: string;
    lineWidth: number;
    numberLocale: string;
    dateLocale: string;
    numberFractionDigits: number; // Number of decimal places to format axis values
}

export type StyleOptions = {
    candles: CandleStyleOptions;
    line: LineStyleOptions;
    area: AreaStyleOptions;
    histogram: HistogramStyleOptions;
    bar: BarStyleOptions;
    grid: GridStyleOptions;
    overlay: OverlayOptions;
    axes: AxesStyleOptions;
    drawings: DrawingStyleOptions;
    showGrid: boolean;
    backgroundColor: string;
}

interface BaseChartOptions {
    chartType?: ChartType;
    theme: ChartTheme;
    showOverlayLine: boolean;
    showHistogram: boolean;
    style: StyleOptions;
    overlays?: OverlayWithCalc[];
    overlayKinds?: (OverlayKind | OverlayCalcSpec)[];
}

export type ChartOptions = {
    base: BaseChartOptions;
    axes: AxesOptions;
}


// File: src/types/overlay.ts
export type LinesStyle = 'solid' | 'dashed' | 'dotted';

export interface OverlayOptions {
    lineColor: string;
    lineWidth: number;
    lineStyle: LinesStyle;
}

export interface OverlayWithCalc extends OverlayOptions {
    calc: OverlayCalcSpec;
    connectNulls?: boolean;
    useCenterX?: boolean;
}

/**
 * Represents a fully computed overlay series, ready to be drawn on the canvas.
 */
export interface OverlaySeries {
    id?: string;
    source: (number | null)[]; // The array of calculated values, aligned with allIntervals.
    options: OverlayOptions;   // Styling options for the line.
    connectNulls: boolean;     // If true, draw a line over gaps (null values).
    useCenterX: boolean;       // If true, plot points at the center of the candle interval.
}

export enum OverlayPriceKey {
    close = 'close',
    open = 'open',
    high = 'high',
    low = 'low',
}

export enum OverlayKind {
    sma = 'sma',
    ema = 'ema',
    wma = 'wma',
    vwap = 'vwap',
    bbands_mid = 'bbands_mid',
    bbands_upper = 'bbands_upper',
    bbands_lower = 'bbands_lower',
}

export type OverlayCalcSpec =
    | { kind: OverlayPriceKey }
    | { kind: OverlayKind.sma | OverlayKind.ema | OverlayKind.wma; period: number; price?: OverlayPriceKey }
    | { kind: OverlayKind.vwap }
    | { kind: OverlayKind.bbands_mid; period: number; price?: OverlayPriceKey }
    | { kind: OverlayKind.bbands_upper; period: number; stddev?: number; price?: OverlayPriceKey }
    | { kind: OverlayKind.bbands_lower; period: number; stddev?: number; price?: OverlayPriceKey };


// File: src/types/types.ts
export enum AxesPosition {
    left,
    right,
}

export enum AlignOptions {
    left = 'left',
    center = 'center',
    right = 'right',
}

export type ChartTheme = 'light' | 'dark' | 'grey' | string;


export type AxesOptions = {
    yAxisPosition: AxesPosition;
    currency: string;
    numberOfYTicks: number;
}

export type CanvasSizes = {
    width: number;
    height: number;
}


export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<NonNullable<T[K]>> : T[K];
};

export type DeepRequired<T> = {
    [K in keyof T]-?: T[K] extends object ? DeepRequired<NonNullable<T[K]>> : NonNullable<T[K]>;
};


export type WindowSpreadOptions = {
    TOP_BAR_PX: number;
    LEFT_BAR_PX: number;
    INITIAL_X_AXIS_HEIGHT: number;
    INITIAL_Y_AXIS_WIDTH: number;
}
export const windowSpread: WindowSpreadOptions = {
    TOP_BAR_PX: 40,
    LEFT_BAR_PX: 40,
    INITIAL_X_AXIS_HEIGHT: 40,
    INITIAL_Y_AXIS_WIDTH: 50,
}


// File: src/utils/deepMerge.ts
// utils/deepMerge.ts
import type {DeepPartial, DeepRequired} from "../types/types";

export function deepMerge<T>(
    base: DeepRequired<T>,
    patch?: DeepPartial<T>
): DeepRequired<T> {
    if (!patch) return base;

    const out: any = Array.isArray(base) ? [...(base as any)] : {...(base as any)};

    for (const key in patch) {
        const v = (patch as any)[key];
        if (v === undefined) continue;

        const bv = (base as any)[key];

        if (
            v &&
            typeof v === "object" &&
            !Array.isArray(v) &&
            bv &&
            typeof bv === "object" &&
            !Array.isArray(bv)
        ) {
            out[key] = deepMerge(bv, v);
        } else {
            out[key] = v;
        }
    }

    return out as DeepRequired<T>;
}

// File: src/vite-env.d.ts
/// <reference types="vite/client" />


