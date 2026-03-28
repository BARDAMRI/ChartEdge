import React, {useEffect, useMemo, useState, forwardRef, useImperativeHandle, useRef} from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {SettingsModal, SettingsState} from './SettingsModal/SettingsModal';
import {Interval} from '../types/Interval';
import {PriceRange, TimeRange} from '../types/Graph';
import {AxesPosition, DeepPartial, DeepRequired} from '../types/types';
import {
    ChartOptions,
    ChartType,
    TimeDetailLevel
} from '../types/chartOptions';
import {ModeProvider} from '../contexts/ModeContext';
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

export interface SimpleChartEdgeHandle {
    addShape: (shape: DrawingInput) => void;
    updateShape: (shapeId: string, newShape: DrawingInput | DrawingPatch) => void;
    patchShape: (shapeId: string, patch: DrawingPatch) => void;
    setDrawingsFromSpecs: (specs: DrawingSpec[]) => void;
    deleteShape: (shapeId: string) => void;
    addInterval: (interval: Interval) => void;
    updateInterval: (intervalId: string, newInterval: Interval) => void;
    deleteInterval: (intervalId: string) => void;
    applyLiveData: (updates: Interval | Interval[], placement: LiveDataPlacement) => LiveDataApplyResult;
    fitVisibleRangeToData: () => void;
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
    getCanvasSize: () => { width: number; height: number; dpr: number } | null;
    clearCanvas: () => void;
    redrawCanvas: () => void;
    reloadCanvas: () => void;
}

export type SimpleChartEdgeProps = {
    intervalsArray?: Interval[];
    initialNumberOfYTicks?: number;
    initialXAxisHeight?: number;
    initialYAxisWidth?: number;
    initialTimeDetailLevel?: TimeDetailLevel;
    initialTimeFormat12h?: boolean;
    initialVisibleTimeRange?: TimeRange;
    chartOptions?: DeepPartial<ChartOptions>;
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
    /** Invoked when the user submits symbol search (search button or Enter). */
    onSymbolSearch?: (symbol: string) => void;
};

export const SimpleChartEdge = forwardRef<SimpleChartEdgeHandle, SimpleChartEdgeProps>(({
                                                                                            intervalsArray = [],
                                                                                            initialNumberOfYTicks = 5,
                                                                                            initialTimeDetailLevel = TimeDetailLevel.Auto,
                                                                                            initialTimeFormat12h = false,
                                                                                            chartOptions = {} as DeepPartial<ChartOptions>,
                                                                                            showSidebar = true,
                                                                                            showTopBar = true,
                                                                                            showSettingsBar = true,
                                                                                            onRefreshRequest,
                                                                                            symbol,
                                                                                            defaultSymbol,
                                                                                            onSymbolChange,
                                                                                            onSymbolSearch,
                                                                                        }, ref) => {

    const [finalStyleOptions, setStyleOptions] = useState<DeepRequired<ChartOptions>>(deepMerge(DEFAULT_GRAPH_OPTIONS, chartOptions));
    const [themeVariant, setThemeVariant] = useState<'light' | 'dark'>('light');
    const [selectedIndex, setSelectedIndex] = useState<null | number>(null);
    const stageRef = useRef<any>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [layoutOptions, setLayoutOptions] = useState({
        showSidebar,
        showTopBar,
        showSettingsBar,
        timeFormat12h: initialTimeFormat12h,
    });

    useEffect(() => {
        const merged = deepMerge(finalStyleOptions, chartOptions);
        if (!deepEqual(merged, finalStyleOptions)) {
            setStyleOptions(merged);
        }
    }, [chartOptions]);

    useEffect(() => {
        setLayoutOptions(prev => ({
            ...prev,
            showSidebar: showSidebar ?? prev.showSidebar,
            showTopBar: showTopBar ?? prev.showTopBar,
            showSettingsBar: showSettingsBar ?? prev.showSettingsBar,
        }));
    }, [showSidebar, showTopBar, showSettingsBar]);

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
        getMainCanvasElement: () => stageRef.current?.getMainCanvasElement?.() ?? null,
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

    const handleSaveSettings = (newSettings: SettingsState) => {
        // Layout-only flags live in layoutOptions
        setLayoutOptions(prev => ({
            ...prev,
            showSidebar: newSettings.showSidebar,
            showTopBar: newSettings.showTopBar,
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
        currencyDisplay: finalStyleOptions.base.style.axes.currencyDisplay ?? 'symbol',
        numberNotation: finalStyleOptions.base.style.axes.numberNotation ?? 'standard',
        minimumFractionDigits: finalStyleOptions.base.style.axes.minimumFractionDigits ?? 2,
        maximumFractionDigits: finalStyleOptions.base.style.axes.maximumFractionDigits ?? 8,
        maximumSignificantDigits: finalStyleOptions.base.style.axes.maximumSignificantDigits ?? 21,
        tickSize: finalStyleOptions.base.style.axes.tickSize ?? 0.01,
        autoPrecision: finalStyleOptions.base.style.axes.autoPrecision ?? false,
        unit: finalStyleOptions.base.style.axes.unit ?? '',
        unitPlacement: finalStyleOptions.base.style.axes.unitPlacement ?? 'suffix',
        drawingLineColor: finalStyleOptions.base.style.drawings.lineColor,
        drawingLineWidth: finalStyleOptions.base.style.drawings.lineWidth,
        drawingLineStyle: finalStyleOptions.base.style.drawings.lineStyle,
        drawingFillColor: finalStyleOptions.base.style.drawings.fillColor,
        drawingSelectedLineColor: finalStyleOptions.base.style.drawings.selected.lineColor,
        drawingSelectedLineStyle: finalStyleOptions.base.style.drawings.selected.lineStyle ?? 'dashed',
        drawingSelectedLineWidthAdd: finalStyleOptions.base.style.drawings.selected.lineWidthAdd ?? 1,
    }), [
        layoutOptions.showSidebar,
        layoutOptions.showTopBar,
        layoutOptions.timeFormat12h,
        finalStyleOptions.base.showHistogram,
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
        if (themeVariant === 'light') return finalStyleOptions;
        return deepMerge(finalStyleOptions, {
            base: {
                theme: 'dark',
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

    return (
        <ModeProvider>
            <GlobalStyle $pageBackground={themeVariant === 'dark' ? '#121212' : '#ffffff'}/>
            <MainAppWindow
                className={'chart-edge-root'}
                style={{backgroundColor: chartOptionsForStage.base.style.backgroundColor}}
            >
                <ChartStage
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
                    onToggleTheme={() => setThemeVariant((v) => (v === 'light' ? 'dark' : 'light'))}
                    symbol={symbol}
                    defaultSymbol={defaultSymbol}
                    onSymbolChange={onSymbolChange}
                    onSymbolSearch={onSymbolSearch}
                    themeVariant={themeVariant}
                />

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={handleSaveSettings}
                    initialSettings={currentSettingsData}
                    themeVariant={themeVariant}
                />
            </MainAppWindow>
        </ModeProvider>
    );
});