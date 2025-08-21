import type {Interval} from "../../../types/Interval";
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

export function calculateEffectiveCandleCount(
    allCandles: Interval[],
    visibleStartIndex: number,
    visibleEndIndex: number,
    visibleRange: TimeRange,
    intervalMs: number
): number {
    let count = (visibleEndIndex - visibleStartIndex) + 1;

    const first = allCandles[visibleStartIndex];
    const firstStart = first.t;
    const firstEnd = firstStart + intervalMs;

    if (firstStart < visibleRange.start) {
        const overlap = firstEnd - visibleRange.start;
        const visibleFraction = Math.max(0, overlap / intervalMs);
        count -= 1;
        count += visibleFraction;
    }

    const last = allCandles[visibleEndIndex];
    const lastStart = last.t;
    const lastEnd = lastStart + intervalMs;

    if (lastEnd > visibleRange.end) {
        const overlap = visibleRange.end - lastStart;
        const visibleFraction = Math.max(0, overlap / intervalMs);
        count -= 1;
        count += visibleFraction;
    }

    return count;
}

export function getIntervalWidth(ctx: CanvasRenderingContext2D, allCandles: Interval[], visibleStartIndex: number, visibleEndIndex: number, visibleRange: TimeRange, intervalMs: number): number {
    const candleCount = calculateEffectiveCandleCount(allCandles, visibleStartIndex, visibleEndIndex, visibleRange, intervalMs);
    return ctx.canvas.clientWidth / candleCount;
}

export const drawCandlestickChart = (ctx: CanvasRenderingContext2D, allCandles: Interval[], visibleStartIndex: number, visibleEndIndex: number, visibleRange: TimeRange, intervalMs: number) => {
    if (visibleEndIndex < visibleStartIndex) return;

    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const c = allCandles[i];
        if (c.h > maxPrice) maxPrice = c.h;
        if (c.l < minPrice) minPrice = c.l;
    }
    const priceRange = maxPrice - minPrice;
    const candleWidth = getIntervalWidth(ctx, allCandles, visibleStartIndex, visibleEndIndex, visibleRange, intervalMs);

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allCandles[i];
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        let drawX = x;
        let visibleWidth = candleWidth;

        if (x < 0) {
            visibleWidth = candleWidth + x;
            drawX = 0;
        } else if (x + candleWidth > ctx.canvas.clientWidth) {
            visibleWidth = ctx.canvas.clientWidth - x;
        }
        if (visibleWidth <= 0) continue;

        const openY = ctx.canvas.clientHeight - ((candle.o - minPrice) / priceRange) * ctx.canvas.clientHeight;
        const closeY = ctx.canvas.clientHeight - ((candle.c - minPrice) / priceRange) * ctx.canvas.clientHeight;
        const highY = ctx.canvas.clientHeight - ((candle.h - minPrice) / priceRange) * ctx.canvas.clientHeight;
        const lowY = ctx.canvas.clientHeight - ((candle.l - minPrice) / priceRange) * ctx.canvas.clientHeight;

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

export function drawLineChart(ctx: CanvasRenderingContext2D, allCandles: Interval[], visibleStartIndex: number, visibleEndIndex: number, visibleRange: TimeRange, intervalMs: number) {
    if (visibleEndIndex < visibleStartIndex) return;

    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const c = allCandles[i];
        if (c.h > maxPrice) maxPrice = c.h;
        if (c.l < minPrice) minPrice = c.l;
    }
    const priceRange = maxPrice - minPrice;
    const candleWidth = getIntervalWidth(ctx, allCandles, visibleStartIndex, visibleEndIndex, visibleRange, intervalMs);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'blue';

    for (let index = visibleStartIndex; index <= visibleEndIndex; index++) {
        const candle = allCandles[index];
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= ctx.canvas.clientWidth + candleWidth / 2) continue;

        const priceY = ctx.canvas.clientHeight - ((candle.c - minPrice) / priceRange) * ctx.canvas.clientHeight;

        if (index === visibleStartIndex || x < 0) {
            ctx.moveTo(x, priceY);
        } else {
            ctx.lineTo(x, priceY);
        }
    }
    ctx.stroke();
}


function calc_linear_interpolation(y1: number, y2: number, t: number): number {
    return y1 * (1 - t) + y2 * t;
}


