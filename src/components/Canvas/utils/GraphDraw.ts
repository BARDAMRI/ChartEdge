import type {Interval} from "../../../types/Interval";
import type {ChartOptions, ChartRenderContext} from "../../../types/chartOptions";
import {PriceRange, TimeRange} from "../../../types/Graph";
import {DeepRequired} from "../../../types/types";

// =================================================================================
// == HELPER FUNCTIONS (Unchanged)
// =================================================================================

const priceToY = (p: number, clientHeight: number, price: PriceRange) => clientHeight * (1 - (p - price.min) / price.range);
const timeToX = (time: number, clientWidth: number, visibleRange: TimeRange) => clientWidth * ((time - visibleRange.start) / (visibleRange.end - visibleRange.start));


export function findPriceRange(allCandles: Interval[], startIndex: number, endIndex: number): {
    min: number;
    max: number;
    range: number;
} {
    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = startIndex; i <= endIndex; i++) {
        const candle = allCandles[i];
        if (candle.h > maxPrice) maxPrice = candle.h;
        if (candle.l < minPrice) minPrice = candle.l;
    }
    return {min: minPrice, max: maxPrice, range: maxPrice - minPrice || 1};
}

export function lerp(y1: number, y2: number, t: number): number {
    return y1 * (1 - t) + y2 * t;
}

function interpolatedCloseAtTime(all: Interval[], intervalSeconds: number, timeSec: number): number {
    if (all.length === 0) return 0;
    const center = (i: number) => all[i].t + intervalSeconds / 2;
    if (timeSec <= center(0)) return all[0].c;
    const last = all.length - 1;
    if (timeSec >= center(last)) return all[last].c;
    let lo = 0, hi = last - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const cMid = center(mid);
        const cNext = center(mid + 1);
        if (timeSec < cMid) {
            hi = mid - 1;
        } else if (timeSec >= cNext) {
            lo = mid + 1;
        } else {
            const t = (timeSec - cMid) / (cNext - cMid);
            return lerp(all[mid].c, all[mid + 1].c, t);
        }
    }
    return all[last].c;
}

// =================================================================================
// == CHART DRAWING FUNCTIONS (Corrected)
// =================================================================================

export function drawCandlestickChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: DeepRequired<ChartOptions>) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context; // <-- Use context dimensions
    if (visibleEndIndex < visibleStartIndex) return;

    const paddedStart = Math.max(0, visibleStartIndex - 1);
    const paddedEnd = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    const price = findPriceRange(allIntervals, paddedStart, paddedEnd);

    const priceToY = (p: number) => canvasHeight * (1 - (p - price.min) / price.range);
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;
    const candleWidth = (intervalSeconds / visibleDuration) * canvasWidth;
    const gapFactor = Math.max(0, Math.min(0.4, (options?.base?.style?.candles?.spacingFactor ?? 0.2)));
    const bodyWidth = candleWidth * (1 - gapFactor);
    const halfPad = (candleWidth - bodyWidth) / 2;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allIntervals[i];
        const x = ((candle.t - visibleRange.start) / visibleDuration) * canvasWidth;
        let drawX = x + halfPad;
        let visibleWidth = bodyWidth;
        if (drawX < 0) {
            visibleWidth += drawX;
            drawX = 0;
        } else if (drawX + visibleWidth > canvasWidth) {
            visibleWidth = canvasWidth - drawX;
        }
        if (visibleWidth <= 0) continue;

        const highY = priceToY(candle.h);
        const lowY = priceToY(candle.l);
        const openY = priceToY(candle.o);
        const closeY = priceToY(candle.c);
        const isBullish = candle.c >= candle.o;
        const color = (isBullish ? options?.base?.style?.candles?.bullColor : options?.base?.style?.candles?.bearColor) || 'green';

        const crisp = (v: number) => Math.round(v) + 0.5;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        const candleMidX = x + candleWidth / 2;
        ctx.moveTo(crisp(candleMidX), crisp(highY));
        ctx.lineTo(crisp(candleMidX), crisp(lowY));
        ctx.stroke();

        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(openY - closeY);
        ctx.fillStyle = color;
        ctx.fillRect(drawX, bodyTop, visibleWidth, bodyHeight || 1);
    }

    return {XStart: allIntervals[visibleStartIndex]?.t, XEnd: allIntervals[visibleEndIndex]?.t + intervalSeconds};
}

