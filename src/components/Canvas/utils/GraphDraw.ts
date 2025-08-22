import type {Interval} from "../../../types/Interval";
import type {ChartRenderContext, ChartStyleOptions} from "../../../types/chartStyleOptions";
import {PriceRange, TimeRange} from "../../../types/Graph"; // Make sure your context type is also imported

// =================================================================================
// == HELPER FUNCTIONS
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

// Interpolate close value at an arbitrary time (in seconds) using interval centers
function interpolatedCloseAtTime(all: Interval[], intervalSeconds: number, timeSec: number): number {
    if (all.length === 0) return 0;
    const center = (i: number) => all[i].t + intervalSeconds / 2;

    // If before first center or after last center, clamp
    if (timeSec <= center(0)) return all[0].c;
    const last = all.length - 1;
    if (timeSec >= center(last)) return all[last].c;

    // Binary search for i such that center(i) <= timeSec < center(i+1)
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
            // Interpolate between mid and mid+1
            const t = (timeSec - cMid) / (cNext - cMid);
            return lerp(all[mid].c, all[mid + 1].c, t);
        }
    }
    // Fallback (shouldn't reach)
    return all[last].c;
}

// =================================================================================
// == CHART DRAWING FUNCTIONS
// =================================================================================

export function drawCandlestickChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, options: ChartStyleOptions) {
    const {allIntervals, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex) return;

    const paddedStart = Math.max(0, visibleStartIndex - 1);
    const paddedEnd = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    const price = findPriceRange(allIntervals, paddedStart, paddedEnd);
    const {clientWidth, clientHeight} = ctx.canvas;
    const priceToY = (p: number) => clientHeight * (1 - (p - price.min) / price.range);
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;
    const candleWidth = (intervalSeconds / visibleDuration) * clientWidth;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allIntervals[i];
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
        const color = (isBullish ? options.candles?.bullColor : options.candles?.bearColor) || 'green';

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

    return {XStart: allIntervals[visibleStartIndex]?.t, XEnd: allIntervals[visibleEndIndex]?.t + intervalSeconds};
}

export function drawLineChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, style: ChartStyleOptions) {
    const {allIntervals: allIntervals, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;

    const startIdx = Math.max(0, visibleStartIndex - 1);
    const endIdx = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    const price = findPriceRange(allIntervals, startIdx, endIdx);
    const {clientWidth, clientHeight} = ctx.canvas;

    ctx.beginPath();

    // Interpolate line value exactly at the left and right edges for smooth, continuous panning
    const leftTime = visibleRange.start;      // seconds
    const rightTime = visibleRange.end;       // seconds

    const leftY = priceToY(interpolatedCloseAtTime(allIntervals, intervalSeconds, leftTime), clientHeight, price);
    ctx.moveTo(0, leftY);

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const it = allIntervals[i];
        const x = timeToX(it.t + intervalSeconds / 2, clientWidth, visibleRange);
        const y = priceToY(it.c, clientHeight, price);
        ctx.lineTo(x, y);
    }

    const rightY = priceToY(interpolatedCloseAtTime(allIntervals, intervalSeconds, rightTime), clientHeight, price);
    ctx.lineTo(clientWidth, rightY);
    ctx.stroke();

    // --- Segment annotations and endpoint markers ---
    ctx.save();
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';

    // Mark first and last points with black dots
    if (visibleStartIndex <= visibleEndIndex) {
        const firstPt = allIntervals[visibleStartIndex];
        const lastPt = allIntervals[visibleEndIndex];
        const fx = timeToX(firstPt.t + intervalSeconds / 2, clientWidth, visibleRange);
        const fy = priceToY(firstPt.c, clientHeight, price);
        const lx = timeToX(lastPt.t + intervalSeconds / 2, clientWidth, visibleRange);
        const ly = priceToY(lastPt.c, clientHeight, price);
        const r = 3;
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lx, ly, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // For each segment between i and i+1, draw index at start and compact values at midpoint
    for (let i = visibleStartIndex; i < visibleEndIndex; i++) {
        const a = allIntervals[i];
        const b = allIntervals[i + 1];
        const ax = timeToX(a.t + intervalSeconds / 2, clientWidth, visibleRange);
        const ay = priceToY(a.c, clientHeight, price);
        const bx = timeToX(b.t + intervalSeconds / 2, clientWidth, visibleRange);
        const by = priceToY(b.c, clientHeight, price);

        // Index label at the start of the segment (slight offset)
        const idxText = `${i}`;
        ctx.fillText(idxText, ax + 4, ay);

        // Compact values at the segment center
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const va = a.c.toFixed(2);
        const vb = b.c.toFixed(2);
        const vText = `${va}|${vb}`;
        ctx.textAlign = 'center';
        ctx.fillText(vText, mx, my - 8);
        ctx.textAlign = 'left';
    }
    ctx.restore();
}

export function drawAreaChart(
    ctx: CanvasRenderingContext2D,
    context: ChartRenderContext,
    style: ChartStyleOptions
) {
    const {allIntervals, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;

    // Retain initial calculations
    const paddedStart = Math.max(0, visibleStartIndex - 1);
    const paddedEnd = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
    const price = findPriceRange(allIntervals, paddedStart, paddedEnd);
    const {clientWidth, clientHeight} = ctx.canvas;

    // moving the ctx to the top-left corner where it should start drawing.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);

    // Interpolate line value exactly at the left and right edges for smooth, continuous panning
    const leftY = priceToY(interpolatedCloseAtTime(allIntervals, intervalSeconds, visibleRange.start), clientHeight, price);
    ctx.lineTo(0, leftY);

    // check if the first interval is visible more than 50%.
    const firstInterval = allIntervals[visibleStartIndex];
    if (firstInterval && firstInterval.t + intervalSeconds / 2 > visibleRange.start) {
        // if yes, then the first line should be drawn to the center of the first interval
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.lineTo(timeToX(firstInterval.t + intervalSeconds / 2, clientWidth, visibleRange), priceToY(firstInterval.c, clientHeight, price));
    }
    ctx.stroke();
    ctx.restore();
    // Iterate over each visible interval segment
    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const a = allIntervals[i];
        let b;
        if (i < visibleEndIndex || visibleEndIndex < allIntervals.length - 1) {
            b = allIntervals[i + 1];
            const ax = timeToX(a.t + intervalSeconds / 2, clientWidth, visibleRange);
            const ay = priceToY(a.c, clientHeight, price);
            const bx = timeToX(b.t + intervalSeconds / 2, clientWidth, visibleRange);
            const by = priceToY(b.c, clientHeight, price);

            // Compute unique color (hue by index)
            const color = `hsl(${(i * 60) % 360}, 70%, 50%)`;

            // Draw the line segment with this color and thicker width
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();

            // Draw vertical dashed line at starting x (ax): "end i"
            ctx.save();
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(ax, 0);
            ctx.lineTo(ax, clientHeight);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '11px Arial';
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`end ${i}`, ax, 2);
            ctx.restore();

            // Draw vertical dashed line at ending x (bx): "start i+1"
            ctx.save();
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(bx, 0);
            ctx.lineTo(bx, clientHeight);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '11px Arial';
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`start ${i + 1}`, bx, 2);
            ctx.restore();

            // Above the line midpoint, print two lines of annotation
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2;
            ctx.save();
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = '#333';
            const line1 = `Ind ${i}: c=${a.c} | Int ${i + 1}: c=${b.c}`;
            const line2 = `(${ax.toFixed(1)},${ay.toFixed(1)}) -> (${bx.toFixed(1)},${by.toFixed(1)})`;
            ctx.fillText(line1, mx, my - 16);
            ctx.fillText(line2, mx, my - 2);
            ctx.restore();
        }
    }

}

