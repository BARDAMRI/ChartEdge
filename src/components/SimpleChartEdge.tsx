import React, {useEffect, useMemo, useState} from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {Interval} from '../types/Interval';
import {TimeRange} from '../types/Graph';
import {DrawingPoint} from '../types/Drawings';
import {AxesPosition, DeepPartial, DeepRequired} from '../types/types';
import {ChartOptions, ChartType, StyleOptions, TimeDetailLevel} from '../types/chartOptions';
import {ModeProvider} from '../contexts/ModeContext';
import {deepMerge} from "../utils/deepMerge";
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
    initialMargin?: number;
    initialNumberOfYTicks?: number;
    initialXAxisHeight?: number;
    initialYAxisWidth?: number;
    initialTimeDetailLevel?: TimeDetailLevel;
    initialTimeFormat12h?: boolean;
    initialVisibleTimeRange?: TimeRange;
    chartType?: ChartType;
    chartOptions?: DeepPartial<ChartOptions>
};

const DEFAULT_STYLES: DeepRequired<StyleOptions> = {
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
        heightRatio: 0.3,
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
    overlay: {
        lineColor: "#ff9800",
        lineWidth: 1
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
    showGrid: true,
};

export const DEFAULT_GRAPH_OPTIONS: DeepRequired<ChartOptions> = {
    base: {
        theme: 'light',
        showOverlayLine: true,
        showHistogram: true,
        style: DEFAULT_STYLES,
    },
    axes: {
        yAxisPosition: AxesPosition.left,
        currency: 'USD',
        numberOfYTicks: 5,
    }

};

export const SimpleChartEdge: React.FC<SimpleChartEdgeProps> = ({
                                                                    intervalsArray = [],
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
                                                                    chartOptions = {} as DeepPartial<ChartOptions>
                                                                }) => {

    const finalStyleOptions: DeepRequired<ChartOptions> = useMemo(() => deepMerge(DEFAULT_GRAPH_OPTIONS, chartOptions), [chartOptions]);
    const [visibleRange, setVisibleRange] = useState<TimeRange>(initialVisibleTimeRange);
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
                            numberOfYTicks={initialNumberOfYTicks}
                            xAxisHeight={initialXAxisHeight}
                            yAxisWidth={initialYAxisWidth}
                            timeDetailLevel={initialTimeDetailLevel}
                            timeFormat12h={initialTimeFormat12h}
                            visibleRange={visibleRange}
                            setVisibleRange={setVisibleRange}
                            chartType={chartType}
                            drawings={drawings}
                            isDrawing={isDrawing}
                            selectedIndex={selectedIndex}
                            startPoint={startPoint}
                            setDrawings={setDrawings}
                            setIsDrawing={setIsDrawing}
                            setSelectedIndex={setSelectedIndex}
                            setStartPoint={setStartPoint}
                            chartOptions={finalStyleOptions}
                        />
                    </ChartStageArea>
                </LowerContainer>
            </MainAppWindow>
        </ModeProvider>
    );
};