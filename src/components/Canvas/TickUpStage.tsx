import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react';
import { ChartCanvas, ChartCanvasHandle } from './ChartCanvas';
import XAxis from "./Axes/XAxis";
import YAxis from "./Axes/YAxis";
import {
    CanvasAxisContainer,
    CanvasContainer,
    TickUpStageContainer,
    ChartView,
    CompactSymbolStrip,
    YAxisContainer,
    XAxisContainer,
    TopBar,
    LeftBar,
    FloatingSettingsButton
} from '../../styles/TickUpStage.styles';
import { PriceRange, TimeRange } from "../../types/Graph";
import { Interval } from "../../types/Interval";
import { ChartOptions, ChartType, TickUpRenderEngine, TimeDetailLevel } from "../../types/chartOptions";
import { AxesPosition, DeepRequired, windowSpread, ChartTheme } from "../../types/types";
import { useElementSize } from '../../hooks/useElementSize';
import { findPriceRange, getBarIntervalSeconds } from "./utils/helpers";
import { IDrawingShape } from "../Drawing/IDrawingShape";
import {
    applyDrawingPatch,
    drawingFromSpec,
    isDrawingPatch,
    validateAndNormalizeShape,
    type DrawingInput,
    type DrawingPatch,
    type DrawingSpec,
} from "../Drawing/drawHelper";
import { ShapePropertiesModal } from '../ShapePropertiesModal/ShapePropertiesModal';
import {
    applyShapePropertiesForm,
    type ShapePropertiesFormState,
} from '../ShapePropertiesModal/applyShapeProperties';
import { Toolbar } from '../Toolbar/Toolbar';
import { SettingsToolbar } from '../Toolbar/SettingsToolbar';
import { IconGear } from "../Toolbar/icons";
import { Mode, useMode } from '../../contexts/ModeContext';
import type { LiveDataPlacement, LiveDataApplyResult } from "../../types/liveData";
import type { ChartContextInfo } from "../../types/chartContext";
import {
    filterDrawingInstances,
    queryDrawingsToSnapshots,
    shapeToSnapshot,
    type DrawingQuery,
    type DrawingSnapshot,
} from "../Drawing/drawingQuery";
import { applyLiveDataMerge } from "../../utils/liveDataMerge";
import {
    buildChartSnapshotFileName,
    captureChartRegionToPngDataUrl,
    type ChartSnapshotMeta,
} from "../../utils/captureChartRegion";

