import React, {useRef, useEffect, useState, useCallback} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {StyledCanvas, InnerCanvasContainer, HoverTooltip} from '../../styles/ChartCanvas.styles';
import {ChartType} from "../../types/chartStyleOptions";
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
import {ChartOptions} from "../../types/types";


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
    chartOptions: ChartOptions;
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
                                                            parentContainerRef,
                                                        }) => {
    const {mode} = useMode();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const histCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Controlled/uncontrolled support for histogram visibility
    const [internalShowHistogram, setInternalShowHistogram] = useState<boolean>(chartOptions?.base?.showHistogram ?? true);

    useEffect(() => {
        setInternalShowHistogram(chartOptions?.base?.showHistogram ?? false);
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
        const canvas = canvasRef.current;
        if (!canvas || !renderContext) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

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
            // case ChartType.Histogram:
            //     drawHistogramChart(ctx, renderContext, chartOptions);
            //     break;
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
    }, [renderContext, chartType, chartOptions, drawings, selectedIndex, isDrawing, startPoint, currentPoint, canvasSizes, internalShowHistogram]);

    useEffect(() => {
        drawAll();
    }, [drawAll]);

    // --- Event Handlers for Mouse Position and Drawing ---

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCurrentPoint({x: e.clientX - rect.left, y: e.clientY - rect.top});
    };

    const handleMouseLeave = () => {
        setCurrentPoint(null);
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
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(false);
        setStartPoint(null);
    };

    return (
        <InnerCanvasContainer $xAxisHeight={xAxisHeight}>
            {(() => {
                // Clamp ratio between 0.1 and 0.6
                const ratioRaw = chartOptions?.base?.histogramHeightRatio ?? 0.30;
                const ratio = Math.max(0.1, Math.min(0.6, ratioRaw));
                const histHeight = `${Math.round(ratio * 100)}%`;
                const histOpacity = chartOptions?.base?.histogramOpacity ?? 0.5;
                return (
                    <div style={{position: "relative", width: "100%", height: "100%"}}>
                        {/* Main chart fills all available space */}
                        <StyledCanvas
                            ref={canvasRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            style={{position: "absolute", backgroundColor:'transparent', inset: 0, width: "100%", height: "100%", zIndex: 1}}
                        />

                        {/* Histogram canvas overlays the bottom part only */}
                        {internalShowHistogram && (
                            <StyledCanvas
                                ref={histCanvasRef}
                                style={{
                                    position: "absolute",
                                    opacity: histOpacity,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: histHeight,
                                    width: "100%",
                                    pointerEvents: "none" // don't block interactions on main canvas
                                }}
                            />
                        )}
                    </div>
                );
            })()}
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