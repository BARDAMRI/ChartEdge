import React, {useEffect, useMemo, useState, forwardRef, useImperativeHandle, useRef} from 'react';
import {TickUpStage} from './Canvas/TickUpStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {SettingsModal, SettingsState} from './SettingsModal/SettingsModal';
import {Interval} from '../types/Interval';
import {PriceRange, TimeRange, VisibleViewRanges} from '../types/Graph';
import {AxesPosition, DeepPartial, DeepRequired, ChartTheme} from '../types/types';
import {
    AxesUnitPlacement,
    ChartOptions,
    ChartType,
    CurrencyDisplay,
    NumberNotation,
    TimeDetailLevel,
} from '../types/chartOptions';
import {StrokeLineStyle} from '../types/overlay';
import {Mode, ModeProvider} from '../contexts/ModeContext';
import {deepMerge} from "../utils/deepMerge";
import {deepEqual} from "../utils/deepEqual";
import {
    GlobalStyle,
    MainAppWindow,
    LowerContainer,
    ToolbarArea,
    ChartStageArea,
    SettingsArea
} from '../styles/App.styles';
import {DEFAULT_GRAPH_OPTIONS} from "./DefaultData";
import {FormattingService} from '../services/FormattingService';
import type {LiveDataApplyResult, LiveDataPlacement} from '../types/liveData';
import type {DrawingInput, DrawingPatch, DrawingSpec} from './Drawing/drawHelper';
import type {DrawingQuery, DrawingSnapshot} from './Drawing/drawingQuery';
import type {ChartContextInfo} from '../types/chartContext';
import type {IDrawingShape} from './Drawing/IDrawingShape';
import {TickUpProductId} from '../types/tickupProducts';
import type {TickUpChartEngine} from '../engines/TickUpEngine';

/** Stable reference when `chartOptions` prop is omitted so sync effect is not fooled by a fresh `{}` each render. */
const EMPTY_CHART_OPTIONS: DeepPartial<ChartOptions> = {};

/**
 * Imperative API for {@link TickUpHost} and product components
 * (`TickUpCommand`, `TickUpPulse`, …). Pass a React `ref` typed as this interface.
 */
export interface TickUpHostHandle {
    addShape: (shape: DrawingInput) => void;
    updateShape: (shapeId: string, newShape: DrawingInput | DrawingPatch) => void;
    patchShape: (shapeId: string, patch: DrawingPatch) => void;
    setDrawingsFromSpecs: (specs: DrawingSpec[]) => void;
    deleteShape: (shapeId: string) => void;
    addInterval: (interval: Interval) => void;
    updateInterval: (index: number, newInterval: Interval) => void;
    deleteInterval: (index: number) => void;
    applyLiveData: (updates: Interval | Interval[], placement: LiveDataPlacement) => LiveDataApplyResult;
    fitVisibleRangeToData: () => void;
    /**
     * If the last bar has moved past the right edge of the window, pans the view by the minimum amount
     * so it stays visible (same time span when possible). No-op when already in view.
     */
    nudgeVisibleTimeRangeToLatest: (options?: { trailingPaddingSec?: number }) => void;
    getMainCanvasElement: () => HTMLCanvasElement | null;
    getViewInfo: () => {
        intervals: Interval[];
        drawings: IDrawingShape[];
        visibleRange: TimeRange & { startIndex: number; endIndex: number };
        visiblePriceRange: PriceRange;
        canvasSize: { width: number; height: number; dpr: number };
    } | null;
    getDrawings: (query?: DrawingQuery) => DrawingSnapshot[];
    getDrawingById: (id: string) => DrawingSnapshot | null;
    getDrawingInstances: (query?: DrawingQuery) => IDrawingShape[];
    getChartContext: () => ChartContextInfo | null;
    /** Visible time (unix seconds + bar indices) and price band — counterpart to {@link getCanvasSize}. */
    getVisibleRanges: () => VisibleViewRanges | null;
    getCanvasSize: () => { width: number; height: number; dpr: number } | null;
    clearCanvas: () => void;
    redrawCanvas: () => void;
    reloadCanvas: () => void;
    /** Merge an engine profile (e.g. {@link TickUpPrime}) into live chart options. */
    setEngine: (engine: TickUpChartEngine) => void;
    /** Forwarded to the stage — drawing toolbar modes (line, select, …). */
    setInteractionMode: (mode: Mode) => void;
    /** Deletes the selected drawing on the stage, if any. */
    deleteSelectedDrawing: () => void;
}

