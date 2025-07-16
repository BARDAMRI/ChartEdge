import React, {useEffect, useRef} from 'react';
import {CanvasSizes} from "../ChartStage";
import {TimeRange} from "../../../types/Graph";
import {TimeDetailLevel} from "../../../types/chartStyleOptions";

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
                                  parentContainerRef ,
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

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // Draw X-axis line
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.font = `${12}px Arial`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.stroke();

        // TODO: Uncomment and implement ticks drawing using visibleRange, timeDetailLevel, timeFormat12h
        // const ticks = generateTimeTicks(
        //     visibleRange.start,
        //     visibleRange.end,
        //     width,
        //     timeDetailLevel,
        //     timeFormat12h
        // );
        // ticks.forEach(({ time, label }) => {
        //     const x = ((time - visibleRange.start) / (visibleRange.end - visibleRange.start)) * width;
        //     ctx.beginPath();
        //     ctx.moveTo(x, 0);
        //     ctx.lineTo(x, 5);
        //     ctx.stroke();
        //     ctx.fillText(label, x, 12);
        // });
    }, [xAxisHeight, visibleRange, timeDetailLevel, timeFormat12h, canvasSizes, parentContainerRef]);

    return (
        <canvas
            className="x-canvas relative block bottom-0 left-0 w-full h-full p-0 m-0 bg-white border-none pointer-events-none"
            ref={canvasRef}
            style={{height: xAxisHeight}}
        />
    );
}
