import type {Interval} from "../../../types/Interval";
import type {ChartRenderContext, ChartStyleOptions} from "../../../types/chartStyleOptions"; // Make sure your context type is also imported

// =================================================================================
// == CONFIGURATION & TYPES
// =================================================================================

const DEFAULT_STYLES = {
    candles: {
        bullColor: 'green',
        bearColor: 'red',
    },
    line: {
        color: 'blue',
        lineWidth: 2,
    },
    area: {
        fillColor: 'rgba(0, 123, 255, 0.2)',
        strokeColor: 'rgba(0, 123, 255, 1)',
        lineWidth: 2,
    },
    histogram: {
        bullColor: 'green',
        bearColor: 'red',
        opacity: 0.5,
    },
    grid: {
        color: '#CCCCCC',
        lineWidth: 1,
    },
    axes: {
        labelColor: '#333333',
        lineColor: '#999999',
    },
    backgroundColor: '#FFFFFF',
};
// =================================================================================
// == HELPER FUNCTIONS
// =================================================================================

export function findPriceRange(allCandles: Interval[], startIndex: number, endIndex: number): {
    min: number;
    max: number;
    range: number;
} {
    let maxPrice = -Infinity;
    let minPrice = Infinity;
    const start = Math.max(0, startIndex);
    const end = Math.min(allCandles.length - 1, endIndex);
    for (let i = start; i <= end; i++) {
        const candle = allCandles[i];
        if (candle.h > maxPrice) maxPrice = candle.h;
        if (candle.l < minPrice) minPrice = candle.l;
    }
    return {min: minPrice, max: maxPrice, range: maxPrice - minPrice || 1};
}

export function lerp(y1: number, y2: number, t: number): number {
    return y1 * (1 - t) + y2 * t;
}

// =================================================================================
// == CHART DRAWING FUNCTIONS
// =================================================================================

export function drawCandlestickChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: ChartStyleOptions = {}) {
    const {allCandles, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex) return;

    const style = {...DEFAULT_STYLES.candles, ...options.candles};
    const price = findPriceRange(allCandles, visibleStartIndex, visibleEndIndex);
    const {clientWidth, clientHeight} = ctx.canvas;
    const priceToY = (p: number) => clientHeight * (1 - (p - price.min) / price.range);
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;
    const candleWidth = (intervalSeconds / visibleDuration) * clientWidth;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allCandles[i];
        const x = ((candle.t - visibleRange.start) / visibleDuration) * clientWidth;
        let drawX = x;
        let visibleWidth = candleWidth;
        if (x < 0) {
            visibleWidth += x;
            drawX = 0;
        } else if (x + candleWidth > clientWidth) {
            visibleWidth = clientWidth - x;
        }
        if (visibleWidth <= 0) continue;

        const highY = priceToY(candle.h);
        const lowY = priceToY(candle.l);
        const openY = priceToY(candle.o);
        const closeY = priceToY(candle.c);
        const isBullish = candle.c >= candle.o;
        const color = isBullish ? style.bullColor : style.bearColor;

        ctx.beginPath();
        ctx.strokeStyle = color;
        const candleMidX = x + candleWidth / 2;
        ctx.moveTo(candleMidX, highY);
        ctx.lineTo(candleMidX, lowY);
        ctx.stroke();

        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(openY - closeY);
        ctx.fillStyle = color;
        ctx.fillRect(drawX, bodyTop, visibleWidth, bodyHeight || 1);
    }

    return {XStart: allCandles[visibleStartIndex]?.t, XEnd: allCandles[visibleEndIndex]?.t + intervalSeconds};
}

export function drawLineChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: ChartStyleOptions = {}) {
    const {allCandles: allIntervals, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;

    const style = {...DEFAULT_STYLES.line, ...options.line};
    const startIdx = Math.max(0, visibleStartIndex - 1);
    const endIdx = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    const price = findPriceRange(allIntervals, startIdx, endIdx);
    const {clientWidth, clientHeight} = ctx.canvas;
    const priceToY = (p: number) => clientHeight * (1 - (p - price.min) / price.range);
    const timeToX = (time: number) => clientWidth * ((time - visibleRange.start) / (visibleRange.end - visibleRange.start));

    ctx.beginPath();
    ctx.lineWidth = style.lineWidth;
    ctx.strokeStyle = style.color;

    const firstInterval = allIntervals[visibleStartIndex];
    let startPrice: number;
    if (visibleStartIndex === 0) {
        startPrice = firstInterval.o;
    } else {
        const prevInterval = allIntervals[visibleStartIndex - 1];
        const fraction = (visibleRange.start - (prevInterval.t + intervalSeconds / 2)) / intervalSeconds;
        startPrice = lerp(prevInterval.c, firstInterval.c, fraction);
    }
    ctx.moveTo(0, priceToY(startPrice));

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const interval = allIntervals[i];
        const x = timeToX(interval.t + intervalSeconds / 2);
        const y = priceToY(interval.c);
        ctx.lineTo(x, y);
    }

    const lastInterval = allIntervals[visibleEndIndex];
    let endPrice: number;
    if (visibleEndIndex >= allIntervals.length - 1) {
        endPrice = lastInterval.c;
    } else {
        const nextInterval = allIntervals[visibleEndIndex + 1];
        const fraction = (visibleRange.end - (lastInterval.t + intervalSeconds / 2)) / intervalSeconds;
        endPrice = lerp(lastInterval.c, nextInterval.c, fraction);
    }
    ctx.lineTo(clientWidth, priceToY(endPrice));
    ctx.stroke();
}