export function drawAreaChart(
    ctx: CanvasRenderingContext2D,
    allIntervals: Interval[],
    visibleStartIndex: number,
    visibleEndIndex: number,
    visibleRange: TimeRange,
    intervalMs: number
) {
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) {
        return;
    }

    const {clientWidth: canvasWidth, clientHeight: canvasHeight} = ctx.canvas;

    // 1. Find the min/max price in the visible range to scale the Y-axis
    let maxPrice = -Infinity;
    let minPrice = Infinity;
    // Widen the search slightly to include intervals just off-screen for smoother interpolation
    const start = Math.max(0, visibleStartIndex - 1);
    const end = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    for (let i = start; i <= end; i++) {
        const c = allIntervals[i];
        if (c.h > maxPrice) maxPrice = c.h;
        if (c.l < minPrice) minPrice = c.l;
    }

    // Avoid division by zero if all prices are the same
    const priceRange = maxPrice - minPrice || 1;

    // 2. Helper functions to map data coordinates to canvas pixels
    function priceToYPixel(price: number): number {
        const relative = (price - minPrice) / priceRange;
        return canvasHeight * (1 - relative);
    }

    function timeToX(time: number): number {
        const relative = (time - visibleRange.start) / (visibleRange.end - visibleRange.start);
        return canvasWidth * relative;
    }

    ctx.beginPath();

    // 3. Calculate the interpolated starting point on the left edge of the canvas
    const firstVisibleInterval = allIntervals[visibleStartIndex];
    let startY: number;

    if (visibleStartIndex === 0) {
        // Edge case: No interval before the first one.
        // Interpolate between the open price (at the start) and close price (at the middle).
        const time1 = firstVisibleInterval.t;
        const price1 = firstVisibleInterval.o;
        const time2 = firstVisibleInterval.t + intervalMs / 2;
        const price2 = firstVisibleInterval.c;
        const fraction = (visibleRange.start - time1) / (time2 - time1);
        startY = calc_linear_interpolation(price1, price2, fraction);
    } else {
        // Standard case: Interpolate between the center of the previous interval and the first visible one.
        const prevInterval = allIntervals[visibleStartIndex - 1];
        const time1 = prevInterval.t + intervalMs / 2;
        const price1 = prevInterval.c;
        const time2 = firstVisibleInterval.t + intervalMs / 2;
        const price2 = firstVisibleInterval.c;
        const fraction = (visibleRange.start - time1) / (time2 - time1);
        startY = calc_linear_interpolation(price1, price2, fraction);
    }
    ctx.moveTo(0, priceToYPixel(startY));

    // 4. Draw lines to the center of each visible interval
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const interval = allIntervals[i];
        const x = timeToX(interval.t + intervalMs / 2);
        const y = priceToYPixel(interval.c);
        ctx.lineTo(x, y);
    }

    // 5. Calculate the interpolated ending point on the right edge of the canvas
    const lastVisibleInterval = allIntervals[visibleEndIndex];
    let endY: number;

    if (visibleEndIndex >= allIntervals.length - 1) {
        // Edge case: No interval after the last one. Just hold the last price.
        endY = lastVisibleInterval.c;
    } else {
        // Standard case: Interpolate between the last visible interval and the next one.
        const nextInterval = allIntervals[visibleEndIndex + 1];
        const time1 = lastVisibleInterval.t + intervalMs / 2;
        const price1 = lastVisibleInterval.c;
        const time2 = nextInterval.t + intervalMs / 2;
        const price2 = nextInterval.c;
        const fraction = (visibleRange.end - time1) / (time2 - time1);
        endY = calc_linear_interpolation(price1, price2, fraction);
    }
    ctx.lineTo(canvasWidth, priceToYPixel(endY));

    // 6. Close the path to form the "area"
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.lineTo(0, canvasHeight);
    ctx.closePath();

    // 7. Style and draw the chart
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    ctx.strokeStyle = 'rgba(0, 123, 255, 1)';
    ctx.fill();
    ctx.stroke();
}

export function drawBarChart(
    ctx: CanvasRenderingContext2D,
    allCandles: Interval[],
    visibleStartIndex: number,
    visibleEndIndex: number,
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

    const candleWidth = getIntervalWidth(ctx, allCandles, visibleStartIndex, visibleEndIndex, visibleRange, intervalMs);

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allCandles[i];
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= ctx.canvas.clientWidth + candleWidth / 2) continue;

        const openY = ctx.canvas.clientHeight - ((candle.o - minPrice) / priceRange) * ctx.canvas.clientHeight;
        const closeY = ctx.canvas.clientHeight - ((candle.c - minPrice) / priceRange) * ctx.canvas.clientHeight;

        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, openY);
        ctx.lineTo(x + candleWidth / 2, closeY);
        ctx.stroke();
    }
}

export function drawHistogramChart(
    ctx: CanvasRenderingContext2D,
    allCandles: Interval[],
    visibleStartIndex: number,
    visibleEndIndex: number,
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
    const candleWidth = getIntervalWidth(ctx, allCandles, visibleStartIndex, visibleEndIndex, visibleRange, intervalMs);
    for (let index = visibleStartIndex; index <= visibleEndIndex; index++) {
        const candle = allCandles[index];
        const timeOffset = candle.t - visibleRange.start;
        const x = (timeOffset / intervalMs) * candleWidth;

        if (x + candleWidth < 0 || x >= ctx.canvas.clientWidth + candleWidth / 2) continue;

        const value = candle.v!;
        const barHeight = (value / maxValue) * ctx.canvas.clientHeight;
        const y = ctx.canvas.clientHeight - barHeight;

        ctx.fillStyle = candle.c >= candle.o ? 'green' : 'red';
        ctx.fillRect(x + 1, y, candleWidth - 2, barHeight);
    }
    const lastCandle = allCandles[visibleEndIndex];
    const lastIntervalStart = startOfHour(new Date(lastCandle.t));
    console.log('Last histogram chart interval:', lastIntervalStart.toLocaleString());
}