export function drawBarChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, style: ChartStyleOptions) {
    const {allIntervals, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex) return;

    const price = findPriceRange(allIntervals, visibleStartIndex, visibleEndIndex);
    const {clientWidth, clientHeight} = ctx.canvas;
    const priceToY = (p: number) => clientHeight * (1 - (p - price.min) / price.range);
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;
    const candleWidth = (intervalSeconds / visibleDuration) * clientWidth;

    for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
        const candle = allIntervals[i];
        const x = ((candle.t - visibleRange.start) / visibleDuration) * clientWidth;
        if (x + candleWidth < 0 || x > clientWidth) continue;

        const highY = priceToY(candle.h);
        const lowY = priceToY(candle.l);
        const openY = priceToY(candle.o);
        const closeY = priceToY(candle.c);
        const color = candle.c >= candle.o ? style.bar.bullColor : style.bar.bearColor;

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

export function drawHistogramChart(ctx: CanvasRenderingContext2D, context: ChartRenderContext, style: ChartStyleOptions) {
    const {allIntervals, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds} = context;
    if (visibleEndIndex < visibleStartIndex) return;

    const paddedStart = Math.max(0, visibleStartIndex - 1);
    const paddedEnd = Math.min(allIntervals.length - 1, visibleEndIndex + 1);

    let maxVolume = 0;
    for (let i = paddedStart; i <= paddedEnd; i++) {
        const v = allIntervals[i].v;
        if (v !== undefined && v > maxVolume) {
            maxVolume = v;
        }
    }
    if (maxVolume === 0) return;

    const {clientWidth, clientHeight} = ctx.canvas;
    const visibleDuration = visibleRange.end - visibleRange.start;
    if (visibleDuration <= 0) return;
    const candleWidth = (intervalSeconds / visibleDuration) * clientWidth;

    for (let i = paddedStart; i <= paddedEnd; i++) {
        const candle = allIntervals[i];
        if (candle.v === undefined) continue;
        const x = ((candle.t - visibleRange.start) / visibleDuration) * clientWidth;
        if (x + candleWidth < 0 || x > clientWidth) continue;

        const barHeight = (candle.v / maxVolume) * clientHeight;
        const y = clientHeight - barHeight;
        const color = candle.c >= candle.o ? style.histogram.bullColor : style.histogram.bearColor;
        const opacityHex = Math.round(style.histogram.opacity * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `${color}${opacityHex}`;
        ctx.fillRect(x + 1, y, candleWidth - 2, barHeight);
    }
}