import React, {useEffect, useRef} from 'react';
import {DrawTicksOptions, TimeRange} from "../../../types/Graph";
import {AxesStyleOptions, TimeDetailLevel} from "../../../types/chartOptions";
import {StyledXAxisCanvas} from "../../../styles/XAxis.styles";
import {generateAndDrawTimeTicks} from '../utils/generateTicks';
import {CanvasSizes} from "../../../types/types";

interface XAxisProps {
    canvasSizes: CanvasSizes;
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    xAxisHeight: number;
    visibleRange: TimeRange;
    timeDetailLevel: TimeDetailLevel;
    timeFormat12h: boolean;
    formatting: AxesStyleOptions;
    dateFormat?: string;
    locale: string;
    timezone?: string;
}

export default function XAxis({
                                  canvasSizes,
                                  xAxisHeight,
                                  visibleRange,
                                  timeDetailLevel,
                                  timeFormat12h,
                                  formatting,
                                  dateFormat = 'MMM d',
                                  locale = 'en-US',
                                  timezone
                              }: XAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dpr = window.devicePixelRatio || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        generateAndDrawTimeTicks(
            canvas,
            visibleRange,
            100,
            dateFormat,
            timeFormat12h,
            xAxisHeight,
            formatting.lineColor,
            timeDetailLevel,
            {
                tickHeight: 8,
                labelOffset: 4,
                labelFont: formatting.font,
                tickColor: formatting.lineColor,
                labelColor: formatting.textColor,
                axisY: 0
            } as DrawTicksOptions,
            locale,
            timezone
        );
    }, [xAxisHeight, visibleRange, timeDetailLevel, timeFormat12h, canvasSizes, dpr, dateFormat, locale, formatting]);

    return <StyledXAxisCanvas className={'startTime-Axis-Canvas'} ref={canvasRef} $height={xAxisHeight}/>;
}