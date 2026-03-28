import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {generateAndDrawYTicks} from '../utils/generateTicks';
import { AxesStyleOptions } from "../../../types/chartOptions";
import { AxesPosition } from "../../../types/types";
import { StyledYAxisCanvas } from '../../../styles/YAxis.styles';

interface YAxisProps {
    yAxisPosition: AxesPosition;
    xAxisHeight: number;
    minPrice: number;
    maxPrice: number;
    numberOfYTicks: number;
    formatting: AxesStyleOptions;
}

export default function YAxis({
                                  yAxisPosition,
                                  minPrice,
                                  maxPrice,
                                  numberOfYTicks,
                                  formatting
                              }: YAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        const needResize = canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr);
        if (needResize) {
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
        }
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);

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
            5,
            formatting
        );
    };

    useLayoutEffect(() => {
        const el = canvasRef.current;
        if (!el) return;

        const ro = new ResizeObserver(() => {
            requestAnimationFrame(draw);
        });
        ro.observe(el);
        draw();
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        draw();
    }, [minPrice, maxPrice, numberOfYTicks, yAxisPosition, formatting]);

    return (
        <StyledYAxisCanvas className={'startPrice-axis-canvas'} ref={canvasRef} $position={yAxisPosition}/>
    );
}