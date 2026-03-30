import React, {useCallback, useLayoutEffect, useRef} from 'react';
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

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        if (width <= 0 || height <= 0) return;

        const needResize =
            canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr);
        if (needResize) {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
        }
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

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
    }, [
        visibleRange.start,
        visibleRange.end,
        timeDetailLevel,
        timeFormat12h,
        xAxisHeight,
        canvasSizes.width,
        canvasSizes.height,
        dateFormat,
        locale,
        timezone,
        formatting.font,
        formatting.lineColor,
        formatting.textColor,
    ]);

    useLayoutEffect(() => {
        const el = canvasRef.current;
        if (!el) return;

        const ro = new ResizeObserver(() => {
            requestAnimationFrame(() => draw());
        });
        ro.observe(el);
        draw();
        return () => ro.disconnect();
    }, [draw]);

    return <StyledXAxisCanvas className={'startTime-Axis-Canvas'} ref={canvasRef} $height={xAxisHeight}/>;
}