import React, {useMemo, useState} from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {Interval} from '../types/Interval';
import {TimeRange} from '../types/Graph';
import {AxesPosition, ChartTheme, DeepPartial, DeepRequired} from '../types/types';
import {
    AreaStyleOptions,
    AxesStyleOptions,
    BarStyleOptions,
    CandleStyleOptions,
    ChartOptions,
    ChartType, GridStyleOptions, HistogramStyleOptions, LineStyleOptions,
    StyleOptions,
    TimeDetailLevel
} from '../types/chartOptions';
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
import {OverlayOptions} from "../types/overlay";
import {DrawingStyleOptions} from "../types/Drawings";
import {DEFAULT_GRAPH_OPTIONS} from "./DefaultData";


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
                            setDrawings={setDrawings}
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