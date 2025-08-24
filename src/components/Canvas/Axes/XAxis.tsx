import React, {useEffect, useRef} from 'react';
import {CanvasSizes} from "../ChartStage";
import {DrawTicksOptions, TimeRange} from "../../../types/Graph";
import {TimeDetailLevel} from "../../../types/chartStyleOptions";
import {StyledXAxisCanvas} from "../../../styles/XAxis.styles";
import {generateAndDrawTimeTicks} from '../utils/generateTicks';

interface XAxisProps {
    canvasSizes: CanvasSizes;
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    xAxisHeight: number;
    visibleRange: TimeRange;
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
}

export default function XAxis({
                                  canvasSizes,
                                  xAxisHeight,
                                  visibleRange,
                                  timeDetailLevel,
                                  timeFormat12h,
                              }: XAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dpr = window.devicePixelRatio || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set proper canvas resolution
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        // Apply devicePixelRatio in one step for crisp rendering and to avoid accumulating scales
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        //  Call tick generator and drawer
        generateAndDrawTimeTicks(
            canvas,
            visibleRange,
            100,
            'dd/MM/yyyy HH:mm',
            timeFormat12h,
            xAxisHeight,
            'black',
            timeDetailLevel,
            {
                tickHeight: 8,
                labelOffset: 4,
                labelFont: '10px Arial',
                axisY: 0
            } as DrawTicksOptions
        );
    }, [xAxisHeight, visibleRange, timeDetailLevel, timeFormat12h, canvasSizes, dpr]);

    return <StyledXAxisCanvas ref={canvasRef} $height={xAxisHeight}/>;
}