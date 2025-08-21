import {ChartType} from "../../../types/chartStyleOptions";
import type {Candle} from "../../../types/Candle";
import {TimeRange} from "../../../types/Graph";
import {
    startOfHour,
} from 'date-fns';

export type IndexRangePair = {
    startIndex: number;
    endIndex: number;
}
export type Candlesticks = {
    XStart: number;
    XEnd: number;
    candlesIndexes: IndexRangePair;
}


export const drawCandlestickChart = (ctx: CanvasRenderingContext2D, allCandles: Candle[], visibleStartIndex: number, visibleEndIndex: number, width: number, height: number, visibleRange: TimeRange, intervalMs: number) => {
    if (visibleEndIndex < visibleStartIndex) return;

    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const c = allCandles[i];
        if (c.h > maxPrice) maxPrice = c.h;
        if (c.l < minPrice) minPrice = c.l;
    }
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allCandles[i];
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
        if (visibleWidth <= 0) continue;

        const openY = height - ((candle.o - minPrice) / priceRange) * height;
        const closeY = height - ((candle.c - minPrice) / priceRange) * height;
        const highY = height - ((candle.h - minPrice) / priceRange) * height;
        const lowY = height - ((candle.l - minPrice) / priceRange) * height;

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
    }
    return {
        visibleCandles: allCandles.slice(visibleStartIndex, visibleEndIndex + 1),
        XStart: allCandles[visibleStartIndex].t,
        XEnd: allCandles[visibleEndIndex].t + candleWidth
    };
}

export function drawLineChart(ctx: CanvasRenderingContext2D, allCandles: Candle[], visibleStartIndex: number, visibleEndIndex: number, width: number, height: number, visibleRange: TimeRange, intervalMs: number) {
    if (visibleEndIndex < visibleStartIndex) return;

    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const c = allCandles[i];
        if (c.h > maxPrice) maxPrice = c.h;
        if (c.l < minPrice) minPrice = c.l;
    }
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'blue';

    for (let index = visibleStartIndex; index <= visibleEndIndex; index++) {
        const candle = allCandles[index];
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= width + candleWidth / 2) continue;

        const priceY = height - ((candle.c - minPrice) / priceRange) * height;

        if (index === visibleStartIndex || x < 0) {
            ctx.moveTo(x, priceY);
        } else {
            ctx.lineTo(x, priceY);
        }
    }
    ctx.stroke();
}

export function drawAreaChart(ctx: CanvasRenderingContext2D, allCandles: Candle[], visibleStartIndex: number, visibleEndIndex: number, width: number, height: number, visibleRange: TimeRange, intervalMs: number) {
    if (visibleEndIndex < visibleStartIndex) return;

    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const c = allCandles[i];
        if (c.h > maxPrice) maxPrice = c.h;
        if (c.l < minPrice) minPrice = c.l;
    }
    const priceRange = maxPrice - minPrice;

    function priceToY(price: number): number {
        const relative = (price - minPrice) / priceRange;
        return height * (1 - relative);
    }

    const candleWidth = width / (visibleEndIndex - visibleStartIndex + 1);

    ctx.beginPath();

    let lastValidX = 0;
    let lastValidY = height;

    // Handle the first candle extrapolation and moveTo
    const candle = allCandles[visibleStartIndex];
    const candleStart = candle.t;
    const candleEnd = candle.t + intervalMs;
    const startOverlap = Math.max(visibleRange.start, candleStart);
    const endOverlap = Math.min(visibleRange.end, candleEnd);
    const visibleFraction = (endOverlap - startOverlap) / intervalMs;

    if (visibleStartIndex > 0) {
        const prevCandle = allCandles[visibleStartIndex - 1];
        const currentCandle = allCandles[visibleStartIndex];
        const prevPriceY = priceToY(prevCandle.c);
        const currentPriceY = priceToY(currentCandle.c);
        const deltaY = currentPriceY - prevPriceY;
        const extrapolatedY = prevPriceY + deltaY * visibleFraction;

        ctx.moveTo(0, extrapolatedY);

        // Draw line to the center of the first visible candle (starting the slope)
        const firstCandle = allCandles[visibleStartIndex];
        const firstTimeOffset = firstCandle.t - visibleRange.start;
        const firstX = ((firstTimeOffset + intervalMs / 2) / intervalMs) * candleWidth;
        const firstPriceY = priceToY(firstCandle.c);
        ctx.lineTo(firstX, firstPriceY);
    } else {
        // fallback to extrapolated logic from open-close if no previous candle exists
        const firstCandle = allCandles[visibleStartIndex];
        const priceDiff = firstCandle.c - firstCandle.o;
        const extrapolatedStart = firstCandle.c - priceDiff * visibleFraction;

        const extrapolatedY = priceToY(extrapolatedStart);
        ctx.moveTo(0, extrapolatedY);

        // Draw line to the center of the first visible candle (starting the slope)
        const firstTimeOffset = firstCandle.t - visibleRange.start;
        const firstX = ((firstTimeOffset + intervalMs / 2) / intervalMs) * candleWidth;
        const firstPriceY = priceToY(firstCandle.c);
        ctx.lineTo(firstX, firstPriceY);
    }

    for (let index = visibleStartIndex + 1; index <= visibleEndIndex; index++) {
        const candle = allCandles[index];
        const timeOffset = candle.t - visibleRange.start;
        const x = ((timeOffset + intervalMs / 2) / intervalMs) * candleWidth;

        const candleStart = candle.t;
        const candleEnd = candle.t + intervalMs;
        const startOverlap = Math.max(visibleRange.start, candleStart);
        const endOverlap = Math.min(visibleRange.end, candleEnd);

        const priceY = priceToY(candle.c);

        const drawX = x < 0 ? 0 : x;

        const prevCandle = allCandles[index - 1];
        const prevTimeOffset = prevCandle.t - visibleRange.start;
        const prevX = (prevTimeOffset / intervalMs) * candleWidth;

        if (index === visibleEndIndex) {
            const fraction = (endOverlap - startOverlap) / intervalMs;
            if (fraction < 1) {
                const prevPriceY = priceToY(prevCandle.c);
                const deltaY = priceY - prevPriceY;
                const adjustedY = prevPriceY + deltaY * fraction;

                const prevXCenter = ((prevCandle.t - visibleRange.start + intervalMs / 2) / intervalMs) * candleWidth;
                const adjustedX = prevXCenter + (candleWidth * fraction);

                ctx.lineTo(adjustedX, adjustedY);
                ctx.lineTo(adjustedX, height);
                lastValidX = adjustedX;
                lastValidY = adjustedY;
                continue;
            } else {
                // אינטרוול מלא – ירידה ישרה למטה
                const xCenter = ((candle.t - visibleRange.start + intervalMs / 2) / intervalMs) * candleWidth;
                ctx.lineTo(xCenter, priceY);
                ctx.lineTo(xCenter, height);
                lastValidX = xCenter;
                lastValidY = priceY;
                continue;
            }
        }

        const expectedX = prevX + candleWidth;
        const fixedX = Math.min(expectedX, drawX);

        ctx.lineTo(fixedX, priceY);

        if (index + 1 <= visibleEndIndex) {
            const nextCandle = allCandles[index + 1];
            const nextCandleStart = nextCandle.t;
            const nextCandleEnd = nextCandle.t + intervalMs;
            const startOverlapNext = Math.max(visibleRange.start, nextCandleStart);
            const endOverlapNext = Math.min(visibleRange.end, nextCandleEnd);
            const nextVisibleFraction = (endOverlapNext - startOverlapNext) / intervalMs;

            if (nextVisibleFraction < 1) {
                const nextTimeOffset = nextCandle.t - visibleRange.start;
                const nextX = (nextTimeOffset / intervalMs) * candleWidth;
                const nextPriceY = priceToY(nextCandle.c);

                const adjustedX = drawX + candleWidth * nextVisibleFraction;
                const deltaY = nextPriceY - priceY;
                const adjustedY = priceY + deltaY * nextVisibleFraction;
                ctx.lineTo(adjustedX, adjustedY);
                ctx.lineTo(adjustedX, height);
                lastValidX = adjustedX;
                lastValidY = adjustedY;
                continue;
            }
        }

        lastValidX = drawX;
        lastValidY = priceY;
    }

    ctx.lineTo(lastValidX, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.strokeStyle = 'rgba(0, 123, 255, 1)';
    ctx.fill();
    ctx.stroke();
}