export function drawLineChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, style: DeepRequired<ChartOptions>) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context; // <-- Use context dimensions
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;

    const startIdx = Math.max(0, visibleStartIndex - 1);
    const endIdx = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    const price = findPriceRange(allIntervals, startIdx, endIdx);

    const dataStart = allIntervals[0].t;
    const dataEnd = allIntervals[allIntervals.length - 1].t + intervalSeconds;
    const clipStart = Math.max(visibleRange.start, dataStart);
    const clipEnd = Math.min(visibleRange.end, dataEnd);
    if (clipEnd <= clipStart) return;

    const localTimeToX = (t: number) => timeToX(t, canvasWidth, visibleRange);
    const localPriceToY = (p: number) => priceToY(p, canvasHeight, price);

    const leftX = localTimeToX(clipStart);
    const leftY = localPriceToY(interpolatedCloseAtTime(allIntervals, intervalSeconds, clipStart));

    ctx.beginPath();
    ctx.moveTo(leftX, leftY);

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const it = allIntervals[i];
        const centerT = it.t + intervalSeconds / 2;
        if (centerT < clipStart || centerT > clipEnd) continue;
        const x = localTimeToX(centerT);
        const y = localPriceToY(it.c);
        ctx.lineTo(x, y);
    }

    const rightX = localTimeToX(clipEnd);
    const rightY = localPriceToY(interpolatedCloseAtTime(allIntervals, intervalSeconds, clipEnd));
    ctx.lineTo(rightX, rightY);
    ctx.stroke();
}

export function drawAreaChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: DeepRequired<ChartOptions>) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context; // <-- Use context dimensions
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;

    const paddedStart = Math.max(0, visibleStartIndex - 1);
    const paddedEnd = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    const price = findPriceRange(allIntervals, paddedStart, paddedEnd);

    const xOf = (t: number) => canvasWidth * ((t - visibleRange.start) / (visibleRange.end - visibleRange.start));
    const yOf = (p: number) => canvasHeight * (1 - (p - price.min) / price.range);

    const dataStart = allIntervals[0].t;
    const dataEnd = allIntervals[allIntervals.length - 1].t + intervalSeconds;
    const clipStartTime = Math.max(visibleRange.start, dataStart);
    const clipEndTime = Math.min(visibleRange.end, dataEnd);
    if (clipEndTime <= clipStartTime) return;

    const centerOf = (i: number) => allIntervals[i].t + intervalSeconds / 2;
    const first = allIntervals[0];
    const lastIdx = allIntervals.length - 1;
    const lastCtr = centerOf(lastIdx);
    const pts: Array<{ x: number; y: number }> = [];

    if (clipStartTime >= first.t && clipStartTime < centerOf(0)) {
        const t0 = first.t, c0 = centerOf(0);
        const ratio = (clipStartTime - t0) / (c0 - t0);
        const val = lerp(first.o, first.c, Math.min(Math.max(ratio, 0), 1));
        pts.push({x: xOf(clipStartTime), y: yOf(val)});
    } else {
        const val = interpolatedCloseAtTime(allIntervals, intervalSeconds, clipStartTime);
        pts.push({x: xOf(clipStartTime), y: yOf(val)});
    }

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const cT = centerOf(i);
        if (cT >= clipStartTime && cT <= clipEndTime) {
            pts.push({x: xOf(cT), y: yOf(allIntervals[i].c)});
        }
    }

    if (clipEndTime < lastCtr) {
        const val = interpolatedCloseAtTime(allIntervals, intervalSeconds, clipEndTime);
        pts.push({x: xOf(clipEndTime), y: yOf(val)});
    } else {
        pts.push({x: xOf(lastCtr), y: yOf(allIntervals[lastIdx].c)});
    }

    if (pts.length < 2) return;

    const startX = pts[0].x;
    const endX = pts[pts.length - 1].x;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
    ctx.lineTo(endX, canvasHeight);
    ctx.lineTo(startX, canvasHeight);
    ctx.closePath();
    ctx.fillStyle = options?.base?.style?.area!.fillColor;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
    ctx.strokeStyle = options?.base?.style?.area?.strokeColor || 'blue';
    ctx.lineWidth = options?.base?.style?.area?.lineWidth || 2;
    ctx.stroke();
    ctx.restore();
}

