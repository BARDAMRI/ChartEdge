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

    // --- Canvas Layers ---
    const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const hoverCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const histCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // --- Offscreen Buffers (will be used later) ---
    const backBufferRef = useRef<HTMLCanvasElement | null>(null);
    const histBackBufferRef = useRef<HTMLCanvasElement | null>(null);

    // --- State & Refs ---
    const rafIdRef = useRef<number | null>(null);
    const panOffsetRef = useRef(0);
    const currentPointRef = useRef<{ x: number; y: number } | null>(null);
    const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [isPanning, setIsPanning] = useState(false);
    const [isWheeling, setIsWheeling] = useState(false);
    const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState({width: 0, height: 0});

    // --- Hooks ---
    useEffect(() => {
        if (mainCanvasRef.current) {
            const rect = mainCanvasRef.current!.getBoundingClientRect();
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

    // --- Drawing Functions (to be implemented in next steps) ---

    const drawSceneToBuffer = useCallback(() => {
        // Will be implemented in Step 2
    }, [renderContext]);

    const drawFrame = useCallback(() => {
        // Will be implemented in Step 3
    }, []);

    const scheduleDraw = useCallback(() => {
        // Will be implemented in Step 3
    }, [drawFrame]);

    // --- Event Handlers (to be implemented in Step 4) ---

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => { /* ... */
    };
    const handleMouseLeave = () => { /* ... */
    };
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => { /* ... */
    };
    const handleMouseUp = () => { /* ... */
    };

    // --- Effects (to be implemented) ---
    useEffect(() => {
        // Main effect to trigger buffer redraw when data changes
    }, [renderContext, drawSceneToBuffer, scheduleDraw]);

    return (
        <InnerCanvasContainer $xAxisHeight={xAxisHeight}>
            <div style={{position: "relative", width: "100%", height: "100%"}}>
                {/* Layer 1: Main Chart Data (rendered from back-buffer) */}
                <StyledCanvas
                    ref={mainCanvasRef}
                    style={{position: "absolute", zIndex: 1, pointerEvents: "none"}}
                />

                {/* Layer 2: Histogram */}
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

                {/* Layer 3: Hover and Drawing Interaction (receives all mouse events) */}
                <StyledCanvas
                    ref={hoverCanvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
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