import React, {useRef, useEffect, useState, useCallback, useMemo} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {StyledCanvas, InnerCanvasContainer, HoverTooltip} from '../../styles/ChartCanvas.styles';
import {ChartOptions, ChartType, ChartRenderContext} from "../../types/chartOptions";
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

    const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const hoverCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const histCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const backBufferRef = useRef<HTMLCanvasElement | null>(null);
    const histBackBufferRef = useRef<HTMLCanvasElement | null>(null);

    const rafIdRef = useRef<number | null>(null);
    const panOffsetRef = useRef(0);
    const currentPointRef = useRef<{ x: number; y: number } | null>(null);
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [isPanning, setIsPanning] = useState(false);
    const [isWheeling, setIsWheeling] = useState(false);
    const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState({width: 0, height: 0});

    useEffect(() => {
        if (mainCanvasRef.current) {
            const rect = mainCanvasRef.current.getBoundingClientRect();
            setCanvasDimensions({width: rect.width, height: rect.height});
        }
    }, []);

    const finalCanvasWidth = canvasSizes?.width ?? canvasDimensions.width;
    const finalCanvasHeight = canvasSizes?.height ?? canvasDimensions.height;

    const {renderContext, hoveredCandle, intervalSeconds} = useChartData(
        intervalsArray, visibleRange, hoverPoint, finalCanvasWidth, finalCanvasHeight
    );

    const panHandlers = useMemo(() => ({
        onPanStart: () => setIsPanning(true),
        onPan: (dx: number) => { /* To be implemented in Step 4 */
        },
        onPanEnd: (dx: number) => { /* To be implemented in Step 4 */
        },
        onWheelStart: () => setIsWheeling(true),
        onWheelEnd: () => setIsWheeling(false),
    }), [visibleRange, setVisibleRange]);

    const isInteractionMode = mode === Mode.none || mode === Mode.select;
    usePanAndZoom(hoverCanvasRef, isInteractionMode, intervalsArray, visibleRange, setVisibleRange, intervalSeconds, panHandlers);

    // --- Drawing Functions ---

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

        if (hctx && chartOptions.base.showHistogram) {
            const histHeight = hctx.canvas.height / dpr;
            hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            hctx.clearRect(0, 0, renderContext.canvasWidth, histHeight);
            hctx.imageSmoothingEnabled = false;
            drawHistogramChart(hctx, renderContext, chartOptions);
        }

        drawDrawings(ctx, drawings, selectedIndex);
    };

    const drawSceneToBuffer = useCallback(() => {
        const mainCanvas = mainCanvasRef.current;
        if (!mainCanvas || !renderContext) return;

        if (!backBufferRef.current) backBufferRef.current = document.createElement('canvas');
        const backBufferCtx = backBufferRef.current.getContext('2d');
        if (!backBufferCtx) return;

        let histBackBufferCtx: CanvasRenderingContext2D | null = null;
        if (chartOptions.base.showHistogram && histCanvasRef.current) {
            if (!histBackBufferRef.current) histBackBufferRef.current = document.createElement('canvas');
            histBackBufferCtx = histBackBufferRef.current.getContext('2d');
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.getBoundingClientRect();

        if (backBufferRef.current.width !== rect.width * dpr || backBufferRef.current.height !== rect.height * dpr) {
            backBufferRef.current.width = rect.width * dpr;
            backBufferRef.current.height = rect.height * dpr;
        }
        if (histBackBufferCtx && histBackBufferRef.current && histCanvasRef.current) {
            const hRect = histCanvasRef.current.getBoundingClientRect();
            if (histBackBufferRef.current.width !== hRect.width * dpr || histBackBufferRef.current.height !== hRect.height * dpr) {
                histBackBufferRef.current.width = hRect.width * dpr;
                histBackBufferRef.current.height = hRect.height * dpr;
            }
        }
        drawScene(backBufferCtx, histBackBufferCtx);
    }, [renderContext, chartType, chartOptions, drawings, selectedIndex]);

    const drawFrame = useCallback(() => {
        rafIdRef.current = null; // Allow scheduling the next frame

        const mainCanvas = mainCanvasRef.current;
        const backBuffer = backBufferRef.current;
        if (!mainCanvas || !backBuffer) return;
        const mainCtx = mainCanvas.getContext('2d');
        if (!mainCtx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = mainCanvas.getBoundingClientRect();

        if (mainCanvas.width !== rect.width * dpr || mainCanvas.height !== rect.height * dpr) {
            mainCanvas.width = rect.width * dpr;
            mainCanvas.height = rect.height * dpr;
        }

        mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        mainCtx.drawImage(backBuffer, -panOffsetRef.current * dpr, 0);

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
        // Drawing the hover layer will be added in the next step
    }, []);

    const scheduleDraw = useCallback(() => {
        if (rafIdRef.current) return;
        rafIdRef.current = requestAnimationFrame(drawFrame);
    }, [drawFrame]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => { /* ... */
    };
    const handleMouseLeave = () => { /* ... */
    };
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => { /* ... */
    };
    const handleMouseUp = () => { /* ... */
    };

    useEffect(() => {
        if (renderContext) {
            drawSceneToBuffer();
            scheduleDraw(); // Draw the initial frame
        }
    }, [renderContext, drawSceneToBuffer, scheduleDraw]);

    return (
        <InnerCanvasContainer $xAxisHeight={xAxisHeight}>
            <div style={{position: "relative", width: "100%", height: "100%"}}>
                <StyledCanvas
                    ref={mainCanvasRef}
                    className={"main-canvas"}
                    $heightPrecent={100}
                    style={{ position: "absolute", zIndex: 1, pointerEvents: "none"}}
                />

                {chartOptions.base.showHistogram && (
                    <StyledCanvas
                        ref={histCanvasRef}
                        className={"histogram-canvas"}
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
                    className={"draw-hover-canvas"}
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