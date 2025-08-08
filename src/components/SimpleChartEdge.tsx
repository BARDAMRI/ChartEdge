import React, {useEffect} from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import {Candle} from '../types/Candle';
import {TimeRange} from '../types/Graph';
import {AxesPosition} from '../types/types';
import {ChartType, TimeDetailLevel} from '../types/chartStyleOptions';
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
    intervalsArray?: Candle[];
    initialYAxisPosition?: AxesPosition;
    initialMargin?: number;
    initialNumberOfYTicks?: number;
    initialXAxisHeight?: number;
    initialYAxisWidth?: number;
    initialTimeDetailLevel?: TimeDetailLevel;
    initialTimeFormat12h?: boolean;
    initialVisibleTimeRange?: TimeRange;
    initialVisiblePriceRange?: { min: number; max: number };
    chartType?: ChartType;
    interval?: string;

};

export const SimpleChartEdge: React.FC<SimpleChartEdgeProps> = ({
                                                                    intervalsArray = [],
                                                                    initialYAxisPosition = AxesPosition.left!,
                                                                    initialMargin = 20,
                                                                    initialNumberOfYTicks = 5,
                                                                    initialXAxisHeight = 40,
                                                                    initialYAxisWidth = 50,
                                                                    initialTimeDetailLevel = TimeDetailLevel.Auto,
                                                                    initialTimeFormat12h = false,
                                                                    initialVisibleTimeRange = {
                                                                        start: Date.now() - 7 * 24 * 60 * 60 * 1000,
                                                                        end: Date.now()
                                                                    },
                                                                    initialVisiblePriceRange = {
                                                                        min: 0,
                                                                        max: 100
                                                                    },
                                                                    chartType = ChartType.Candlestick,
                                                                    interval = '1h',
                                                                }) => {

    const [visibleRange, setVisibleRange] = React.useState<TimeRange>(initialVisibleTimeRange);

    useEffect(() => {
        setVisibleRange(initialVisibleTimeRange);
    }, [initialVisibleTimeRange]);

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
                            initialYAxisPosition={initialYAxisPosition}
                            initialMargin={initialMargin}
                            initialNumberOfYTicks={initialNumberOfYTicks}
                            initialXAxisHeight={initialXAxisHeight}
                            initialYAxisWidth={initialYAxisWidth}
                            initialTimeDetailLevel={initialTimeDetailLevel}
                            initialTimeFormat12h={initialTimeFormat12h}
                            visibleRange={visibleRange}
                            setVisibleRange={(range: TimeRange) => setVisibleRange(range)}
                            initialVisiblePriceRange={initialVisiblePriceRange}
                            chartType={chartType}
                            interval={interval}
                        />
                    </ChartStageArea>
                </LowerContainer>
            </MainAppWindow>
        </ModeProvider>
    );
};