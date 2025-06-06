import React, {useEffect, useRef} from 'react';
import {useChartStore} from '../../../store/useChartStore.ts';
import {generateTimeTicks} from '../utils/generateTimeTicks.ts';
import {CanvasSizes} from "../ChartStage.tsx";

interface XAxisProps {
    canvasSizes: CanvasSizes;
    parentContainerRef?: React.RefObject<HTMLDivElement>;
}

export default function XAxis({canvasSizes, parentContainerRef = null}: XAxisProps) {

    const xAxisHeight = useChartStore(state => state.xAxisHeight);
    const visibleRange = useChartStore(state => state.visibleRange);
    const timeDetailLevel = useChartStore(state => state.timeDetailLevel);
    const timeFormat12h = useChartStore(state => state.timeFormat12h);


    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dpr = window.devicePixelRatio || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const x_axis_canvas_width = canvas.clientWidth;
        const x_axis_canvas_height = canvas.clientHeight;

        canvas.width = x_axis_canvas_width * dpr;
        canvas.height = x_axis_canvas_height * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, x_axis_canvas_width * dpr, x_axis_canvas_height * dpr);

        // Draw X-axis line
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.font = `${12 * dpr}px Arial`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x_axis_canvas_width, 0);
        ctx.stroke();

        // // Generate and draw ticks
        // const ticks = generateTimeTicks(
        //     visibleRange.start,
        //     visibleRange.end,
        //     x_axis_canvas_width,
        //     timeDetailLevel,
        //     timeFormat12h
        // );
        //
        // ticks.forEach(({time, label}) => {
        //     const x = padding + ((time - visibleRange.start) / (visibleRange.end - visibleRange.start)) * x_axis_canvas_width;
        //
        //     // Draw tick mark
        //     ctx.beginPath();
        //     ctx.moveTo(x, 0);
        //     ctx.lineTo(x, 5);
        //     ctx.stroke();
        //
        //     // Draw label
        //     ctx.fillText(label, x, 12);
        // });
    }, [xAxisHeight, parentContainerRef, visibleRange, timeDetailLevel, timeFormat12h, dpr, canvasSizes]);

    return (
        <canvas
            className={`x-canvas relative block bottom-0 left-0 w-full h-full p-0 m-0 bg-white border-none pointer-events-none`}
            ref={canvasRef}
        />
    );
}
