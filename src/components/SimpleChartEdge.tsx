import React, {useEffect, useMemo, useState, forwardRef, useImperativeHandle, useRef} from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {SettingsModal, SettingsState} from './SettingsModal/SettingsModal';
import {Interval} from '../types/Interval';
import {TimeRange} from '../types/Graph';
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
    chartOptions?: DeepPartial<ChartOptions>;
    showSidebar?: boolean;
    showTopBar?: boolean;
    /** When false hides the settings gear icon even if the top toolbar is visible */
    showSettingsBar?: boolean;
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
                                                                                        }, ref) => {

    const [finalStyleOptions, setStyleOptions] = useState<DeepRequired<ChartOptions>>(deepMerge(DEFAULT_GRAPH_OPTIONS, chartOptions));
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
    ]) as SettingsState;

    return (
        <ModeProvider>
            <GlobalStyle/>
            <MainAppWindow className={'chart-edge-root'}>
                <ChartStage
                    ref={stageRef}
                    intervalsArray={intervalsArray}
                    numberOfYTicks={finalStyleOptions.axes.numberOfYTicks}
                    timeDetailLevel={initialTimeDetailLevel}
                    timeFormat12h={layoutOptions.timeFormat12h}
                    selectedIndex={selectedIndex}
                    chartOptions={finalStyleOptions}
                    showTopBar={layoutOptions.showTopBar}
                    showLeftBar={layoutOptions.showSidebar}
                    handleChartTypeChange={handleChartTypeChange}
                    openSettingsMenu={() => setIsSettingsOpen(true)}
                    showSettingsBar={layoutOptions.showSettingsBar}
                />

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={handleSaveSettings}
                    initialSettings={currentSettingsData}
                />
            </MainAppWindow>
        </ModeProvider>
    );
});