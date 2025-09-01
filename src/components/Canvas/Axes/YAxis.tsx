import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {generateAndDrawYTicks} from '../utils/generateTicks';
import {StyledYAxisCanvas} from '../../../styles/YAxis.styles';
import {AxesPosition} from "../../../types/types";

interface YAxisProps {
    yAxisPosition: AxesPosition;
    xAxisHeight: number;
    minPrice: number;
    maxPrice: number;
    numberOfYTicks: number;
}

export default function YAxis({
                                  yAxisPosition,
                                  minPrice,
                                  maxPrice,
                                  numberOfYTicks,
                              }: YAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Sync backing store to CSS size * DPR
        const needResize = canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr);
        if (needResize) {
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
        }
        // Ensure CSS size stays in CSS px (grid manages layout)
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Work in CSS pixels for crisp HiDPI rendering
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);

        // IMPORTANT for grid layout: Y axis container sits only in row 1, so its height already excludes X-axis.
        // Therefore, pass 0 for xAxisHeight into the tick generator to avoid double-reserving space.
        generateAndDrawYTicks(
            canvas,
            minPrice,
            maxPrice,
            numberOfYTicks,
            yAxisPosition,
            'black',
            'black',
            '12px Arial',
            5,
            5
        );
    };

    // Redraw on canvas size changes driven by CSS Grid
    useLayoutEffect(() => {
        const el = canvasRef.current;
        if (!el) return;

        const ro = new ResizeObserver(() => {
            // coalesce to animation frame to avoid multiple redraws per layout
            requestAnimationFrame(draw);
        });
        ro.observe(el);
        // initial draw
        draw();
        return () => ro.disconnect();
    }, []);

    // Redraw when data props change (price range, ticks, position)
    useEffect(() => {
        draw();
    }, [minPrice, maxPrice, numberOfYTicks, yAxisPosition]);

    return (
        <StyledYAxisCanvas className={'y-axis-canvas'} ref={canvasRef} $position={yAxisPosition}/>
    );
}