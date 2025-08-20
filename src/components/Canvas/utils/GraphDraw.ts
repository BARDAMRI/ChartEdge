import {ChartType} from "../../../types/chartStyleOptions";
import type {Candle} from "../../../types/Candle";
import {TimeRange} from "../../../types/Graph";


export type Candlesticks = {
    XStart: number;
    XEnd: number;
    candles: Candle[];
}


export const drawCandlestickChart = (ctx: CanvasRenderingContext2D, visibleCandles: Candle[], width: number, height: number, visibleRange: TimeRange, intervalMs: number) => {
    if (visibleCandles.length === 0) return;

    const padding = 10;
    const maxPrice = Math.max(...visibleCandles.map(c => c.h));
    const minPrice = Math.min(...visibleCandles.map(c => c.l));
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    visibleCandles.forEach((candle) => {
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        let drawX = x;
        let visibleWidth = candleWidth;

        if (x < 0) {
            visibleWidth = candleWidth + x;
            drawX = 0;
        } else if (x + candleWidth > width) {
            visibleWidth = width - x;
        }
        if (visibleWidth <= 0) return;

        const openY = height - ((candle.o - minPrice) / priceRange) * (height - padding * 2) - padding;
        const closeY = height - ((candle.c - minPrice) / priceRange) * (height - padding * 2) - padding;
        const highY = height - ((candle.h - minPrice) / priceRange) * (height - padding * 2) - padding;
        const lowY = height - ((candle.l - minPrice) / priceRange) * (height - padding * 2) - padding;

        const isBullish = candle.c > candle.o;
        ctx.strokeStyle = isBullish ? 'green' : 'red';
        ctx.fillStyle = isBullish ? 'green' : 'red';

        ctx.beginPath();
        const candleMidX = x + candleWidth / 2;
        ctx.moveTo(candleMidX, highY);
        ctx.lineTo(candleMidX, lowY);
        ctx.stroke();

        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(openY - closeY);
        ctx.fillRect(drawX + 1, bodyTop, visibleWidth - 2, bodyHeight || 1);
    });
    return {
        visibleCandles,
        XStart: visibleCandles[0].t,
        XEnd: visibleCandles[visibleCandles.length - 1].t + candleWidth
    };
}

export function drawLineChart(ctx: CanvasRenderingContext2D, visibleCandles: Candle[], width: number, height: number, visibleRange: TimeRange, intervalMs: number) {
    if (visibleCandles.length === 0) return;

    const padding = 10;
    const maxPrice = Math.max(...visibleCandles.map(c => c.h));
    const minPrice = Math.min(...visibleCandles.map(c => c.l));
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'blue';

    visibleCandles.forEach((candle, index) => {
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

export function drawAreaChart(ctx: CanvasRenderingContext2D, visibleCandles: Candle[], width: number, height: number, visibleRange: TimeRange, intervalMs: number) {
    if (visibleCandles.length === 0) return;

    const padding = 10;
    const maxPrice = Math.max(...visibleCandles.map(c => c.h));
    const minPrice = Math.min(...visibleCandles.map(c => c.l));
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    ctx.beginPath();
    ctx.moveTo(0, height);

    let lastValidX = 0;
    let lastValidY = height;

    visibleCandles.forEach((candle, index) => {
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x > width) return;

        const candleStart = candle.t;
        const candleEnd = candle.t + intervalMs;
        const startOverlap = Math.max(visibleRange.start, candleStart);
        const endOverlap = Math.min(visibleRange.end, candleEnd);
        const visibleFraction = (endOverlap - startOverlap) / intervalMs;

        const priceY = height - ((candle.c - minPrice) / priceRange) * (height - padding * 2) - padding;

        const drawX = x < 0 ? 0 : x;

        if (index === 0) {
            // Adjust Y if partial
            if (visibleFraction < 1) {
                const nextCandle = visibleCandles[index + 1];
                if (nextCandle) {
                    const nextPriceY = height - ((nextCandle.c - minPrice) / priceRange) * (height - padding * 2) - padding;
                    const adjustedY = priceY + (nextPriceY - priceY) * (1 - visibleFraction);
                    ctx.lineTo(drawX, adjustedY);
                } else {
                    ctx.lineTo(drawX, priceY);
                }
            } else {
                ctx.lineTo(drawX, priceY);
            }
        } else {
            const prevCandle = visibleCandles[index - 1];
            const prevTimeOffset = prevCandle.t - visibleRange.start;
            const prevX = (prevTimeOffset / intervalMs) * candleWidth;
            const expectedX = prevX + candleWidth;
            const fixedX = Math.min(expectedX, drawX);
            ctx.lineTo(fixedX, priceY);
        }

        lastValidX = drawX;
        lastValidY = priceY;
    });

    ctx.lineTo(lastValidX, lastValidY);
    ctx.lineTo(lastValidX, height);
    ctx.closePath();

    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.strokeStyle = 'rgba(0, 123, 255, 1)';
    ctx.fill();
    ctx.stroke();
}

export function drawBarChart(
    ctx: CanvasRenderingContext2D,
    visibleCandles: Candle[],
    width: number,
    height: number,
    visibleRange: TimeRange,
    intervalMs: number
) {
    if (visibleCandles.length === 0) return;

    const padding = 10;
    const maxPrice = Math.max(...visibleCandles.map(c => c.h));
    const minPrice = Math.min(...visibleCandles.map(c => c.l));
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    visibleCandles.forEach(candle => {
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
    visibleCandles: Candle[],
    width: number,
    height: number,
    visibleRange: TimeRange,
    intervalMs: number
) {
    if (visibleCandles.length === 0) return;

    const padding = 10;
    const values = visibleCandles.map(c => c.v!).filter((v): v is number => v !== undefined);
    const maxValue = Math.max(...values);
    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    visibleCandles.forEach((candle, index) => {
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