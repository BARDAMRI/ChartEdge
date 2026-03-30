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
    StyledCanvasResponsive,
} from '../../styles/ChartCanvas.styles';
import {
    ChartOptions,
    ChartRenderContext,
    ChartType,
    NumberNotation,
    PriceMetricKind,
} from "../../types/chartOptions";
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
import {AxesPosition, CanvasSizes, ChartTheme, DeepRequired, WindowSpreadOptions} from "../../types/types";
import {xToTime, yToPrice} from "./utils/GraphHelpers";
import {Drawing} from "../Drawing/types";
import {IDrawingShape} from "../Drawing/IDrawingShape";
import {createShape} from "../Drawing/drawHelper";
import {AngleShape} from '../Drawing/AngleShape';
import {TriangleShape} from '../Drawing/TriangleShape';
import {formatNumber, FormatNumberOptions} from './utils/formatters';
import {FormattingService} from '../../services/FormattingService';
import {getDateFnsLocale, getLocaleDefaults, translate} from '../../utils/i18n';
import {isWithinTradingSession} from '../../utils/timeUtils';
import {
    drawTickUpWatermark,
    loadTickUpWatermarkImages,
    TickUpWatermarkPlacement,
    type DrawWatermarkOptions,
    type TickUpWatermarkImages,
} from '../../branding/tickupWatermark';
import {isPrimeEngine} from '../../engines/prime/PrimeRenderer';
import {TICKUP_PRIME_PRIMARY, TICKUP_PRIME_SECONDARY} from '../../engines/prime/TickUpPrime';
function syncTriangleNormalization(shape: IDrawingShape | null, rc: ChartRenderContext | null, pr: PriceRange) {
    if (!shape || !rc) return;
    if (shape instanceof TriangleShape) {
        const timeSpan = rc.visibleRange.end - rc.visibleRange.start;
        shape.setNormalizationSpans(timeSpan, pr.range);
    }
}

function minPointsToCommit(mode: Mode): number {
    switch (mode) {
        case Mode.drawCustomSymbol:
            return 1;
        case Mode.drawTriangle:
            return 2;
        default:
            return 2;
    }
}

/** Single prominent watermark centered on the main chart area. */
function tickupWatermarkDrawOpts(
    brandTheme: ChartTheme,
    prime: boolean,
): DrawWatermarkOptions {
    const dark = brandTheme === ChartTheme.dark || brandTheme === ChartTheme.grey;
    // maxWidthFrac is intentionally omitted here so the global default in
    // tickupWatermark.ts (currently 0.70) applies.  Edit it there to resize.
    if (prime) {
        return {
            opacity: dark ? 0.18 : 0.13,
            placement: TickUpWatermarkPlacement.center,
            padding: 0,
        };
    }
    return {
        opacity: dark ? 0.32 : 0.20,
        placement: TickUpWatermarkPlacement.center,
        padding: 0,
    };
}

interface ChartCanvasProps {
    intervalsArray: Interval[];
    drawings: IDrawingShape[];
    setDrawings: (drawings: IDrawingShape[] | ((prev: IDrawingShape[]) => IDrawingShape[])) => void;
    selectedIndex: number | null;
    /** Hit-tested on mousedown in Select / Edit shape modes (top-most drawing wins). */
    setSelectedIndex?: (index: number | null) => void;
    /** Double-click shape, or context-menu on selected shape — opens properties UI. */
    onRequestShapeProperties?: (drawingIndex: number) => void;
    visibleRange: TimeRange;
    setVisibleRange: (range: TimeRange | ((prev: TimeRange) => TimeRange)) => void;
    visiblePriceRange: PriceRange;
    chartOptions: DeepRequired<ChartOptions>;
    canvasSizes: CanvasSizes;
    parentContainerRef?: React.RefObject<HTMLDivElement>;
    windowSpread: WindowSpreadOptions;
    /** Draw bundled TickUp marks inside plot / histogram (no DOM footer). */
    showBrandWatermark?: boolean;
    /** Matches chart `base.theme` for choosing light / dark / grey mark artwork. */
    brandTheme?: ChartTheme;
}

