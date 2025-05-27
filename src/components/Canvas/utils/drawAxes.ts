// ייבוא או הגדרת generateTimeTicks
import { generateTimeTicks } from './generateTimeTicks';
import {Candle} from "../../../types/Candle.ts";
import {useChartStore} from '../../../store/useChartStore';

export function drawAxes(
    ctx: CanvasRenderingContext2D,
    candles: Candle[],
) {
    const {
        padding,
        visibleRange,
        minPrice,
        maxPrice,
        yAxisPosition,
        numberOfYTicks,
        numberOfXTicks,
        timeFormat,
        priceDecimalPlaces,
        timeDetailLevel,
        canvasWidth,
        canvasHeight,
    } = useChartStore.getState?.();

    const chartWidth = canvasWidth - 2 * padding;
    const chartHeight = canvasHeight - 2 * padding;

    const xStart = padding;
    const xEnd = canvasWidth - padding;
    const yStart = padding;
    const yEnd = canvasHeight - padding;

    const yAxisX = yAxisPosition === 'left' ? padding : canvasWidth - padding;

    function formatUnixTime(unixTime: number): string {
        const date = new Date(unixTime);
        const options: Intl.DateTimeFormatOptions = timeFormat;
        return new Intl.DateTimeFormat('default', options).format(date);
    }

    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.lineWidth = 2;
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';

    // ציור קו ציר Y
    ctx.beginPath();
    ctx.moveTo(yAxisX, yStart);
    ctx.lineTo(yAxisX, yEnd);
    ctx.stroke();

    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    // ציור קו ציר X
    ctx.beginPath();
    ctx.moveTo(xStart, yEnd);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();

    // ציור ערכי ביניים בציר Y
    const step = (maxPrice - minPrice) / (numberOfYTicks - 1);

    for (let i = 0; i < numberOfYTicks; i++) {
        const value = minPrice + i * step;
        const y = yEnd - (i * chartHeight / (numberOfYTicks - 1));

        const formattedValue = value.toFixed(priceDecimalPlaces);
        const offset = (formattedValue.length) * 5;
        const xPos = yAxisPosition === 'left' ? yAxisX - offset : yAxisX + offset;

        ctx.fillText(formattedValue, xPos, y - 5);

        ctx.beginPath();
        ctx.moveTo(yAxisX - (yAxisPosition === 'left' ? 5 : -5), y);
        ctx.lineTo(yAxisX, y);
        ctx.stroke();

    }

    // ציור ערכי ביניים בציר X עם שימוש ב-generateTimeTicks
    const timeRange = visibleRange.end - visibleRange.start;
    if (timeRange <= 0) return;

    ctx.textAlign = 'center';

    const ticks = generateTimeTicks(
        visibleRange.start,
        visibleRange.end,
        chartWidth,
        timeDetailLevel
    );

    ticks.forEach(({ time, label }) => {
        const x = xStart + ((time - visibleRange.start) / (visibleRange.end - visibleRange.start)) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, yEnd);
        ctx.lineTo(x, yEnd + 7);
        ctx.stroke();
        ctx.fillText(label, x, yEnd + 10);
    });
}