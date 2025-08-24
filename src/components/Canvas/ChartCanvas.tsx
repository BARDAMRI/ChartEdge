import React, {useRef, useEffect, useState, useCallback} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import {StyledCanvas, InnerCanvasContainer, HoverTooltip} from '../../styles/ChartCanvas.styles';
import {ChartStyleOptions, ChartType} from "../../types/chartStyleOptions";
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

// Your drawing shape class imports (LineShape, RectangleShape, etc.) go here

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
    styleOptions: ChartStyleOptions;
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
                                                            styleOptions,
                                                            canvasSizes,
                                                            parentContainerRef,
                                                        }) => {
    const {mode} = useMode();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
                drawCandlestickChart(ctx, renderContext, styleOptions);
                break;
            case ChartType.Line:
                drawLineChart(ctx, renderContext, styleOptions);
                break;
            case ChartType.Area:
                drawAreaChart(ctx, renderContext, styleOptions);
                break;
            case ChartType.Bar:
                drawBarChart(ctx, renderContext, styleOptions);
                break;
            case ChartType.Histogram:
                drawHistogramChart(ctx, renderContext, styleOptions);
                break;
            default:
                drawCandlestickChart(ctx, renderContext, styleOptions);
                break;
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
    }, [renderContext, chartType, styleOptions, drawings, selectedIndex, isDrawing, startPoint, currentPoint, canvasSizes]);

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
            <StyledCanvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
            />
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