/**
 * Props for {@link TickUpHost} and the tier components (`TickUpPulse`, `TickUpFlow`, …).
 * When `productId` is set, toolbar layout props (`showSidebar`, `showTopBar`, `showSettingsBar`) are fixed and omitted from product prop types.
 */
export type TickUpHostProps = {
    intervalsArray?: Interval[];
    initialNumberOfYTicks?: number;
    initialXAxisHeight?: number;
    initialYAxisWidth?: number;
    initialTimeDetailLevel?: TimeDetailLevel;
    initialTimeFormat12h?: boolean;
    initialVisibleTimeRange?: TimeRange;
    chartOptions?: DeepPartial<ChartOptions>;
    /**
     * Toolbar chrome — only honored when `productId` is omitted (legacy / unbundled host).
     * When `productId` is set (TickUp Pulse, Flow, …), layout is fixed by product and these props are ignored.
     */
    showSidebar?: boolean;
    showTopBar?: boolean;
    /** When false hides the settings gear icon even if the top toolbar is visible */
    showSettingsBar?: boolean;
    /** Invoked when the user activates Refresh in the settings toolbar (e.g. reload quotes). */
    onRefreshRequest?: () => void | Promise<void>;
    /** Controlled toolbar symbol (optional). */
    symbol?: string;
    /** Initial toolbar symbol when uncontrolled. */
    defaultSymbol?: string;
    onSymbolChange?: (symbol: string) => void;
    /**
     * Invoked when the user submits symbol search (search button or Enter).
     * Return `false` or reject the promise if the lookup failed — the toolbar reverts to the last good symbol
     * and calls `onSymbolChange` with it (for controlled hosts). Return `true` or void on success.
     */
    onSymbolSearch?: (symbol: string) => void | boolean | Promise<void | boolean>;
    /**
     * Locks toolbar chrome to the product line: side drawing bar, top bar, and settings entry cannot be
     * changed via props or settings for this instance. Omit for a host-controlled layout (see `showSidebar` / `showTopBar` / `showSettingsBar`).
     */
    productId?: TickUpProductId;
    /**
     * In-chart logo watermark (bundled transparent PNG, low opacity, no extra layout row).
     * Forced on for `productId="desk"`. Default true. Set false to disable branding.
     */
    showAttribution?: boolean;
    /** For `productId="prime"`: non-empty value hides the eval strip. */
    licenseKey?: string | null;
    /**
     * Shell **light** / **dark** (toolbar, settings modal chrome, `GlobalStyle` page background).
     * When set, the host is **controlled**: update this prop when {@link onThemeVariantChange} fires
     * (e.g. from the settings toolbar sun/moon control).
     */
    themeVariant?: ChartTheme;
    /**
     * Initial shell theme when {@link themeVariant} is omitted (uncontrolled). Defaults to **`light`**.
     */
    defaultThemeVariant?: ChartTheme;
    /** Notified when the user toggles shell theme from the toolbar. */
    onThemeVariantChange?: (variant: ChartTheme) => void;
};

