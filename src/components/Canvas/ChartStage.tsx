import React, {useRef} from 'react';
import {ChartCanvas} from './ChartCanvas';
import {useChartStore} from "../../store/useChartStore.ts";
import XAxis from "./Axes/XAxis.tsx";
import YAxis from "./Axes/YAxis.tsx";

export const ChartStage: React.FC = () => {
    const yAxisPosition = useChartStore(state => state.yAxisPosition);
    const padding = useChartStore(state => state.padding);
    const xAxisHeight = useChartStore(state => state.xAxisHeight);

    const containerRef = useRef<HTMLDivElement | null>(null);

    return (
        <div
            ref={containerRef}
            className="chart-stage-container grid w-full h-full"
            style={{
                gridTemplateColumns: yAxisPosition === 'left' ? `40px 1fr` : `1fr 40px`,
                gridTemplateRows: `1fr 40px`,
                padding,
            }}
        >
            {yAxisPosition === 'left' && (
                <div className="right-y-axis-container relative">
                    <YAxis containerRef={containerRef}/>
                </div>
            )}

            <div className="canvas-axis-container relative">
                <ChartCanvas parentContainerRef={containerRef}/>
                <div className="x-axis-container absolute bottom-0 left-0 w-full" style={{height: `${xAxisHeight}px`}}>
                    <XAxis containerRef={containerRef}/>
                </div>
            </div>

            {yAxisPosition === 'right' && (
                <div className="left-y-axis-container relative">
                    <YAxis containerRef={containerRef}/>
                </div>
            )}
        </div>
    );
};