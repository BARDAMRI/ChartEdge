import {ChartType} from "../../../types/chartStyleOptions";
import type {Candle} from "../../../types/Candle";
import {TimeRange} from "../../../types/Graph";

export function drawCandlestickChart(ctx: CanvasRenderingContext2D, candles: Candle[], width: number, height: number, visibleRange: TimeRange, intervalMs: number) {
    if (candles.length === 0) return;

    const padding = 10;
    const maxPrice = Math.max(...candles.map(c => c.h));
    const minPrice = Math.min(...candles.map(c => c.l));
    const priceRange = maxPrice - minPrice;

    const candleWidth = width / candles.length;

    candles.forEach((candle) => {
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= width + candleWidth / 2) return;

        const openY = height - ((candle.o - minPrice) / priceRange) * (height - padding * 2) - padding;
        const closeY = height - ((candle.c - minPrice) / priceRange) * (height - padding * 2) - padding;
        const highY = height - ((candle.h - minPrice) / priceRange) * (height - padding * 2) - padding;
        const lowY = height - ((candle.l - minPrice) / priceRange) * (height - padding * 2) - padding;

        const isBullish = candle.c > candle.o;
        ctx.strokeStyle = isBullish ? 'green' : 'red';
        ctx.fillStyle = isBullish ? 'green' : 'red';

        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(openY - closeY);
        console.log('drawing new candle from x:', x, ' to x: ', x + candleWidth, ' bodyTop:', bodyTop, ' bodyHeight:', bodyHeight);
        ctx.fillRect(x + 1, bodyTop, candleWidth - 2, bodyHeight || 1);
    });
}

export function drawLineChart(ctx: CanvasRenderingContext2D, candles: Candle[], width: number, height: number, visibleRange: TimeRange, intervalMs: number) {
    if (candles.length === 0) return;

    const padding = 10;
    const maxPrice = Math.max(...candles.map(c => c.h));
    const minPrice = Math.min(...candles.map(c => c.l));
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'blue';

    candles.forEach((candle, index) => {
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= width + candleWidth / 2) return;

        const priceY = height - ((candle.c - minPrice) / priceRange) * (height - padding * 2) - padding;

        if (index === 0 || x < 0) {
            ctx.moveTo(x, priceY);
        } else {
            ctx.lineTo(x, priceY);
        }
    });

    ctx.stroke();
}

export function drawAreaChart(ctx: CanvasRenderingContext2D, candles: Candle[], width: number, height: number, visibleRange: TimeRange, intervalMs: number) {
    if (candles.length === 0) return;

    const padding = 10;
    const maxPrice = Math.max(...candles.map(c => c.h));
    const minPrice = Math.min(...candles.map(c => c.l));
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    ctx.beginPath();
    ctx.moveTo(0, height);

    candles.forEach((candle) => {
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= width + candleWidth / 2) return;

        const priceY = height - ((candle.c - minPrice) / priceRange) * (height - padding * 2) - padding;
        ctx.lineTo(x, priceY);
    });

    ctx.lineTo(width, height);
    ctx.closePath();

    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.strokeStyle = 'rgba(0, 123, 255, 1)';
    ctx.fill();
    ctx.stroke();
}

export function drawBarChart(
    ctx: CanvasRenderingContext2D,
    candles: Candle[],
    width: number,
    height: number,
    visibleRange: TimeRange,
    intervalMs: number
) {
    if (candles.length === 0) return;

    const padding = 10;
    const maxPrice = Math.max(...candles.map(c => c.h));
    const minPrice = Math.min(...candles.map(c => c.l));
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    candles.forEach(candle => {
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= width + candleWidth / 2) return;

        const openY = height - ((candle.o - minPrice) / priceRange) * (height - padding * 2) - padding;
        const closeY = height - ((candle.c - minPrice) / priceRange) * (height - padding * 2) - padding;

        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, openY);
        ctx.lineTo(x + candleWidth / 2, closeY);
        ctx.stroke();
    });
}

export function drawHistogramChart(
    ctx: CanvasRenderingContext2D,
    candles: Candle[],
    width: number,
    height: number,
    visibleRange: TimeRange,
    intervalMs: number
) {
    if (candles.length === 0) return;

    const padding = 10;
    const values = candles.map(c => c.v!).filter((v): v is number => v !== undefined);
    const maxValue = Math.max(...values);
    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    candles.forEach((candle, index) => {
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= width + candleWidth / 2) return;

        const value = candle.v!;
        const barHeight = (value / maxValue) * (height - padding * 2);
        const y = height - padding - barHeight;

        ctx.fillStyle = candle.c >= candle.o ? 'green' : 'red';
        ctx.fillRect(x + 1, y, candleWidth - 2, barHeight);
    });
}

export function getTimestampFromOffset(
    offsetX: number,
    visibleRange: TimeRange,
    width: number,
    chartType: ChartType,
    intervalMs: number
): number {
    const totalDuration = visibleRange.end - visibleRange.start;

    // Define gap logic based on chart type
    const gapRatio = chartType === ChartType.Candlestick ? 0.1 : 0;
    const candleCount = Math.ceil(totalDuration / intervalMs);
    const candleWidthWithGap = width / candleCount;
    const gap = candleWidthWithGap * gapRatio;
    const candleWidth = candleWidthWithGap - gap;

    // Find the index based on offset
    const index = Math.floor(offsetX / candleWidthWithGap);
    const timestamp = visibleRange.start + index * intervalMs;

    return timestamp;
}