export interface ChartCanvasHandle {
    getCanvasSize(): { width: number; height: number; dpr: number };

    /** Main OHLC canvas (for snapshots); does not include histogram or drawings layers. */
    getMainCanvasElement(): HTMLCanvasElement | null;

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
        setSelectedIndex,
        onRequestShapeProperties,
        chartOptions,
        canvasSizes,
        parentContainerRef,
        windowSpread,
        showBrandWatermark = true,
        brandTheme = ChartTheme.light,
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
    /** Angle tool: 1 = placing first ray from vertex; 2 = placing second ray. */
    const angleDrawPhaseRef = useRef<1 | 2>(1);
    const [_, setChartDimensions] = React.useState<ChartDimensionsData | null>(null);
    const chartDimensionsRef = React.useRef<ChartDimensionsData | null>(null);
    const watermarkImagesRef = useRef<TickUpWatermarkImages | null>(null);
    const [watermarkImagesReady, setWatermarkImagesReady] = useState(0);
    const isInteractionMode =
        mode === Mode.none || mode === Mode.select || mode === Mode.editShape;
    /** Pan/zoom only in default mode so Select/Edit can click shapes without starting a drag. */
    const isPanZoomMode = mode === Mode.none;
    const {renderContext, intervalSeconds} = useChartData(
        intervalsArray, visibleRange, hoverPoint, canvasSizes.width, canvasSizes.height
    );

    const reseedDraftShape = useCallback(() => {
        if (mode === Mode.none || mode === Mode.select || mode === Mode.editShape) {
            createdShape.current = null;
            return;
        }
        createdShape.current = createShape({
            mode,
            args: undefined,
            style: chartOptions.base.style.drawings as DrawingStyleOptions,
        } as Drawing);
        if (mode === Mode.drawAngle) {
            angleDrawPhaseRef.current = 1;
        }
    }, [mode, chartOptions.base.style.drawings]);

    useEffect(() => {
        if (mode !== Mode.drawAngle) {
            angleDrawPhaseRef.current = 1;
        }
    }, [mode]);

    useEffect(() => {
        reseedDraftShape();
    }, [reseedDraftShape]);

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
            if (event.key !== 'Escape') {
                return;
            }
            if (mode === Mode.drawPolyline) {
                createdShape.current?.setPoints([]);
            }
            const inDrawTool =
                mode !== Mode.none &&
                mode !== Mode.select &&
                mode !== Mode.editShape;
            if (inDrawTool) {
                setMode(Mode.none);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [mode, setMode]);


