import React, {useEffect, useRef} from 'react';
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
                                  xAxisHeight,
                                  minPrice,
                                  maxPrice,
                                  numberOfYTicks,
                              }: YAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
        }
        // Set the canvas style size to match the logical size for crisp rendering
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Reset transform and apply devicePixelRatio scaling in one step (for crisp Hi-DPI rendering)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Directly use the minPrice and maxPrice passed from the parent
        generateAndDrawYTicks(
            canvas,
            minPrice,
            maxPrice,
            numberOfYTicks,
            xAxisHeight,
            yAxisPosition,
            'black',
            'black',
            '12px Arial',
            5,
            5
        );
    }, [minPrice, maxPrice, numberOfYTicks, yAxisPosition, xAxisHeight]);

    return (
        <StyledYAxisCanvas ref={canvasRef} $position={yAxisPosition}/>
    );
}