import React, {useEffect, useMemo, useState} from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {Interval} from '../types/Interval';
import {TimeRange} from '../types/Graph';
import {DrawingPoint} from '../types/Drawings';
import {AxesPosition} from '../types/types';
import {ChartStyleOptions, ChartType, TimeDetailLevel} from '../types/chartStyleOptions';
import {ModeProvider} from '../contexts/ModeContext';
import {
    GlobalStyle,
    MainAppWindow,
    LowerContainer,
    ToolbarArea,
    ChartStageArea,
    SettingsArea
} from '../styles/App.styles';

export type SimpleChartEdgeProps = {
    intervalsArray?: Interval[];
    initialYAxisPosition?: AxesPosition;
    initialMargin?: number;
    initialNumberOfYTicks?: number;
    initialXAxisHeight?: number;
    initialYAxisWidth?: number;
    initialTimeDetailLevel?: TimeDetailLevel;
    initialTimeFormat12h?: boolean;
    initialVisibleTimeRange?: TimeRange;
    chartType?: ChartType;
    styleOptions?: Partial<ChartStyleOptions>;
};

const DEFAULT_STYLES: ChartStyleOptions = {
    candles: {
        bullColor: "#26a69a",
        bearColor: "#ef5350",
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderColor: "#333333",
        borderWidth: 1,
        bodyWidthFactor: 0.6,
        spacingFactor: 0.2,
    },
    line: {
        color: "#2962ff",
        lineWidth: 2,
    },
    area: {
        fillColor: "rgba(41, 98, 255, 0.2)",
        strokeColor: "rgba(41, 98, 255, 1)",
        lineWidth: 2,
    },
    histogram: {
        bullColor: "#26a69a",
        bearColor: "#ef5350",
        opacity: 0.5,
    },
    bar: {
        bullColor: "#26a69a",
        bearColor: "#ef5350",
        opacity: 0.7,
    },
    grid: {
        color: "#e0e0e0",
        lineWidth: 1,
        gridSpacing: 50,
        lineColor: "#e0e0e0",
        lineDash: [],
    },
    axes: {
        axisPosition: AxesPosition.left,
        textColor: "#424242",
        font: "12px Arial",
        lineColor: "#9e9e9e",
        lineWidth: 1,
        numberLocale: "en-US",
        dateLocale: "en-US",
        numberFractionDigits: 2,
    },
    backgroundColor: "#ffffff",
};

export default DEFAULT_STYLES;

function mergeStyles(defaults: ChartStyleOptions, overrides: Partial<ChartStyleOptions>): ChartStyleOptions {
    return {
        candles: {...defaults.candles, ...overrides.candles},
        line: {...defaults.line, ...overrides.line},
        area: {...defaults.area, ...overrides.area},
        histogram: {...defaults.histogram, ...overrides.histogram},
        bar: {...defaults.bar, ...overrides.bar},
        grid: {...defaults.grid, ...overrides.grid},
        axes: {...defaults.axes, ...overrides.axes},
        backgroundColor: overrides.backgroundColor ?? defaults.backgroundColor,
    };
}

export const SimpleChartEdge: React.FC<SimpleChartEdgeProps> = ({
                                                                    intervalsArray = [],
                                                                    initialYAxisPosition = AxesPosition.left,
                                                                    initialMargin = 20,
                                                                    initialNumberOfYTicks = 5,
                                                                    initialXAxisHeight = 40,
                                                                    initialYAxisWidth = 50,
                                                                    initialTimeDetailLevel = TimeDetailLevel.Auto,
                                                                    initialTimeFormat12h = false,
                                                                    initialVisibleTimeRange = {
                                                                        start: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000),
                                                                        end: Math.floor(Date.now() / 1000)
                                                                    },
                                                                    chartType = ChartType.Candlestick,
                                                                    styleOptions = {},
                                                                }) => {

    const finalStyleOptions = useMemo(() => mergeStyles(DEFAULT_STYLES, styleOptions), [styleOptions]);
    const [visibleRange, setVisibleRange] = useState<TimeRange>(initialVisibleTimeRange);

    // ⭐ 1. State for drawings now lives in the top-level component.
    const [drawings, setDrawings] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<null | number>(null);
    const [startPoint, setStartPoint] = useState<DrawingPoint | null>(null);

    useEffect(() => {
        setVisibleRange(initialVisibleTimeRange);
    }, [initialVisibleTimeRange]);

    return (
        <ModeProvider>
            <GlobalStyle/>
            <MainAppWindow>
                <SettingsArea>
                    <SettingsToolbar/>
                </SettingsArea>
                <LowerContainer>
                    <ToolbarArea>
                        <Toolbar/>
                    </ToolbarArea>
                    <ChartStageArea>
                        <ChartStage
                            intervalsArray={intervalsArray}
                            yAxisPosition={initialYAxisPosition}
                            numberOfYTicks={initialNumberOfYTicks}
                            xAxisHeight={initialXAxisHeight}
                            yAxisWidth={initialYAxisWidth}
                            timeDetailLevel={initialTimeDetailLevel}
                            timeFormat12h={initialTimeFormat12h}
                            visibleRange={visibleRange}
                            setVisibleRange={setVisibleRange}
                            chartType={chartType}
                            styleOptions={finalStyleOptions}
                            drawings={drawings}
                            isDrawing={isDrawing}
                            selectedIndex={selectedIndex}
                            startPoint={startPoint}
                            setDrawings={setDrawings}
                            setIsDrawing={setIsDrawing}
                            setSelectedIndex={setSelectedIndex}
                            setStartPoint={setStartPoint}
                        />
                    </ChartStageArea>
                </LowerContainer>
            </MainAppWindow>
        </ModeProvider>
    );
};