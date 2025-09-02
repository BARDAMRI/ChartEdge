import React, { useMemo, useState} from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {Interval} from '../types/Interval';
import {TimeRange} from '../types/Graph';
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
        lineWidth: 1,
        lineStyle: "solid",
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
        showOverlayLine: false,
        showHistogram: true,
        style: DEFAULT_STYLES,
        overlays: [],
    },
    axes: {
        yAxisPosition: AxesPosition.left,
        currency: 'USD',
        numberOfYTicks: 5,
    }

};

export const SimpleChartEdge: React.FC<SimpleChartEdgeProps> = ({
                                                                    intervalsArray = [],
                                                                    initialNumberOfYTicks = 5,
                                                                    initialTimeDetailLevel = TimeDetailLevel.Auto,
                                                                    initialTimeFormat12h = false,
                                                                    chartType = ChartType.Candlestick,
                                                                    chartOptions = {} as DeepPartial<ChartOptions>
                                                                }) => {

    const finalStyleOptions: DeepRequired<ChartOptions> = useMemo(() => deepMerge(DEFAULT_GRAPH_OPTIONS, chartOptions), [chartOptions]);
    const [drawings, setDrawings] = useState<any[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<null | number>(null);

    return (
        <ModeProvider>
            <GlobalStyle/>
            <MainAppWindow>
                <SettingsArea className={"settings-area"}>
                    <SettingsToolbar/>
                </SettingsArea>
                <LowerContainer className={"lower-container"}>
                    <ToolbarArea className={"toolbar-area"}>
                        <Toolbar/>
                    </ToolbarArea>
                    <ChartStageArea className={"chart-stage-area"}>
                        <ChartStage
                            intervalsArray={intervalsArray}
                            numberOfYTicks={initialNumberOfYTicks}
                            timeDetailLevel={initialTimeDetailLevel}
                            timeFormat12h={initialTimeFormat12h}
                            chartType={chartType}
                            drawings={drawings}
                            isDrawing={isDrawing}
                            selectedIndex={selectedIndex}
                            setIsDrawing={setIsDrawing}
                            chartOptions={finalStyleOptions}
                        />
                    </ChartStageArea>
                </LowerContainer>
            </MainAppWindow>
        </ModeProvider>
    );
};