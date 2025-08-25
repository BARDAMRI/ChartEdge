import React, {useRef, useEffect, useState, useCallback} from 'react';
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
    chartOptions: DeepRequired<ChartOptions>
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

    // --- Performance Optimization Refs ---
    const rafIdRef = useRef<number | null>(null);
    const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
    const tickingRef = useRef(false);


    // Controlled/uncontrolled support for histogram visibility
    const [internalShowHistogram, setInternalShowHistogram] = useState<boolean>(chartOptions?.base?.showHistogram ?? true);

    useEffect(() => {
        setInternalShowHistogram(chartOptions.base.showHistogram ?? false);
    }, [chartOptions?.base?.showHistogram]);

    const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);

    // HOOK for data calculations
    const {renderContext, hoveredCandle} = useChartData(
        intervalsArray,
        visibleRange,
        currentPoint,
        (canvasSizes?.width ?? canvasRef.current?.clientWidth ?? 0)
    );

    // HOOK for pan and zoom interactions
    const isInteractionMode = mode === Mode.none || mode === Mode.select;
    usePanAndZoom(canvasRef, isInteractionMode, intervalsArray, visibleRange, setVisibleRange, renderContext.intervalSeconds);

    const drawAll = useCallback(() => {
        // --- RAF: Process pending mouse point before drawing ---
        if (tickingRef.current) {
            setCurrentPoint(pendingPointRef.current);
            tickingRef.current = false;
        }

        const canvas = canvasRef.current;
        if (!canvas || !renderContext) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- Performance: Disable image smoothing for sharper panning ---
        ctx.imageSmoothingEnabled = false;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.clearRect(0, 0, rect.width, rect.height);

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

        // --- Histogram layer (separate canvas stacked below) ---
        if (internalShowHistogram) {
            const histCanvas = histCanvasRef.current;
            if (histCanvas) {
                const hctx = histCanvas.getContext('2d');
                if (hctx) {
                    hctx.imageSmoothingEnabled = false; // Also disable for histogram
                    const hDpr = window.devicePixelRatio || 1;
                    const hRect = histCanvas.getBoundingClientRect();
                    if (histCanvas.width !== hRect.width * hDpr || histCanvas.height !== hRect.height * hDpr) {
                        histCanvas.width = hRect.width * hDpr;
                        histCanvas.height = hRect.height * hDpr;
                        hctx.setTransform(hDpr, 0, 0, hDpr, 0, 0);
                    }
                    hctx.clearRect(0, 0, hRect.width, hRect.height);
                    drawHistogramChart(hctx, renderContext, chartOptions);
                }
            }
        }

        drawDrawings(ctx, drawings, selectedIndex);

        if (isDrawing && startPoint && currentPoint) {
            let shape = null;
            switch (mode) {
                case Mode.drawLine:
                    shape = new LineShape(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y);
                    break;
                case Mode.drawRectangle:
                    shape = new RectangleShape(
                        startPoint.x,
                        startPoint.y,
                        currentPoint.x - startPoint.x,
                        currentPoint.y - startPoint.y
                    );
                    break;
                case Mode.drawCircle:
                    shape = new CircleShape(
                        startPoint.x,
                        startPoint.y,
                        currentPoint.x,
                        currentPoint.y,
                        'black',
                        2
                    );
                    break;
                case Mode.drawTriangle:
                    shape = new TriangleShape(startPoint.x, startPoint.y, currentPoint.x, currentPoint.y);
                    break;
                case Mode.drawAngle:
                    shape = new AngleShape(
                        startPoint.x,
                        startPoint.y,
                        currentPoint.x,
                        currentPoint.y,
                        startPoint.x + 10,
                        startPoint.y,
                        'black',
                        2
                    );
                    break;
            }
            if (shape) {
                shape.draw(ctx);
                ctx.stroke();
            }
        }
    }, [renderContext, chartType, chartOptions, drawings, selectedIndex, isDrawing, startPoint, currentPoint, internalShowHistogram]);

    // --- RAF-based draw scheduler ---
    const scheduleDraw = useCallback(() => {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current!);
        }
        rafIdRef.current = requestAnimationFrame(drawAll);
    }, [drawAll]);

    useEffect(() => {
        scheduleDraw();
        // --- Cleanup RAF on unmount ---
        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current!);
            }
        };
    }, [scheduleDraw]);


    // --- Event Handlers for Mouse Position and Drawing ---

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // --- Throttle: Store position in ref instead of state ---
        pendingPointRef.current = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        if (!tickingRef.current) {
            tickingRef.current = true;
            scheduleDraw();
        }
    };

    const handleMouseLeave = () => {
        // --- Throttle: Store position in ref instead of state ---
        pendingPointRef.current = null;
        if (!tickingRef.current) {
            tickingRef.current = true;
            scheduleDraw();
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (mode === Mode.none) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (mode === Mode.select) {
            return;
        }

        setStartPoint({x, y});
        setIsDrawing(true);
        scheduleDraw(); // Schedule a draw on interaction
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint) return;
        setIsDrawing(false);
        setStartPoint(null);
        scheduleDraw(); // Schedule a final draw
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

            {hoveredCandle && (
                <HoverTooltip $isPositive={hoveredCandle.c > hoveredCandle.o}>
                    Time: {new Date(hoveredCandle.t * 1000).toLocaleString()} |
                    O: {hoveredCandle.o} | H: {hoveredCandle.h} | L: {hoveredCandle.l} | C: {hoveredCandle.c}
                    {hoveredCandle.v !== undefined && ` | V: ${hoveredCandle.v}`}
                </HoverTooltip>
            )}
        </InnerCanvasContainer>
    );
};