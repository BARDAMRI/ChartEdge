import React from 'react';
import {ChartStage} from './Canvas/ChartStage';
import {Toolbar} from './Toolbar/Toolbar';
import {SettingsToolbar} from './Toolbar/SettingsToolbar';
import '../styles/App.scss';
import {Candle} from "../types/Candle";
import {TimeRange} from "../types/Graph";
import {AxesPosition} from "../types/types";
import {TimeDetailLevel} from "../types/chartStyleOptions";


export type SimpleChartEdgeProps = {
    initialCandles?: Candle[];                      // Optional array of candles data
    initialYAxisPosition?: AxesPosition;            // Optional enum for Y axis position (left/right)
    initialMargin?: number;                          // Optional margin value
    initialNumberOfYTicks?: number;                  // Optional number of ticks on Y axis
    initialXAxisHeight?: number;                     // Optional height of X axis
    initialYAxisWidth?: number;                      // Optional width of Y axis
    initialTimeDetailLevel?: TimeDetailLevel;       // Optional time detail enum (auto, low, medium, high)
    initialTimeFormat12h?: boolean;                  // Optional flag for 12h or 24h time format
    initialVisibleRange?: TimeRange;                 // Optional visible range for the time axis
}

export const SimpleChartEdge: React.FC<SimpleChartEdgeProps> = ({
                                                                    initialCandles = [],
                                                                    initialYAxisPosition = AxesPosition.left,
                                                                    initialMargin = 20,
                                                                    initialNumberOfYTicks = 5,
                                                                    initialXAxisHeight = 40,
                                                                    initialYAxisWidth = 50,
                                                                    initialTimeDetailLevel = TimeDetailLevel.Auto,
                                                                    initialTimeFormat12h = false,
                                                                    initialVisibleRange = {
                                                                        start: Date.now() - 7 * 24 * 60 * 60 * 1000,
                                                                        end: Date.now()
                                                                    },
                                                                }) => {
    return (
        <div className={'main-app-window flex flex-col h-full w-full p-0 m-0'}>
            <div className={'settings-area'}>
                <SettingsToolbar/>
            </div>
            <div className={'lower-container flex flex-1'}>
                <div className={'toolbar-area'}>
                    <Toolbar/>
                </div>
                <div className={'chart-stage-area flex-1 h-full'}>
                    <ChartStage
                        initialCandles={initialCandles}
                        initialYAxisPosition={initialYAxisPosition}
                        initialMargin={initialMargin}
                        initialNumberOfYTicks={initialNumberOfYTicks}
                        initialXAxisHeight={initialXAxisHeight}
                        initialYAxisWidth={initialYAxisWidth}
                        initialTimeDetailLevel={initialTimeDetailLevel}
                        initialTimeFormat12h={initialTimeFormat12h}
                        initialVisibleRange={initialVisibleRange}
                    />
                </div>
            </div>
        </div>
    );
};