export function drawAreaChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: ChartStyleOptions = {}) {
    const {allCandles: allIntervals, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;

    const style = {...DEFAULT_STYLES.area, ...options.area};
    const startIdx = Math.max(0, visibleStartIndex - 1);
    const endIdx = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    const price = findPriceRange(allIntervals, startIdx, endIdx);
    const {clientWidth, clientHeight} = ctx.canvas;
    const priceToY = (p: number) => clientHeight * (1 - (p - price.min) / price.range);
    const timeToX = (time: number) => clientWidth * ((time - visibleRange.start) / (visibleRange.end - visibleRange.start));

    ctx.beginPath();

    const firstInterval = allIntervals[visibleStartIndex];
    let startPrice: number;
    if (visibleStartIndex === 0) {
        startPrice = firstInterval.o;
    } else {
        const prevInterval = allIntervals[visibleStartIndex - 1];
        const fraction = (visibleRange.start - (prevInterval.t + intervalSeconds / 2)) / intervalSeconds;
        startPrice = lerp(prevInterval.c, firstInterval.c, fraction);
    }
    ctx.moveTo(0, priceToY(startPrice));

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const interval = allIntervals[i];
        const x = timeToX(interval.t + intervalSeconds / 2);
        const y = priceToY(interval.c);
        ctx.lineTo(x, y);
    }

    const lastInterval = allIntervals[visibleEndIndex];
    let endPrice: number;
    if (visibleEndIndex >= allIntervals.length - 1) {
        endPrice = lastInterval.c;
    } else {
        const nextInterval = allIntervals[visibleEndIndex + 1];
        const fraction = (visibleRange.end - (lastInterval.t + intervalSeconds / 2)) / intervalSeconds;
        endPrice = lerp(lastInterval.c, nextInterval.c, fraction);
    }
    ctx.lineTo(clientWidth, priceToY(endPrice));
    ctx.lineTo(clientWidth, clientHeight);
    ctx.lineTo(0, clientHeight);
    ctx.closePath();

    ctx.fillStyle = style.fillColor;
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.lineWidth;
    ctx.fill();
    ctx.stroke();
}

export function drawBarChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: ChartStyleOptions = {}) {
    const {allCandles, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex) return;

    const style = {...DEFAULT_STYLES.candles, ...options.candles};
    const price = findPriceRange(allCandles, visibleStartIndex, visibleEndIndex);
    const {clientWidth, clientHeight} = ctx.canvas;
    const priceToY = (p: number) => clientHeight * (1 - (p - price.min) / price.range);
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;
    const candleWidth = (intervalSeconds / visibleDuration) * clientWidth;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allCandles[i];
        const x = ((candle.t - visibleRange.start) / visibleDuration) * clientWidth;
        if (x + candleWidth < 0 || x > clientWidth) continue;

        const highY = priceToY(candle.h);
        const lowY = priceToY(candle.l);
        const openY = priceToY(candle.o);
        const closeY = priceToY(candle.c);
        const color = candle.c >= candle.o ? style.bullColor : style.bearColor;

        ctx.beginPath();
        ctx.strokeStyle = color;
        const midX = x + candleWidth / 2;
        ctx.moveTo(midX, highY);
        ctx.lineTo(midX, lowY);
        ctx.moveTo(x, openY);
        ctx.lineTo(midX, openY);
        ctx.moveTo(midX, closeY);
        ctx.lineTo(x + candleWidth, closeY);
        ctx.stroke();
    }
}

export function drawHistogramChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: ChartStyleOptions = {}) {
    const {allCandles, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex) return;

    const style = {...DEFAULT_STYLES.histogram, ...options.histogram};
    let maxVolume = 0;
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const v = allCandles[i].v;
        if (v !== undefined && v > maxVolume) {
            maxVolume = v;
        }
    }
    if (maxVolume === 0) return;

    const {clientWidth, clientHeight} = ctx.canvas;
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;
    const candleWidth = (intervalSeconds / visibleDuration) * clientWidth;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allCandles[i];
        if (candle.v === undefined) continue;
        const x = ((candle.t - visibleRange.start) / visibleDuration) * clientWidth;
        if (x + candleWidth < 0 || x > clientWidth) continue;

        const barHeight = (candle.v / maxVolume) * clientHeight;
        const y = clientHeight - barHeight;
        const color = candle.c >= candle.o ? style.bullColor : style.bearColor;
        const opacityHex = Math.round(style.opacity * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `${color}${opacityHex}`;
        ctx.fillRect(x + 1, y, candleWidth - 2, barHeight);
    }
}