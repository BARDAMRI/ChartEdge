import React, {useEffect, useRef} from 'react';
import {CanvasSizes} from "../ChartStage";

interface YAxisProps {
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    canvasSizes: CanvasSizes;
    yAxisPosition: 'left' | 'right';
    xAxisHeight: number;
    yAxisWidth: number;
    minPrice: number;
    maxPrice: number;
    numberOfYTicks: number;
}

export default function YAxis({
                                  parentContainerRef,
                                  canvasSizes,
                                  yAxisWidth,
                                  xAxisHeight,
                                  yAxisPosition,
                                  minPrice,
                                  maxPrice,
                                  numberOfYTicks
                              }: YAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dpr = window.devicePixelRatio || 1;

    function calculateTicks(): { y: number; value: number }[] {
        const y_axis_height = parentContainerRef?.current?.clientHeight || 0;
        const y_axis_width = yAxisWidth || 40; // Default width if not set
        const step = (maxPrice - minPrice) / (numberOfYTicks - 1);
        //TODO complete this function.
        return []
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const y_axis_canvas_height = canvas.clientHeight;
        const y_axis_canvas_width = canvas.clientWidth; // Default width if not set

        canvas.height = y_axis_canvas_height * dpr;
        canvas.width = y_axis_canvas_width * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.font = `${12 * dpr}px Arial`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = yAxisPosition === 'left' ? 'right' : 'left';

        ctx.beginPath();
        ctx.moveTo(y_axis_canvas_width, (y_axis_canvas_height - xAxisHeight + 1));
        ctx.lineTo(y_axis_canvas_width, 0);
        ctx.stroke();

        // const ticks = calculateTicks();
        // ticks.forEach(({y, value}) => {
        //     ctx.beginPath();
        //     ctx.moveTo(yAxisX, y);
        //     ctx.lineTo(yAxisPosition === 'left' ? yAxisX - 5 : yAxisX + 5, y);
        //     ctx.stroke();
        //
        //     const text = value.toFixed(2);
        //     const textWidth = ctx.measureText(text).width;
        //     const offsetX = yAxisPosition === 'left' ? yAxisX - 10 - textWidth : yAxisX + 10;
        //
        //     ctx.fillText(text, offsetX, y);
        // });
    }, [parentContainerRef, yAxisWidth, minPrice, maxPrice, numberOfYTicks, yAxisPosition, dpr, canvasSizes]);

    return (
        <canvas
            className={`y-canvas block relative left-${yAxisPosition === 'left' ? 0 : 'auto'} right-${yAxisPosition === 'right' ? 0 : 'auto'} top-0 bottom-0 pointer-events-none w-[100%] h-[100%]`}
            ref={canvasRef}
        />
    );
}