export function drawBarChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: DeepRequired<ChartOptions>) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context; // <-- Use context dimensions
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;

    const price = findPriceRange(allIntervals, Math.max(0, visibleStartIndex - 1), Math.min(allIntervals.length - 1, visibleEndIndex + 1));
    const yOf = (p: number) => canvasHeight * (1 - (p - price.min) / price.range);
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;

    const candleWidth = (intervalSeconds / visibleDuration) * canvasWidth;
    if (candleWidth <= 0) return;
    const gapFactor = Math.max(0, Math.min(0.4, (options?.base?.style?.candles?.spacingFactor ?? 0.2)));
    const barWidth = candleWidth * (1 - gapFactor);
    const halfPad = (candleWidth - barWidth) / 2;
    const crisp = (x: number) => Math.round(x) + 0.5;

    ctx.save();
    ctx.lineWidth = 1;
    const baseAlpha = Math.max(0, Math.min(1, options.base.style.bar?.opacity ?? 1));

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const c = allIntervals[i];
        const xLeftFull = ((c.t - visibleRange.start) / visibleDuration) * canvasWidth;
        const xLeft = xLeftFull + halfPad;
        const xRight = xLeft + barWidth;
        if (xRight < 0 || xLeft > canvasWidth) continue;

        const xMid = xLeftFull + candleWidth / 2;
        const yHigh = yOf(c.h);
        const yLow = yOf(c.l);
        const yOpen = yOf(c.o);
        const yClose = yOf(c.c);

        const isUp = c.c >= c.o;
        ctx.strokeStyle = (isUp ? options?.base?.style?.bar.bullColor : options?.base?.style?.bar.bearColor) || 'green';
        ctx.globalAlpha = baseAlpha;
        const tickLen = Math.max(3, Math.min(candleWidth * 0.5, 16));

        ctx.beginPath();
        ctx.moveTo(crisp(xMid), crisp(yHigh));
        ctx.lineTo(crisp(xMid), crisp(yLow));
        ctx.moveTo(crisp(xMid - tickLen), crisp(yOpen));
        ctx.lineTo(crisp(xMid), crisp(yOpen));
        ctx.moveTo(crisp(xMid), crisp(yClose));
        ctx.lineTo(crisp(xMid + tickLen), crisp(yClose));
        ctx.stroke();
    }
    ctx.restore();
}

export function drawHistogramChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: DeepRequired<ChartOptions>) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context; //
    if (!allIntervals.length || visibleEndIndex < visibleStartIndex) return;

    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;

    const candleWidth = (intervalSeconds / visibleDuration) * canvasWidth;
    const gapFactor = Math.max(0, Math.min(0.4, options?.base?.style?.candles?.spacingFactor ?? 0.2));
    const barWidth = Math.max(1, candleWidth * (1 - gapFactor));
    const halfPad = (candleWidth - barWidth) / 2;

    let maxVolume = 0;
    let hasRealVolume = false;
    const padStart = Math.max(0, visibleStartIndex - 1);
    const padEnd = Math.min(allIntervals.length - 1, visibleEndIndex + 1);

    for (let i = padStart; i <= padEnd; i++) {
        const it = allIntervals[i];
        const v = it.v ?? Math.max(0, it.h - it.l);
        if (it.v !== undefined) hasRealVolume = true;
        if (v > maxVolume) maxVolume = v;
    }
    if (maxVolume <= 0) return;

    const xAt = (t: number) => ((t - visibleRange.start) / visibleDuration) * canvasWidth;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, options?.base?.style?.histogram?.opacity ?? 0.6));
    ctx.lineWidth = 0;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const it = allIntervals[i];
        const xFull = xAt(it.t);
        const x = xFull + halfPad;
        if (x > canvasWidth || x + barWidth < 0) continue;

        const vol = hasRealVolume ? (it.v ?? 0) : Math.max(0, it.h - it.l);
        if (vol <= 0) continue;

        const h = (vol / maxVolume) * canvasHeight;
        const yTop = canvasHeight - h;

        const up = it.c >= it.o;
        ctx.fillStyle = (up ? options.base?.style?.histogram.bullColor : options.base?.style?.histogram?.bearColor) || 'green';
        ctx.fillRect(x, yTop, barWidth, h);
    }
    ctx.restore();
}