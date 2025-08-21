import { getYAxisPriceRange } from '../utils/priceRangeUtils';
import React, {useEffect, useRef} from 'react';
import {generateAndDrawYTicks} from '../utils/generateTicks';
import {CanvasSizes} from "../ChartStage";
import {StyledYAxisCanvas} from '../../../styles/YAxis.styles';
import {PriceRange} from "../../../types/Graph";
import {ChartType} from '../../../types/chartStyleOptions';
import {Interval} from "../../../types/Interval";

interface YAxisProps {
    parentContainerRef: React.RefObject<HTMLDivElement | null>;
    intervalsArray: Interval[];
    canvasSizes: CanvasSizes;
    yAxisPosition: 'left' | 'right';
    xAxisHeight: number;
    yAxisWidth: number;
    minPrice: number;
    maxPrice: number;
    numberOfYTicks: number;
    initialVisiblePriceRange: PriceRange;
    chartType: ChartType;

}

export default function YAxis({
                                  parentContainerRef,
                                  intervalsArray,
                                  canvasSizes,
                                  yAxisWidth,
                                  xAxisHeight,
                                  yAxisPosition,
                                  minPrice,
                                  maxPrice,
                                  numberOfYTicks,
                                  initialVisiblePriceRange,
                                  chartType
                              }: YAxisProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const dpr = window.devicePixelRatio || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const y_axis_canvas_height = canvas.clientHeight;
        const y_axis_canvas_width = canvas.clientWidth;

        canvas.height = y_axis_canvas_height * dpr;
        canvas.width = y_axis_canvas_width * dpr;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { min: priceMin, max: priceMax } = getYAxisPriceRange(
            intervalsArray,
            chartType
        );

        generateAndDrawYTicks(
            canvas,
            priceMin,
            priceMax,
            numberOfYTicks,
            xAxisHeight,
            yAxisPosition,
            'black',
            'black',
            '12px Arial',
            5,
            5
        );
    }, [parentContainerRef, yAxisWidth, minPrice, maxPrice, numberOfYTicks, yAxisPosition, dpr, canvasSizes, chartType, initialVisiblePriceRange]);

    return (
        <StyledYAxisCanvas ref={canvasRef} $position={yAxisPosition}/>
    );
}