function escapeCsvCell(value: string): string {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function intervalsToCsv(rows: Interval[]): string {
    const header = ['t', 'o', 'h', 'l', 'c', 'v'].map(escapeCsvCell).join(',');
    const body = rows.map((r) =>
        [r.t, r.o, r.h, r.l, r.c, r.v ?? ''].map((x) => escapeCsvCell(String(x))).join(',')
    );
    return [header, ...body].join('\r\n');
}


function getIntervalSeconds(arr: Interval[], fallbackSeconds = 60): number {
    return getBarIntervalSeconds(arr, fallbackSeconds);
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

export interface TickUpStageProps {
    intervalsArray: Interval[];
    numberOfYTicks: number;
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
    selectedIndex: number | null;
    setSelectedIndex?: (index: number | null) => void;
    chartOptions: DeepRequired<ChartOptions>;
    showTopBar?: boolean;
    showLeftBar?: boolean;
    handleChartTypeChange: (newType: ChartType) => void;
    openSettingsMenu: () => void;
    showSettingsBar: boolean;
    /** Called when the toolbar refresh control is used; parent can reload remote data. */
    onRefreshRequest?: () => void | Promise<void>;
    /** Toggles app/chart theme (wired from host, e.g. TickUp shell). */
    onToggleTheme?: () => void;
    symbol?: string;
    defaultSymbol?: string;
    onSymbolChange?: (symbol: string) => void;
    onSymbolSearch?: (symbol: string) => void | boolean | Promise<void | boolean>;
    /** Sync with app chart theme for fullscreen modals */
    themeVariant?: ChartTheme;
    /**
     * Renders the TickUp mark inside the plot/histogram canvases (no extra layout height).
     * When false, no in-chart branding is drawn.
     */
    showBrandWatermark?: boolean;
}

export interface TickUpStageHandle {
    /** Accepts a shape class instance or a plain {@link DrawingSpec} (`{ type, points, style?, id? }`). */
    addShape: (shape: DrawingInput) => void;
    /**
     * Full replace: pass an instance or a {@link DrawingSpec} (id in spec is ignored; {@code shapeId} wins).
     * Partial update: pass a {@link DrawingPatch} only (`{ style?, points?, symbol?, size? }`) — same as {@link patchShape}.
     */
    updateShape: (shapeId: string, newShape: DrawingInput | DrawingPatch) => void;
    /** Merge geometry/style into the drawing with the given id (in-place mutation + state refresh). */
    patchShape: (shapeId: string, patch: DrawingPatch) => void;
    /** Replace all drawings with instances built from specs (e.g. hydrate from saved JSON). */
    setDrawingsFromSpecs: (specs: DrawingSpec[]) => void;
    deleteShape: (shapeId: string) => void;
    addInterval: (interval: Interval) => void;
    updateInterval: (index: number, newInterval: Interval) => void;
    deleteInterval: (index: number) => void;
    applyLiveData: (updates: Interval | Interval[], placement: LiveDataPlacement) => LiveDataApplyResult;
    /** Pans/zooms the time axis so the full loaded series is visible. */
    fitVisibleRangeToData: () => void;
    /**
     * If the last bar sits past the right edge of the visible window, pans the window right by the
     * smallest amount that brings it into view while keeping the same time span when possible.
     * No-op when the latest data is already visible — avoids the jump of {@link fitVisibleRangeToData}.
     */
    nudgeVisibleTimeRangeToLatest: (options?: { trailingPaddingSec?: number }) => void;
    getMainCanvasElement: () => HTMLCanvasElement | null;
    getViewInfo: () => {
        intervals: Interval[];
        drawings: IDrawingShape[];
        visibleRange: TimeRange & { startIndex: number; endIndex: number };
        visiblePriceRange: PriceRange;
        canvasSize: { width: number; height: number; dpr: number };
    };
    /** Plain snapshots (safe to JSON.stringify). Omit query to return all, in z-order. */
    getDrawings: (query?: DrawingQuery) => DrawingSnapshot[];
    getDrawingById: (id: string) => DrawingSnapshot | null;
    /** Live shape instances matching the query (same references as chart state). */
    getDrawingInstances: (query?: DrawingQuery) => IDrawingShape[];
    /** Layout, visible ranges, symbol, canvas metrics — for host analysis. */
    getChartContext: () => ChartContextInfo;
    getCanvasSize: () => { width: number; height: number; dpr: number };
    clearCanvas: () => void;
    redrawCanvas: () => void;
    reloadCanvas: () => void;
    /** Same behavior as the package drawing toolbar; requires {@link ModeProvider} above the stage. */
    setInteractionMode: (mode: Mode) => void;
    /** Deletes the shape at {@link selectedIndex}, if any, and clears selection. */
    deleteSelectedDrawing: () => void;
}

export const TickUpStage = forwardRef<TickUpStageHandle, TickUpStageProps>(({
    intervalsArray,
    numberOfYTicks,
    timeDetailLevel,
    timeFormat12h, selectedIndex,
    setSelectedIndex,
    chartOptions,
    showTopBar = true,
    showLeftBar = true,
    handleChartTypeChange,
    openSettingsMenu,
    showSettingsBar,
    onRefreshRequest,
    onToggleTheme,
    symbol,
    defaultSymbol,
    onSymbolChange,
    onSymbolSearch,
    themeVariant = ChartTheme.dark,
    showBrandWatermark = true,
}, ref) => {
    const { setMode } = useMode();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { ref: canvasAreaRef, size: canvasSizes } = useElementSize<HTMLDivElement>();
    const [intervals, setIntervals] = useState<Interval[]>(intervalsArray);
    const [visibleRange, setVisibleRange] = React.useState<TimeRange & {
        startIndex: number,
        endIndex: number
    }>({ start: 0, end: 0, startIndex: 0, endIndex: 0 });
    const [visiblePriceRange, setVisiblePriceRange] = React.useState<PriceRange>({
        min: Math.min(...intervalsArray.map(inter => inter?.l || 0)),
        max: Math.max(...intervalsArray.map(inter => inter?.h || 0)),
        range: Math.max(...intervalsArray.map(inter => inter?.h || 0)) - Math.min(...intervalsArray.map(inter => inter?.l || 0))
    });
    const [drawings, setDrawings] = useState<IDrawingShape[]>([]);
    const [shapePropsOpen, setShapePropsOpen] = useState(false);
    const [shapePropsIndex, setShapePropsIndex] = useState<number | null>(null);
    const canvasRef = useRef<ChartCanvasHandle | null>(null);
    const chartViewRef = useRef<HTMLDivElement | null>(null);
    const symbolInputRef = useRef<HTMLInputElement | null>(null);
    const followLatestRef = useRef<boolean>(false);

    const openShapeProperties = useCallback(
        (index: number) => {
            setSelectedIndex?.(index);
            setShapePropsIndex(index);
            setShapePropsOpen(true);
        },
        [setSelectedIndex]
    );

    const closeShapeProperties = useCallback(() => {
        setShapePropsOpen(false);
        setShapePropsIndex(null);
    }, []);

    const handleApplyShapeProperties = useCallback((shape: IDrawingShape, form: ShapePropertiesFormState) => {
        setDrawings((prev) => {
            const idx = prev.indexOf(shape);
            if (idx < 0) return prev;
            const next = [...prev];
            applyShapePropertiesForm(next[idx], form);
            return next;
        });
        queueMicrotask(() => canvasRef.current?.redrawCanvas());
    }, []);

    const shapeForPropertiesModal =
        shapePropsOpen && shapePropsIndex != null && shapePropsIndex >= 0 && shapePropsIndex < drawings.length
            ? drawings[shapePropsIndex]
            : null;

    useEffect(() => {
        if (
            shapePropsOpen &&
            shapePropsIndex != null &&
            (shapePropsIndex < 0 || shapePropsIndex >= drawings.length || !drawings[shapePropsIndex])
        ) {
            closeShapeProperties();
        }
    }, [drawings, shapePropsOpen, shapePropsIndex, closeShapeProperties]);

    const reloadViewToData = useCallback(() => {
        setVisibleRange({
            start: intervals.length > 0 ? intervals[0].t - 60 : 0,
            end: intervals.length > 0 ? intervals[intervals.length - 1].t + 60 : 0,
            startIndex: 0,
            endIndex: intervals.length > 0 ? intervals.length - 1 : 0,
        });
        setDrawings([]);
    }, [intervals]);

    const handleFitVisibleRange = useCallback(() => {
        if (!intervals.length) {
            console.warn('[TickUp] Fit range: no intervals loaded.');
            return;
        }
        // Activate "follow latest" mode: keep viewport pinned to the right edge on each new bar
        followLatestRef.current = true;
        const pad = 60;
        const intervalSeconds = getIntervalSeconds(intervals, 60);
        // Show last ~100 bars (or full set if fewer)
        const lastT = intervals[intervals.length - 1].t;
        const end = lastT + intervalSeconds;
        const spanBars = Math.min(100, intervals.length);
        const start = end - spanBars * intervalSeconds;
        const [startIndex, endIndex] = findVisibleIndexRange(intervals, { start, end }, intervalSeconds);
        setVisibleRange({ start, end, startIndex, endIndex });
    }, [intervals]);

    const handleExportDataCsv = useCallback(() => {
        if (!intervals.length) {
            console.warn('[TickUp] Export: no data to export.');
            return;
        }
        try {
            const blob = new Blob([intervalsToCsv(intervals)], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chart-data-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('[TickUp] Export failed', e);
        }
    }, [intervals]);

    const handleSnapshotPng = useCallback(() => {
        const bg = chartOptions.base.style.backgroundColor;
        const sym =
            (symbol !== undefined ? String(symbol).trim() : '') ||
            symbolInputRef.current?.value?.trim() ||
            'unknown';
        const intervalSeconds = getIntervalSeconds(intervals, 60);
        const meta: ChartSnapshotMeta = {
            symbol: sym || 'unknown',
            visibleTimeStartSec: visibleRange.start,
            visibleTimeEndSec: visibleRange.end,
            intervalSeconds,
            chartType: String(chartOptions.base.chartType ?? 'chart'),
            barsInView:
                intervals.length > 0
                    ? Math.max(0, visibleRange.endIndex - visibleRange.startIndex + 1)
                    : 0,
            totalBarsInSeries: intervals.length,
            visiblePriceMin: visiblePriceRange.min,
            visiblePriceMax: visiblePriceRange.max,
            capturedAtMs: Date.now(),
        };
        const dataUrl = captureChartRegionToPngDataUrl(chartViewRef.current, bg, {
            meta,
            footerTextColor: chartOptions.base.style.axes.textColor,
        });
        if (!dataUrl) {
            console.error('[TickUp] Snapshot: chart view (axes + plot) not ready or empty.');
            return;
        }
        try {
            const link = document.createElement('a');
            link.download = buildChartSnapshotFileName(meta);
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error('[TickUp] Snapshot failed', e);
        }
    }, [
        chartOptions.base.chartType,
        chartOptions.base.style.axes.textColor,
        chartOptions.base.style.backgroundColor,
        intervals,
        symbol,
        visibleRange.end,
        visibleRange.endIndex,
        visibleRange.start,
        visibleRange.startIndex,
        visiblePriceRange.max,
        visiblePriceRange.min,
    ]);

    const handleToolbarRefresh = useCallback(async () => {
        try {
            if (onRefreshRequest) {
                await onRefreshRequest();
            } else {
                reloadViewToData();
            }
        } catch (e) {
            console.error('[TickUp] Refresh failed', e);
        } finally {
            canvasRef.current?.redrawCanvas();
        }
    }, [onRefreshRequest, reloadViewToData]);

    useLayoutEffect(() => {
        setIntervals((prev) => {
            if (prev === intervalsArray) return prev;
            if (intervalsArray.length === 0) return intervalsArray;

            if (
                prev.length === intervalsArray.length &&
                prev.length > 0 &&
                prev.every((p, i) => p === intervalsArray[i])
            ) {
                return prev;
            }

            if (prev.length === intervalsArray.length && prev.length > 0) {
                let i = 0;
                const n = prev.length;
                while (i < n - 1 && prev[i] === intervalsArray[i]) i++;
                if (i === n - 1) {
                    const pl = prev[n - 1];
                    const nl = intervalsArray[n - 1];
                    if (pl === nl) return prev;
                    if (
                        pl &&
                        nl &&
                        pl.t === nl.t &&
                        pl.o === nl.o &&
                        pl.h === nl.h &&
                        pl.l === nl.l &&
                        pl.c === nl.c &&
                        (pl.v ?? 0) === (nl.v ?? 0)
                    ) {
                        return prev;
                    }
                }
            }

            if (prev.length + 1 === intervalsArray.length) {
                let i = 0;
                while (i < prev.length && prev[i] === intervalsArray[i]) i++;
                if (i === prev.length) return intervalsArray;
            }

            return intervalsArray;
        });
    }, [intervalsArray]);

    function updateVisibleRange(rangeOrUpdate: TimeRange | ((prev: TimeRange) => TimeRange)) {
        if (!intervals || intervals.length === 0) return;
        const intervalSeconds = getIntervalSeconds(intervals, 60);
        const lastT = intervals[intervals.length - 1]?.t ?? 0;
        const latestEnd = lastT ? (lastT + intervalSeconds) : 0;
        const followPadding = Math.max(intervalSeconds, 1) * 2;

        setVisibleRange((prev) => {
            const currentRange = {start: prev.start, end: prev.end};
            const nextRange = typeof rangeOrUpdate === 'function' ? rangeOrUpdate(currentRange) : rangeOrUpdate;

            // Follow-latest mode: re-enable automatically when the user scrolls back to the end/future.
            // Disable immediately if they scroll back into history (hidden the newest bars).
            if (latestEnd > 0) {
                // If we're at or beyond the latest bar (future margin), we're in "follow" mode.
                // If we scroll even slightly back into history, we unlock.
                const isAtOrPastEnd = nextRange.end >= latestEnd - 0.001;
                followLatestRef.current = isAtOrPastEnd;
            } else {
                followLatestRef.current = false;
            }
            const [startIndex, endIndex] = findVisibleIndexRange(intervals, nextRange, intervalSeconds);
            return { ...nextRange, startIndex, endIndex };
        });
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

    // Follow-latest: when active, auto-nudge viewport right every time intervals change
    useEffect(() => {
        if (!followLatestRef.current || !intervals.length) return;
        const intervalSeconds = getIntervalSeconds(intervals, 60);
        const lastT = intervals[intervals.length - 1].t;
        const requiredEnd = lastT + intervalSeconds;
        setVisibleRange(prev => {
            if (requiredEnd <= prev.end) return prev;
            const span = prev.end - prev.start;
            if (!(span > 0)) return prev;
            const newEnd = requiredEnd;
            const newStart = newEnd - span;
            const [si, ei] = findVisibleIndexRange(intervals, { start: newStart, end: newEnd }, intervalSeconds);
            return { start: newStart, end: newEnd, startIndex: si, endIndex: ei };
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
        addShape(shape: DrawingInput) {
            const normalized = validateAndNormalizeShape(shape, chartOptions);
            if (!normalized) return;
            setDrawings(prev => [...prev, normalized]);
        },
        updateShape(shapeId: string, newShape: DrawingInput | DrawingPatch) {
            if (isDrawingPatch(newShape)) {
                setDrawings(prev =>
                    prev.map(s => {
                        if (s.id !== shapeId) return s;
                        applyDrawingPatch(s, newShape);
                        return s;
                    })
                );
                return;
            }
            const normalized = validateAndNormalizeShape(newShape, chartOptions);
            if (!normalized) return;
            normalized.id = shapeId;
            setDrawings(prev => prev.map(s => (s.id === shapeId ? normalized : s)));
        },
        patchShape(shapeId: string, patch: DrawingPatch) {
            setDrawings(prev =>
                prev.map(s => {
                    if (s.id !== shapeId) return s;
                    applyDrawingPatch(s, patch);
                    return s;
                })
            );
        },
        setDrawingsFromSpecs(specs: DrawingSpec[]) {
            const built: IDrawingShape[] = [];
            for (const spec of specs) {
                const s = drawingFromSpec(spec, chartOptions);
                if (s) built.push(s);
            }
            setDrawings(built);
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
        applyLiveData(updates: Interval | Interval[], placement: LiveDataPlacement): LiveDataApplyResult {
            const result = applyLiveDataMerge(intervals, updates, placement);
            if (result.warnings.length) {
                console.warn('[TickUp] Live data warnings:', result.warnings);
            }
            if (result.errors.length && result.intervals.length === 0) {
                console.error('[TickUp] Live data errors:', result.errors);
                return result;
            }
            if (result.errors.length) {
                console.warn('[TickUp] Live data issues:', result.errors);
            }
            setIntervals(result.intervals);
            return result;
        },
        fitVisibleRangeToData() {
            if (!intervals.length) {
                console.warn('[TickUp] fitVisibleRangeToData: no data');
                return;
            }
            followLatestRef.current = true;
            const pad = 60;
            const intervalSeconds = getIntervalSeconds(intervals, 60);
            const start = intervals[0].t - pad;
            const end = intervals[intervals.length - 1].t + pad;
            const [startIndex, endIndex] = findVisibleIndexRange(intervals, { start, end }, intervalSeconds);
            setVisibleRange({ start, end, startIndex, endIndex });
        },
        nudgeVisibleTimeRangeToLatest(options?: { trailingPaddingSec?: number }) {
            const leadPad = 60;
            if (intervals.length > 0) {
                followLatestRef.current = true;
            }
            setVisibleRange((prev) => {
                if (!intervals.length) return prev;
                const lastT = intervals[intervals.length - 1]!.t;
                const intervalSeconds = getIntervalSeconds(intervals, 60);
                const pad =
                    options?.trailingPaddingSec ?? Math.max(intervalSeconds, 60);
                const requiredEnd = lastT + pad;
                if (requiredEnd <= prev.end) return prev;
                const span = prev.end - prev.start;
                if (!(span > 0)) return prev;
                const delta = requiredEnd - prev.end;
                let newStart = prev.start + delta;
                let newEnd = requiredEnd;
                const firstT = intervals[0]!.t;
                if (newStart < firstT - leadPad) {
                    newStart = firstT - leadPad;
                    newEnd = newStart + span;
                    if (newEnd < requiredEnd) {
                        newEnd = requiredEnd;
                    }
                }
                const [startIndex, endIndex] = findVisibleIndexRange(
                    intervals,
                    { start: newStart, end: newEnd },
                    intervalSeconds
                );
                return { start: newStart, end: newEnd, startIndex, endIndex };
            });
        },
        getMainCanvasElement() {
            return canvasRef.current?.getMainCanvasElement() ?? null;
        },
        getViewInfo() {
            return {
                intervals,
                drawings,
                visibleRange,
                visiblePriceRange,
                canvasSize: canvasRef.current?.getCanvasSize() ?? { width: 0, height: 0, dpr: 1 },
            };
        },
        getVisibleRanges() {
            return {
                time: {
                    start: visibleRange.start,
                    end: visibleRange.end,
                    startIndex: visibleRange.startIndex,
                    endIndex: visibleRange.endIndex,
                },
                price: {
                    min: visiblePriceRange.min,
                    max: visiblePriceRange.max,
                    range: visiblePriceRange.range,
                },
            };
        },
        getDrawings(query?: DrawingQuery) {
            return queryDrawingsToSnapshots(drawings, query);
        },
        getDrawingById(id: string) {
            const idx = drawings.findIndex(s => s.id === id);
            if (idx < 0) return null;
            return shapeToSnapshot(drawings[idx], idx);
        },
        getDrawingInstances(query?: DrawingQuery) {
            return filterDrawingInstances(drawings, query);
        },
        getChartContext(): ChartContextInfo {
            const cs = canvasSizes ?? { width: 0, height: 0 };
            const canvas = canvasRef.current?.getCanvasSize() ?? { width: 0, height: 0, dpr: 1 };
            return {
                symbol: symbol ?? defaultSymbol ?? null,
                chartType: chartOptions.base.chartType as ChartType,
                themeVariant,
                layout: {
                    canvasContainer: { width: cs.width, height: cs.height },
                    yAxisWidthPx: windowSpread.INITIAL_Y_AXIS_WIDTH,
                    xAxisHeightPx: windowSpread.INITIAL_X_AXIS_HEIGHT,
                    yAxisPosition: chartOptions.axes.yAxisPosition as AxesPosition,
                },
                canvas,
                data: {
                    intervalCount: intervals.length,
                    firstBarTime: intervals.length ? intervals[0].t : null,
                    lastBarTime: intervals.length ? intervals[intervals.length - 1].t : null,
                    visibleTimeStart: visibleRange.start,
                    visibleTimeEnd: visibleRange.end,
                    visibleTimeStartIndex: visibleRange.startIndex,
                    visibleTimeEndIndex: visibleRange.endIndex,
                    visiblePriceMin: visiblePriceRange.min,
                    visiblePriceMax: visiblePriceRange.max,
                    visiblePriceRange: visiblePriceRange.range,
                },
                drawings: { count: drawings.length },
                interaction: { selectedShapeIndex: selectedIndex },
                timeDetailLevel,
                timeFormat12h,
                numberOfYTicks,
            };
        },
        getCanvasSize() {
            return canvasRef.current?.getCanvasSize() ?? { width: 0, height: 0, dpr: 1 };
        },
        clearCanvas() {
            canvasRef.current?.clearCanvas();
            setDrawings([]);
        },
        redrawCanvas() {
            canvasRef.current?.redrawCanvas();
        },
        reloadCanvas() {
            reloadViewToData();
        },
        setInteractionMode(mode: Mode) {
            setMode(mode);
        },
        deleteSelectedDrawing() {
            if (selectedIndex == null) {
                return;
            }
            setDrawings((prev) => {
                if (selectedIndex < 0 || selectedIndex >= prev.length) {
                    return prev;
                }
                return prev.filter((_, i) => i !== selectedIndex);
            });
            setSelectedIndex?.(null);
            setShapePropsOpen(false);
            setShapePropsIndex(null);
            canvasRef.current?.redrawCanvas?.();
        },
    }));

    const compactSymbolLabel = useMemo(() => {
        const fromControlled = symbol !== undefined ? String(symbol).trim() : '';
        const fromDefault = defaultSymbol != null ? String(defaultSymbol).trim() : '';
        return fromControlled || fromDefault;
    }, [symbol, defaultSymbol]);
    const showSymbolStrip = !showTopBar && compactSymbolLabel.length > 0;
    const primeGlass = chartOptions.base.engine === TickUpRenderEngine.prime;
    const primeGlassLight = primeGlass && chartOptions.base.theme === ChartTheme.light;

    return (
        <TickUpStageContainer
            ref={containerRef}
            className={"tickup-stage"}
            $showTopBar={showTopBar}
            $showLeftBar={showLeftBar}
            $showSymbolStrip={showSymbolStrip}
        >
            {showTopBar && (
                <TopBar className="top-toolbar-cell">
                    <SettingsToolbar
                        handleChartTypeChange={handleChartTypeChange}
                        selectedChartType={chartOptions.base.chartType as ChartType}
                        openSettingsMenu={openSettingsMenu}
                        showSettingsBar={showSettingsBar}
                        language={chartOptions.base.style.axes.language}
                        locale={chartOptions.base.style.axes.locale}
                        symbolInputRef={symbolInputRef}
                        symbol={symbol}
                        defaultSymbol={defaultSymbol}
                        onSymbolChange={onSymbolChange}
                        onSymbolSearch={onSymbolSearch}
                        onFitVisibleRange={handleFitVisibleRange}
                        onExportDataCsv={handleExportDataCsv}
                        onSnapshotPng={handleSnapshotPng}
                        onRefresh={handleToolbarRefresh}
                        onToggleTheme={onToggleTheme}
                        themeVariant={themeVariant}
                        primeGlass={primeGlass}
                        primeGlassLight={primeGlassLight}
                    />
                </TopBar>
            )}

            {!showTopBar && showSymbolStrip ? (
                <CompactSymbolStrip
                    className="tickup-compact-symbol-strip"
                    style={{
                        padding: '6px 12px',
                        font: chartOptions.base.style.axes.font,
                        fontWeight: 700,
                        color: chartOptions.base.style.axes.textColor,
                        backgroundColor: chartOptions.base.style.backgroundColor,
                        borderBottom: `1px solid ${chartOptions.base.style.axes.lineColor}`,
                    }}
                    role="status"
                    aria-label={`Symbol ${compactSymbolLabel}`}
                >
                    {compactSymbolLabel}
                </CompactSymbolStrip>
            ) : null}

            {showLeftBar && (
                <LeftBar className="side-toolbar-cell">
                    <Toolbar
                        language={chartOptions.base.style.axes.language}
                        locale={chartOptions.base.style.axes.locale}
                        primeGlass={primeGlass}
                        primeGlassLight={primeGlassLight}
                    />
                </LeftBar>
            )}

            <ChartView
                ref={chartViewRef}
                className="chart-main-cell tickup-chart-snapshot-root"
                $yAxisWidth={windowSpread.INITIAL_Y_AXIS_WIDTH}
                $xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                $yAxisPosition={chartOptions.axes.yAxisPosition as AxesPosition}
            >
                <YAxisContainer
                    className={chartOptions.axes.yAxisPosition === AxesPosition.left ? "left-y-axis-container" : "right-y-axis-container"}
                    $yAxisPosition={chartOptions.axes.yAxisPosition as AxesPosition}
                    style={{ width: `${windowSpread.INITIAL_Y_AXIS_WIDTH}px` }}
                >
                    <YAxis
                        yAxisPosition={chartOptions.axes.yAxisPosition as AxesPosition}
                        xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                        minPrice={visiblePriceRange.min}
                        maxPrice={visiblePriceRange.max}
                        numberOfYTicks={numberOfYTicks}
                        formatting={chartOptions.base.style.axes}
                    />
                </YAxisContainer>

                <CanvasAxisContainer
                    className="canvas-axis-container"
                    $yAxisPosition={chartOptions.axes.yAxisPosition as AxesPosition}
                >
                    {!showTopBar && showSettingsBar && (
                        <FloatingSettingsButton
                            $yAxisPosition={chartOptions.axes.yAxisPosition as AxesPosition}
                            onClick={openSettingsMenu}
                            className="floating-settings-btn"
                        >
                            <IconGear />
                        </FloatingSettingsButton>
                    )}
                    <CanvasContainer ref={canvasAreaRef} className="canvas-container">
                        {canvasSizes?.width > 0 && canvasSizes?.height > 0 && (
                            <ChartCanvas
                                ref={canvasRef}
                                intervalsArray={intervals}
                                drawings={drawings}
                                setDrawings={setDrawings}
                                selectedIndex={selectedIndex}
                                setSelectedIndex={setSelectedIndex}
                                onRequestShapeProperties={openShapeProperties}
                                visibleRange={visibleRange}
                                setVisibleRange={updateVisibleRange}
                                visiblePriceRange={visiblePriceRange}
                                chartOptions={chartOptions}
                                canvasSizes={canvasSizes}
                                windowSpread={windowSpread}
                                showBrandWatermark={showBrandWatermark}
                                brandTheme={chartOptions.base.theme}
                            />
                        )}
                    </CanvasContainer>

                    <XAxisContainer className="x-axis-container">
                        <XAxis
                            canvasSizes={canvasSizes}
                            parentContainerRef={containerRef}
                            timeDetailLevel={timeDetailLevel}
                            timeFormat12h={timeFormat12h}
                            formatting={chartOptions.base.style.axes}
                            visibleRange={visibleRange}
                            xAxisHeight={windowSpread.INITIAL_X_AXIS_HEIGHT}
                            dateFormat={chartOptions.base.style.axes.dateFormat || 'MMM d'}
                            locale={chartOptions.base.style.axes.locale || 'en-US'}
                            timezone={chartOptions.base.style.axes.timezone}
                        />
                    </XAxisContainer>
                </CanvasAxisContainer>
            </ChartView>

            <ShapePropertiesModal
                isOpen={Boolean(shapeForPropertiesModal)}
                shape={shapeForPropertiesModal}
                onClose={closeShapeProperties}
                onApply={handleApplyShapeProperties}
                themeVariant={themeVariant}
            />
        </TickUpStageContainer>
    );
});