function tickupProductLayoutDefaults(id: TickUpProductId | undefined): {
    showSidebar: boolean;
    showTopBar: boolean;
    showSettingsBar: boolean;
} {
    switch (id ?? TickUpProductId.command) {
        case TickUpProductId.pulse:
            return {showSidebar: false, showTopBar: false, showSettingsBar: false};
        case TickUpProductId.flow:
            return {showSidebar: false, showTopBar: true, showSettingsBar: true};
        case TickUpProductId.command:
        case TickUpProductId.desk:
        case TickUpProductId.prime:
        default:
            return {showSidebar: true, showTopBar: true, showSettingsBar: true};
    }
}

export const TickUpHost = forwardRef<TickUpHostHandle, TickUpHostProps>((props, ref) => {
    const {
        intervalsArray = [],
        initialNumberOfYTicks = 5,
        initialTimeDetailLevel = TimeDetailLevel.Auto,
        initialTimeFormat12h = false,
        chartOptions = EMPTY_CHART_OPTIONS,
        showSidebar: showSidebarProp,
        showTopBar: showTopBarProp,
        showSettingsBar: showSettingsBarProp,
        onRefreshRequest,
        symbol,
        defaultSymbol,
        onSymbolChange,
        onSymbolSearch,
        productId,
        licenseKey,
        showAttribution = true,
        themeVariant: themeVariantProp,
        defaultThemeVariant = ChartTheme.light,
        onThemeVariantChange,
    } = props;

    const hasLockedChrome = productId != null;
    const tierLayout = tickupProductLayoutDefaults(productId);
    const showSidebar = hasLockedChrome ? tierLayout.showSidebar : (showSidebarProp ?? tierLayout.showSidebar);
    const showTopBar = hasLockedChrome ? tierLayout.showTopBar : (showTopBarProp ?? tierLayout.showTopBar);
    const showSettingsBar = hasLockedChrome ? tierLayout.showSettingsBar : (showSettingsBarProp ?? tierLayout.showSettingsBar);
    const attributionOn = productId === TickUpProductId.desk ? true : showAttribution;

    const [finalStyleOptions, setStyleOptions] = useState<DeepRequired<ChartOptions>>(() =>
        deepMerge(DEFAULT_GRAPH_OPTIONS, chartOptions)
    );
    const [internalThemeVariant, setInternalThemeVariant] = useState<ChartTheme>(defaultThemeVariant);
    const isThemeControlled = themeVariantProp !== undefined;
    const themeVariant = isThemeControlled ? themeVariantProp! : internalThemeVariant;

    const handleThemeToggle = () => {
        const next = themeVariant === ChartTheme.light ? ChartTheme.dark : ChartTheme.light;
        if (!isThemeControlled) {
            setInternalThemeVariant(next);
        }
        onThemeVariantChange?.(next);
    };
    const [selectedIndex, setSelectedIndex] = useState<null | number>(null);
    const stageRef = useRef<any>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [layoutOptions, setLayoutOptions] = useState({
        showSidebar,
        showTopBar,
        showSettingsBar,
        timeFormat12h: initialTimeFormat12h,
    });

    const prevExternalChartOptionsRef = useRef(chartOptions);

    useEffect(() => {
        if (deepEqual(chartOptions, prevExternalChartOptionsRef.current)) {
            return;
        }
        prevExternalChartOptionsRef.current = chartOptions;
        setStyleOptions((prev) => {
            const merged = deepMerge(prev, chartOptions);
            return deepEqual(merged, prev) ? prev : merged;
        });
    }, [chartOptions]);

    useEffect(() => {
        if (hasLockedChrome) {
            const d = tickupProductLayoutDefaults(productId);
            setLayoutOptions(prev => ({
                ...prev,
                showSidebar: d.showSidebar,
                showTopBar: d.showTopBar,
                showSettingsBar: d.showSettingsBar,
            }));
            return;
        }
        const d = tickupProductLayoutDefaults(undefined);
        setLayoutOptions(prev => ({
            ...prev,
            showSidebar: showSidebarProp !== undefined ? showSidebarProp : d.showSidebar,
            showTopBar: showTopBarProp !== undefined ? showTopBarProp : d.showTopBar,
            showSettingsBar: showSettingsBarProp !== undefined ? showSettingsBarProp : d.showSettingsBar,
        }));
    }, [hasLockedChrome, productId, showSidebarProp, showTopBarProp, showSettingsBarProp]);

    useEffect(() => {
        const handleCopy = (e: ClipboardEvent) => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const selectedText = selection.toString();
            if (selectedText) {
                // Try to parse the selected text as a localized number.
                // If it succeeds, we put the normalized (canonical) value on the clipboard.
                const parsed = FormattingService.parseInput(selectedText, finalStyleOptions.base.style.axes);
                if (parsed !== null) {
                    e.clipboardData?.setData('text/plain', FormattingService.toClipboard(parsed));
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('copy', handleCopy);
        return () => window.removeEventListener('copy', handleCopy);
    }, [finalStyleOptions.base.style.axes]);



    useImperativeHandle(ref, () => ({
        addShape: (shape: DrawingInput) => {
            if (stageRef.current && stageRef.current.addShape) {
                stageRef.current.addShape(shape);
            }
        },
        updateShape: (shapeId: string, newShape: DrawingInput | DrawingPatch) => {
            if (stageRef.current && stageRef.current.updateShape) {
                stageRef.current.updateShape(shapeId, newShape);
            }
        },
        patchShape: (shapeId: string, patch: DrawingPatch) => {
            if (stageRef.current?.patchShape) {
                stageRef.current.patchShape(shapeId, patch);
            }
        },
        setDrawingsFromSpecs: (specs: DrawingSpec[]) => {
            if (stageRef.current?.setDrawingsFromSpecs) {
                stageRef.current.setDrawingsFromSpecs(specs);
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
        updateInterval: (index: number, newInterval: Interval) => {
            if (stageRef.current && stageRef.current.updateInterval) {
                stageRef.current.updateInterval(index, newInterval);
            }
        },
        deleteInterval: (index: number) => {
            if (stageRef.current && stageRef.current.deleteInterval) {
                stageRef.current.deleteInterval(index);
            }
        },
        getViewInfo: () => {
            if (stageRef.current && stageRef.current.getViewInfo) {
                return stageRef.current.getViewInfo();
            }
            return null;
        },
        getDrawings: (query?: DrawingQuery) => {
            if (stageRef.current?.getDrawings) {
                return stageRef.current.getDrawings(query);
            }
            return [];
        },
        getDrawingById: (id: string) => {
            if (stageRef.current?.getDrawingById) {
                return stageRef.current.getDrawingById(id);
            }
            return null;
        },
        getDrawingInstances: (query?: DrawingQuery) => {
            if (stageRef.current?.getDrawingInstances) {
                return stageRef.current.getDrawingInstances(query);
            }
            return [];
        },
        getChartContext: () => {
            if (stageRef.current?.getChartContext) {
                return stageRef.current.getChartContext();
            }
            return null;
        },
        getCanvasSize: () => {
            if (stageRef.current && stageRef.current.getCanvasSize) {
                return stageRef.current.getCanvasSize();
            }
            return null;
        },
        getVisibleRanges: () => {
            if (stageRef.current?.getVisibleRanges) {
                return stageRef.current.getVisibleRanges();
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
        },
        applyLiveData: (updates: Interval | Interval[], placement: LiveDataPlacement) => {
            if (stageRef.current?.applyLiveData) {
                return stageRef.current.applyLiveData(updates, placement);
            }
            return {
                ok: false,
                intervals: [],
                errors: ['Chart stage is not ready'],
                warnings: [],
            };
        },
        fitVisibleRangeToData: () => {
            stageRef.current?.fitVisibleRangeToData?.();
        },
        nudgeVisibleTimeRangeToLatest: (options?: { trailingPaddingSec?: number }) => {
            stageRef.current?.nudgeVisibleTimeRangeToLatest?.(options);
        },
        getMainCanvasElement: () => stageRef.current?.getMainCanvasElement?.() ?? null,
        setEngine: (engine: TickUpChartEngine) => {
            setStyleOptions((prev) => deepMerge(prev, engine.getChartOptionsPatch()));
        },
        setInteractionMode: (mode: Mode) => {
            stageRef.current?.setInteractionMode?.(mode);
        },
        deleteSelectedDrawing: () => {
            stageRef.current?.deleteSelectedDrawing?.();
        },
    }));

    const handleChartTypeChange = (newType: ChartType) => {
        setSelectedIndex(null);
        setStyleOptions((prev) => ({
            ...prev,
            base: {
                ...prev.base,
                chartType: newType,
            },
        }));
    };

    const handleSaveSettings = (newSettings: SettingsState) => {
        setLayoutOptions(prev => ({
            ...prev,
            ...(hasLockedChrome
                ? {}
                : {
                      showSidebar: newSettings.showSidebar,
                      showTopBar: newSettings.showTopBar,
                  }),
            timeFormat12h: newSettings.timeFormat12h,
        }));

        // Chart data options: use a deep clone to avoid mutating previous state references
        setStyleOptions(prev => ({
            ...prev,
            axes: {
                ...prev.axes,
                yAxisPosition: newSettings.yAxisPosition,
                numberOfYTicks: newSettings.numberOfYTicks,
            },
            base: {
                ...prev.base,
                showHistogram: newSettings.showHistogram,
                showCandleTooltip: newSettings.showCandleTooltip,
                showCrosshair: newSettings.showCrosshair,
                showCrosshairValues: newSettings.showCrosshairValues,
                style: {
                    ...prev.base.style,
                    showGrid: newSettings.showGrid,
                    backgroundColor: newSettings.backgroundColor,
                    axes: {
                        ...prev.base.style.axes,
                        textColor: newSettings.textColor,
                        numberFractionDigits: newSettings.fractionDigits,
                        decimalSeparator: newSettings.decimalSeparator,
                        thousandsSeparator: newSettings.thousandsSeparator,
                        dateFormat: newSettings.dateFormat,
                        locale: newSettings.locale,
                        language: newSettings.language,
                        currency: newSettings.currency,
                        useCurrency: newSettings.useCurrency,
                        currencyDisplay: newSettings.currencyDisplay,
                        numberNotation: newSettings.numberNotation,
                        tickSize: newSettings.tickSize,
                        minimumFractionDigits: newSettings.minimumFractionDigits,
                        maximumFractionDigits: newSettings.maximumFractionDigits,
                        maximumSignificantDigits: newSettings.maximumSignificantDigits,
                        autoPrecision: newSettings.autoPrecision,
                        unit: newSettings.unit,
                        unitPlacement: newSettings.unitPlacement,
                    },
                    candles: {
                        ...prev.base.style.candles,
                        bullColor: newSettings.bullColor,
                        upColor: newSettings.bullColor,
                        bearColor: newSettings.bearColor,
                        downColor: newSettings.bearColor,
                    },
                    histogram: {
                        ...prev.base.style.histogram,
                        bullColor: newSettings.bullColor,
                        bearColor: newSettings.bearColor,
                    },
                    bar: {
                        ...prev.base.style.bar,
                        bullColor: newSettings.bullColor,
                        bearColor: newSettings.bearColor,
                    },
                    line: {
                        ...prev.base.style.line,
                        color: newSettings.lineColor,
                    },
                    drawings: {
                        ...prev.base.style.drawings,
                        lineColor: newSettings.drawingLineColor,
                        lineWidth: newSettings.drawingLineWidth,
                        lineStyle: newSettings.drawingLineStyle,
                        fillColor: newSettings.drawingFillColor,
                        selected: {
                            ...prev.base.style.drawings.selected,
                            lineColor: newSettings.drawingSelectedLineColor,
                            lineStyle: newSettings.drawingSelectedLineStyle,
                            lineWidthAdd: newSettings.drawingSelectedLineWidthAdd,
                        },
                    },
                },
            },
        }));
    };

    // Memoized so the object reference only changes when actual values change.
    // This prevents the SettingsModal's useEffect from seeing a "new" initialSettings
    // on every parent render and resetting the user's in-progress edits.
    const currentSettingsData: SettingsState = useMemo(() => ({
        showSidebar: layoutOptions.showSidebar,
        showTopBar: layoutOptions.showTopBar,
        showHistogram: finalStyleOptions.base.showHistogram,
        showCandleTooltip: finalStyleOptions.base.showCandleTooltip,
        showCrosshair: finalStyleOptions.base.showCrosshair,
        showCrosshairValues: finalStyleOptions.base.showCrosshairValues,
        showGrid: finalStyleOptions.base.style.showGrid,
        timeFormat12h: layoutOptions.timeFormat12h,
        yAxisPosition: finalStyleOptions.axes.yAxisPosition,
        numberOfYTicks: finalStyleOptions.axes.numberOfYTicks,
        backgroundColor: finalStyleOptions.base.style.backgroundColor,
        textColor: finalStyleOptions.base.style.axes.textColor,
        bullColor: finalStyleOptions.base.style.candles.bullColor,
        bearColor: finalStyleOptions.base.style.candles.bearColor,
        lineColor: finalStyleOptions.base.style.line.color,
        fractionDigits: finalStyleOptions.base.style.axes.numberFractionDigits ?? 2,
        decimalSeparator: finalStyleOptions.base.style.axes.decimalSeparator ?? '.',
        thousandsSeparator: finalStyleOptions.base.style.axes.thousandsSeparator ?? ',',
        dateFormat: finalStyleOptions.base.style.axes.dateFormat ?? 'MMM d',
        locale: finalStyleOptions.base.style.axes.locale ?? 'en-US',
        language: finalStyleOptions.base.style.axes.language ?? 'en',
        currency: finalStyleOptions.base.style.axes.currency ?? 'USD',
        useCurrency: finalStyleOptions.base.style.axes.useCurrency ?? false,
        currencyDisplay: finalStyleOptions.base.style.axes.currencyDisplay ?? CurrencyDisplay.symbol,
        numberNotation: finalStyleOptions.base.style.axes.numberNotation ?? NumberNotation.standard,
        minimumFractionDigits: finalStyleOptions.base.style.axes.minimumFractionDigits ?? 2,
        maximumFractionDigits: finalStyleOptions.base.style.axes.maximumFractionDigits ?? 8,
        maximumSignificantDigits: finalStyleOptions.base.style.axes.maximumSignificantDigits ?? 21,
        tickSize: finalStyleOptions.base.style.axes.tickSize ?? 0.01,
        autoPrecision: finalStyleOptions.base.style.axes.autoPrecision ?? false,
        unit: finalStyleOptions.base.style.axes.unit ?? '',
        unitPlacement: finalStyleOptions.base.style.axes.unitPlacement ?? AxesUnitPlacement.suffix,
        drawingLineColor: finalStyleOptions.base.style.drawings.lineColor,
        drawingLineWidth: finalStyleOptions.base.style.drawings.lineWidth,
        drawingLineStyle: finalStyleOptions.base.style.drawings.lineStyle,
        drawingFillColor: finalStyleOptions.base.style.drawings.fillColor,
        drawingSelectedLineColor: finalStyleOptions.base.style.drawings.selected.lineColor,
        drawingSelectedLineStyle: finalStyleOptions.base.style.drawings.selected.lineStyle ?? StrokeLineStyle.dashed,
        drawingSelectedLineWidthAdd: finalStyleOptions.base.style.drawings.selected.lineWidthAdd ?? 1,
    }), [
        layoutOptions.showSidebar,
        layoutOptions.showTopBar,
        layoutOptions.timeFormat12h,
        finalStyleOptions.base.showHistogram,
        finalStyleOptions.base.showCandleTooltip,
        finalStyleOptions.base.showCrosshair,
        finalStyleOptions.base.showCrosshairValues,
        finalStyleOptions.base.style.showGrid,
        finalStyleOptions.axes.yAxisPosition,
        finalStyleOptions.axes.numberOfYTicks,
        finalStyleOptions.base.style.backgroundColor,
        finalStyleOptions.base.style.axes,
        finalStyleOptions.base.style.line.color,
        finalStyleOptions.base.style.candles.bullColor,
        finalStyleOptions.base.style.candles.bearColor,
        finalStyleOptions.base.style.drawings,
    ]) as SettingsState;

    const chartOptionsForStage = useMemo((): DeepRequired<ChartOptions> => {
        if (themeVariant === ChartTheme.light) return finalStyleOptions;
        return deepMerge(finalStyleOptions, {
            base: {
                theme: ChartTheme.dark,
                style: {
                    backgroundColor: '#121212',
                    axes: {
                        textColor: '#e6edf3',
                        lineColor: '#6e7681',
                    },
                    grid: {
                        color: '#30363d',
                        lineColor: '#30363d',
                    },
                    candles: {
                        borderColor: '#757575',
                    },
                },
            },
        } as DeepPartial<ChartOptions>);
    }, [finalStyleOptions, themeVariant]);

    const primeTierEval = productId === TickUpProductId.prime && !licenseKey;

    return (
        <ModeProvider>
            <GlobalStyle $pageBackground={themeVariant === ChartTheme.dark ? '#121212' : '#ffffff'}/>
            <MainAppWindow
                className={'tickup-root'}
                style={{
                    backgroundColor: chartOptionsForStage.base.style.backgroundColor,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }}
            >
                {primeTierEval ? (
                    <div
                        style={{
                            flexShrink: 0,
                            padding: '6px 10px',
                            fontSize: 11,
                            textAlign: 'center',
                            fontFamily: 'system-ui, sans-serif',
                            backgroundColor: themeVariant === ChartTheme.dark ? '#2d333b' : '#fff8e1',
                            color: themeVariant === ChartTheme.dark ? '#d4d4d8' : '#5c4a00',
                            borderBottom: `1px solid ${themeVariant === ChartTheme.dark ? '#444c56' : '#f0d060'}`,
                        }}
                    >
                        TickUp Prime tier — evaluation mode. Provide <code>licenseKey</code> when your license is active.
                    </div>
                ) : null}
                <div
                    style={{
                        flex: '1 1 auto',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                    }}
                >
                    <TickUpStage
                        ref={stageRef}
                        intervalsArray={intervalsArray}
                        numberOfYTicks={chartOptionsForStage.axes.numberOfYTicks}
                        timeDetailLevel={initialTimeDetailLevel}
                        timeFormat12h={layoutOptions.timeFormat12h}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                        chartOptions={chartOptionsForStage}
                        showTopBar={layoutOptions.showTopBar}
                        showLeftBar={layoutOptions.showSidebar}
                        handleChartTypeChange={handleChartTypeChange}
                        openSettingsMenu={() => setIsSettingsOpen(true)}
                        showSettingsBar={layoutOptions.showSettingsBar}
                        onRefreshRequest={onRefreshRequest}
                        onToggleTheme={handleThemeToggle}
                        symbol={symbol}
                        defaultSymbol={defaultSymbol}
                        onSymbolChange={onSymbolChange}
                        onSymbolSearch={onSymbolSearch}
                        themeVariant={themeVariant}
                        showBrandWatermark={attributionOn}
                    />

                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        onSave={handleSaveSettings}
                        initialSettings={currentSettingsData}
                        themeVariant={themeVariant}
                        lockToolbarLayout={hasLockedChrome}
                        contained
                    />
                </div>
            </MainAppWindow>
        </ModeProvider>
    );
});