export function drawBarChart(
    ctx: CanvasRenderingContext2D,
    allCandles: Candle[],
    visibleStartIndex: number,
    visibleEndIndex: number,
    width: number,
    height: number,
    visibleRange: TimeRange,
    intervalMs: number
) {
    if (visibleEndIndex < visibleStartIndex) return;

    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const c = allCandles[i];
        if (c.h > maxPrice) maxPrice = c.h;
        if (c.l < minPrice) minPrice = c.l;
    }
    const priceRange = maxPrice - minPrice;

    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allCandles[i];
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= width + candleWidth / 2) continue;

        const openY = height - ((candle.o - minPrice) / priceRange) * height;
        const closeY = height - ((candle.c - minPrice) / priceRange) * height;

        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, openY);
        ctx.lineTo(x + candleWidth / 2, closeY);
        ctx.stroke();
    }
}

export function drawHistogramChart(
    ctx: CanvasRenderingContext2D,
    allCandles: Candle[],
    visibleStartIndex: number,
    visibleEndIndex: number,
    width: number,
    height: number,
    visibleRange: TimeRange,
    intervalMs: number
) {
    if (visibleEndIndex < visibleStartIndex) return;

    const values: number[] = [];
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const v = allCandles[i].v;
        if (v != undefined) values.push(v);
    }
    if (values.length === 0) return;
    const maxValue = Math.max(...values);
    const candleCount = Math.ceil((visibleRange.end - visibleRange.start) / intervalMs);
    const candleWidth = width / candleCount;

    for (let index = visibleStartIndex; index <= visibleEndIndex; index++) {
        const candle = allCandles[index];
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= width + candleWidth / 2) continue;

        const value = candle.v!;
        const barHeight = (value / maxValue) * height;
        const y = height - barHeight;

        ctx.fillStyle = candle.c >= candle.o ? 'green' : 'red';
        ctx.fillRect(x + 1, y, candleWidth - 2, barHeight);
    }
    const lastCandle = allCandles[visibleEndIndex];
    const lastIntervalStart = startOfHour(new Date(lastCandle.t));
    console.log('Last histogram chart interval:', lastIntervalStart.toLocaleString());
}

export function getTimestampFromOffset(
    offsetX: number,
    visibleRange: TimeRange,
    width: number,
    chartType: ChartType,
    intervalMs: number
): number {
    const totalDuration = visibleRange.end - visibleRange.start;

    const gapRatio = chartType === ChartType.Candlestick ? 0.1 : 0;
    const candleCount = Math.ceil(totalDuration / intervalMs);
    const candleWidthWithGap = width / candleCount;
    const gap = candleWidthWithGap * gapRatio;
    const candleWidth = candleWidthWithGap - gap;

    const index = Math.floor(offsetX / candleWidthWithGap);
    const timestamp = visibleRange.start + index * intervalMs;

    return timestamp;
}