    const drawBackBuffer = useCallback((backBufferCtx: any, dims: any, renderContext: any) => {
        const {cssWidth, cssHeight, dpr, width, height} = dims;
        if (backBufferRef.current!.width !== width || backBufferRef.current!.height !== height) {
            backBufferRef.current!.width = width;
            backBufferRef.current!.height = height;
        }
        backBufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        backBufferCtx.clearRect(0, 0, cssWidth, cssHeight);

        // Draw grid behind everything else
        drawGrid(backBufferCtx, cssWidth, cssHeight, chartOptions);

        if (showBrandWatermark && watermarkImagesRef.current) {
            const prime = isPrimeEngine(chartOptions);
            drawTickUpWatermark(
                backBufferCtx,
                cssWidth,
                cssHeight,
                brandTheme,
                watermarkImagesRef.current,
                tickupWatermarkDrawOpts(brandTheme, prime)
            );
        }

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
    }, [chartOptions, visiblePriceRange, showBrandWatermark, brandTheme]);

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
    const drawHistogramBuffer = useCallback((histBackBufferRef: any, dims: any, renderContext: any) => {
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
                // Watermark is shown on the main chart canvas only — not repeated on histogram
            }
        }
    }, [chartOptions, showBrandWatermark, brandTheme]);
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

            const showCross = chartOptions.base.showCrosshair;
            const showCrossVals = showCross && chartOptions.base.showCrosshairValues;

            if (showCross && isInteractionMode && point && !isPanning && !isWheeling) {
                const primeCross = isPrimeEngine(chartOptions);
                hoverCtx.save();
                hoverCtx.lineWidth = primeCross ? 1.5 : 1;
                if (primeCross) {
                    const gv = hoverCtx.createLinearGradient(point.x, 0, point.x, cssHeight);
                    gv.addColorStop(0, TICKUP_PRIME_PRIMARY);
                    gv.addColorStop(1, TICKUP_PRIME_SECONDARY);
                    hoverCtx.strokeStyle = gv;
                    hoverCtx.shadowColor = 'rgba(62, 197, 255, 0.35)';
                    hoverCtx.shadowBlur = 8;
                    hoverCtx.beginPath();
                    hoverCtx.moveTo(point.x, 0);
                    hoverCtx.lineTo(point.x, cssHeight);
                    hoverCtx.stroke();
                    hoverCtx.shadowBlur = 0;
                    const gh = hoverCtx.createLinearGradient(0, point.y, cssWidth, point.y);
                    gh.addColorStop(0, TICKUP_PRIME_PRIMARY);
                    gh.addColorStop(1, TICKUP_PRIME_SECONDARY);
                    hoverCtx.strokeStyle = gh;
                    hoverCtx.beginPath();
                    hoverCtx.moveTo(0, point.y);
                    hoverCtx.lineTo(cssWidth, point.y);
                    hoverCtx.stroke();
                    hoverCtx.beginPath();
                    hoverCtx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                    hoverCtx.strokeStyle = TICKUP_PRIME_PRIMARY;
                    hoverCtx.lineWidth = 2;
                    hoverCtx.stroke();
                    hoverCtx.beginPath();
                    hoverCtx.arc(point.x, point.y, 2.2, 0, Math.PI * 2);
                    hoverCtx.fillStyle = TICKUP_PRIME_SECONDARY;
                    hoverCtx.fill();
                } else {
                    hoverCtx.strokeStyle = chartOptions.base.style.axes?.lineColor || 'rgba(100, 100, 100, 0.7)';
                    hoverCtx.beginPath();
                    hoverCtx.moveTo(point.x, 0);
                    hoverCtx.lineTo(point.x, cssHeight);
                    hoverCtx.moveTo(0, point.y);
                    hoverCtx.lineTo(cssWidth, point.y);
                    hoverCtx.stroke();
                }
                hoverCtx.restore();

                if (showCrossVals && renderContext) {
                    const axes = chartOptions.base.style.axes;
                    const mouseTime = xToTime(point.x, renderContext.canvasWidth, renderContext.visibleRange);
                    const mousePrice = yToPrice(point.y, renderContext.canvasHeight, visiblePriceRange);
                    const timeStr = FormattingService.formatDate(new Date(mouseTime * 1000), axes);
                    const priceStr = FormattingService.formatPrice(mousePrice, axes);
                    const font = axes.font || '12px system-ui, sans-serif';
                    hoverCtx.font = font;
                    const isDarkPanel =
                        chartOptions.base.theme === ChartTheme.dark || chartOptions.base.theme === ChartTheme.grey;
                    const bgFill = isDarkPanel ? 'rgba(28, 30, 38, 0.9)' : 'rgba(255, 255, 255, 0.92)';
                    const fg = axes.textColor || (isDarkPanel ? '#e8eaef' : '#1f2328');
                    const pad = 4;
                    const axisOnLeft = chartOptions.axes.yAxisPosition === AxesPosition.left;

                    const tw = hoverCtx.measureText(timeStr).width;
                    const th = 12;
                    let tx = point.x;
                    const half = tw / 2 + pad;
                    if (tx + half > cssWidth - 2) tx = cssWidth - 2 - half;
                    if (tx - half < 2) tx = 2 + half;
                    const timeBoxW = tw + pad * 2;
                    const timeBoxH = th + pad * 2;
                    const timeBoxX = tx - timeBoxW / 2;
                    const timeBoxY = cssHeight - timeBoxH - 3;
                    hoverCtx.fillStyle = bgFill;
                    hoverCtx.fillRect(timeBoxX, timeBoxY, timeBoxW, timeBoxH);
                    hoverCtx.fillStyle = fg;
                    hoverCtx.textAlign = 'center';
                    hoverCtx.textBaseline = 'middle';
                    hoverCtx.fillText(timeStr, tx, timeBoxY + timeBoxH / 2);

                    hoverCtx.textAlign = axisOnLeft ? 'left' : 'right';
                    hoverCtx.textBaseline = 'middle';
                    const pw = hoverCtx.measureText(priceStr).width;
                    const priceBoxW = pw + pad * 2;
                    const priceBoxH = th + pad * 2;
                    const priceBoxX = axisOnLeft ? 3 : cssWidth - priceBoxW - 3;
                    const priceBoxY = point.y - priceBoxH / 2;
                    hoverCtx.fillStyle = bgFill;
                    hoverCtx.fillRect(priceBoxX, priceBoxY, priceBoxW, priceBoxH);
                    hoverCtx.fillStyle = fg;
                    hoverCtx.textAlign = 'center';
                    hoverCtx.fillText(priceStr, priceBoxX + priceBoxW / 2, point.y);
                }
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
        chartOptions,
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
        visiblePriceRange,
        drawBackBuffer,
        drawHistogramBuffer,
        watermarkImagesReady,
    ]);

    useEffect(() => {
        let cancelled = false;
        loadTickUpWatermarkImages().then((imgs) => {
            if (cancelled) {
                return;
            }
            watermarkImagesRef.current = imgs;
            setWatermarkImagesReady((v) => v + 1);
        });
        return () => {
            cancelled = true;
        };
    }, []);


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
        isPanZoomMode,
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
        setHoveredCandle(null);
        scheduleDraw();
    };
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!renderContext) return;

        const dims = chartDimensionsRef.current;
        if (!dims) return;
        const rect = e.currentTarget.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if ((mode === Mode.select || mode === Mode.editShape) && setSelectedIndex) {
            for (let i = drawings.length - 1; i >= 0; i--) {
                const s = drawings[i];
                if (s?.isHit(x, y, renderContext, visiblePriceRange)) {
                    setSelectedIndex(i);
                    return;
                }
            }
            setSelectedIndex(null);
            return;
        }

        if (isInteractionMode) return;

        const time = xToTime(x, renderContext!.canvasWidth, renderContext!.visibleRange);
        const price = yToPrice(y, renderContext!.canvasHeight, visiblePriceRange);
        const pt = {time, price};

        if (mode === Mode.drawAngle && angleDrawPhaseRef.current === 2) {
            return;
        }
        if (mode !== Mode.drawPolyline || createdShape.current?.points.length! >= 1) {
            createdShape.current?.setFirstPoint(pt);
            syncTriangleNormalization(createdShape.current, renderContext, visiblePriceRange);
        } else if (mode === Mode.drawPolyline && createdShape.current?.points.length === 1) {
            createdShape.current?.addPoint(pt);
        }
    };
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect(); // נשארת כדי לקבל מיקום ב-Viewport
        const point = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        currentPointRef.current = point;

        const isDrawingMode =
            !(mode === Mode.none || mode === Mode.select || mode === Mode.editShape) &&
            mode !== Mode.drawPolyline;
        if (isDrawingMode && createdShape.current && renderContext && (createdShape.current?.points.length ?? 0) > 0) {
            const endTime = xToTime(point.x, renderContext.canvasWidth, renderContext.visibleRange);
            const endPrice = yToPrice(point.y, renderContext.canvasHeight, visiblePriceRange);
            const pt = {time: endTime, price: endPrice};
            syncTriangleNormalization(createdShape.current, renderContext, visiblePriceRange);
            if (mode === Mode.drawAngle && createdShape.current instanceof AngleShape && angleDrawPhaseRef.current === 2) {
                createdShape.current.updateSecondRayEnd(pt);
            } else {
                createdShape.current?.updateLastPoint(pt);
            }
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
        syncTriangleNormalization(createdShape.current, renderContext, visiblePriceRange);

        if (mode === Mode.drawAngle && createdShape.current instanceof AngleShape) {
            const angleShape = createdShape.current;
            if (angleDrawPhaseRef.current === 1) {
                angleShape.updateLastPoint(endPoint);
                if (angleShape.getPoints().length < 2) {
                    return;
                }
                angleDrawPhaseRef.current = 2;
                scheduleDraw();
                return;
            }
            angleShape.updateSecondRayEnd(endPoint);
            if (angleShape.getPoints().length < 3) {
                return;
            }
            setDrawings(prev => [...prev, angleShape]);
            reseedDraftShape();
            return;
        }

        createdShape.current?.updateLastPoint(endPoint);
        const draft = createdShape.current!;
        const n = draft.getPoints().length;
        if (n < minPointsToCommit(mode)) {
            return;
        }
        setDrawings(prev => [...prev, draft]);
        reseedDraftShape();

    };
    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!renderContext) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (mode === Mode.drawPolyline && createdShape.current && currentPointRef.current) {
            const newDraw = createdShape.current!;
            setDrawings(prev => [...prev, newDraw]);
            reseedDraftShape();
            return;
        }

        if (
            (mode === Mode.none || mode === Mode.select || mode === Mode.editShape) &&
            onRequestShapeProperties
        ) {
            for (let i = drawings.length - 1; i >= 0; i--) {
                const s = drawings[i];
                if (s?.isHit(x, y, renderContext, visiblePriceRange)) {
                    setSelectedIndex?.(i);
                    onRequestShapeProperties(i);
                    e.preventDefault();
                    return;
                }
            }
        }
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (
            selectedIndex == null ||
            !onRequestShapeProperties ||
            !renderContext ||
            selectedIndex < 0 ||
            selectedIndex >= drawings.length
        ) {
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const s = drawings[selectedIndex];
        if (s?.isHit(x, y, renderContext, visiblePriceRange)) {
            e.preventDefault();
            onRequestShapeProperties(selectedIndex);
        }
    };
    const handleWheelBlock: React.WheelEventHandler<HTMLCanvasElement> = (e) => {
        if (!isPanZoomMode) {
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
        getMainCanvasElement() {
            return mainCanvasRef.current;
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
                    onContextMenu={handleContextMenu}
                    $heightPrecent={100}
                    $zIndex={4}
                    style={{
                        cursor: isPanZoomMode
                            ? (isPanning ? 'grabbing' : 'grab')
                            : mode === Mode.select || mode === Mode.editShape
                                ? 'default'
                                : 'crosshair',
                        backgroundColor: 'transparent',
                    }}
                />
            </ChartingContainer>

            {chartOptions.base.showCandleTooltip &&
                hoveredCandle &&
                !isPanning &&
                !mode &&
                !isWheeling && (
                <HoverTooltip
                    className={'intervals-data-tooltip'}
                    $isPositive={hoveredCandle.c > hoveredCandle.o}
                    $isRTL={getLocaleDefaults(chartOptions.base.style.axes.locale).direction === 'rtl'}
                    $variant={chartOptions.base.theme === ChartTheme.dark || chartOptions.base.theme === ChartTheme.grey ? ChartTheme.dark : ChartTheme.light}
                    $compact={canvasSizes.width < 440 || canvasSizes.height < 280}
                    title={(() => {
                        const axes = chartOptions.base.style.axes;
                        const lang = axes.language || 'en';
                        const c = hoveredCandle;
                        const parts = [
                            FormattingService.formatDate(new Date(c.t * 1000), axes),
                            `${translate('open', lang)} ${FormattingService.formatPrice(c.o, axes)}`,
                            `${translate('high', lang)} ${FormattingService.formatPrice(c.h, axes)}`,
                            `${translate('low', lang)} ${FormattingService.formatPrice(c.l, axes)}`,
                            `${translate('close', lang)} ${FormattingService.formatPrice(c.c, axes)}`,
                        ];
                        if (c.v !== undefined) {
                            parts.push(
                                `${translate('volume', lang)} ${FormattingService.formatPrice(c.v, {
                                    ...axes,
                                    numberNotation: NumberNotation.compact,
                                } as any)}`
                            );
                        }
                        return parts.join(' · ');
                    })()}
                >
                    {(() => {
                        const axes = chartOptions.base.style.axes;
                        const lang = axes.language || 'en';
                        const chartBaseTheme = chartOptions.base.theme;
                        const isDarkPanel = chartBaseTheme === ChartTheme.dark || chartBaseTheme === ChartTheme.grey;
                        const change = hoveredCandle.c - hoveredCandle.o;
                        const changePercent = change / hoveredCandle.o;
                        const changeColor = isDarkPanel
                            ? (change >= 0 ? '#7ee2b8' : '#ff9e9e')
                            : (change >= 0 ? 'green' : 'red');
                        const dateStr = FormattingService.formatDate(new Date(hoveredCandle.t * 1000), axes);
                        const compact = canvasSizes.width < 440 || canvasSizes.height < 280;
                        const divider = isDarkPanel ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.1)';
                        const gridStyle: React.CSSProperties = compact
                            ? {
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '2px 8px',
                                  alignItems: 'baseline',
                                  width: '100%',
                              }
                            : {
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '4px 12px',
                                  alignItems: 'baseline',
                                  width: '100%',
                              };

                        return (
                            <>
                                <div
                                    style={{
                                        fontWeight: 'bold',
                                        borderBottom: divider,
                                        marginBottom: compact ? 2 : 4,
                                        paddingBottom: 2,
                                    }}
                                >
                                    {dateStr}
                                </div>
                                <div style={gridStyle}>
                                    <span>
                                        {translate('open', lang)}: {FormattingService.formatPrice(hoveredCandle.o, axes)}
                                    </span>
                                    <span>
                                        {translate('high', lang)}: {FormattingService.formatPrice(hoveredCandle.h, axes)}
                                    </span>
                                    <span>
                                        {translate('low', lang)}: {FormattingService.formatPrice(hoveredCandle.l, axes)}
                                    </span>
                                    <span>
                                        {translate('close', lang)}: {FormattingService.formatPrice(hoveredCandle.c, axes)}
                                    </span>
                                </div>
                                <div style={{marginTop: compact ? 2 : 4}}>
                                    {translate('change', lang)}:{' '}
                                    <span style={{color: changeColor, fontWeight: 'bold'}}>
                                        {FormattingService.formatPrice(change, {
                                            ...axes,
                                            metricType: PriceMetricKind.pnl,
                                            showSign: true,
                                        } as any)}{' '}
                                        (
                                        {FormattingService.formatPrice(changePercent, {
                                            ...axes,
                                            useCurrency: false,
                                            unit: '%',
                                            maximumFractionDigits: 2,
                                            showSign: true,
                                        } as any)}
                                        )
                                    </span>
                                </div>
                                {hoveredCandle.v !== undefined && (
                                    <div
                                        style={{
                                            fontSize: compact ? 10 : 11,
                                            opacity: isDarkPanel ? 0.88 : 0.8,
                                            marginTop: compact ? 2 : 4,
                                        }}
                                    >
                                        {translate('volume', lang)}:{' '}
                                        {FormattingService.formatPrice(hoveredCandle.v, {
                                            ...axes,
                                            numberNotation: NumberNotation.compact,
                                        } as any)}
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