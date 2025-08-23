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
  const { allIntervals, visibleStartIndex, visibleEndIndex, visibleRange, intervalSeconds } = context;
  if (visibleEndIndex < visibleStartIndex || allIntervals.length === 0) return;

  // Price range with a small pad to reduce visual jitter
  const paddedStart = Math.max(0, visibleStartIndex - 1);
  const paddedEnd   = Math.min(allIntervals.length - 1, visibleEndIndex + 1);
  const price = findPriceRange(allIntervals, paddedStart, paddedEnd);

  const { clientWidth, clientHeight } = ctx.canvas;
  const xOf = (t: number) =>
    clientWidth * ((t - visibleRange.start) / (visibleRange.end - visibleRange.start));
  const yOf = (p: number) =>
    clientHeight * (1 - (p - price.min) / price.range);

  // Clip drawing window to actual data bounds (prevents fake “tails”)
  const dataStart = allIntervals[0].t;
  const dataEnd   = allIntervals[allIntervals.length - 1].t + intervalSeconds;
  const clipStartTime = Math.max(visibleRange.start, dataStart);
  const clipEndTime   = Math.min(visibleRange.end,   dataEnd);
  if (clipEndTime <= clipStartTime) return;

  // Build polyline points without inventing horizontal edges
  const centerOf = (i: number) => allIntervals[i].t + intervalSeconds / 2;
  const first    = allIntervals[0];
  const lastIdx  = allIntervals.length - 1;
  const lastCtr  = centerOf(lastIdx);

  const pts: Array<{ x: number; y: number }> = [];

  // Left edge:
  // If we start inside the first half-candle, interpolate OPEN→CLOSE of the first candle.
  // Otherwise, interpolate between centers as usual.
  if (clipStartTime >= first.t && clipStartTime < centerOf(0)) {
    const t0 = first.t, c0 = centerOf(0);
    const ratio = (clipStartTime - t0) / (c0 - t0);
    const val = lerp(first.o, first.c, Math.min(Math.max(ratio, 0), 1));
    pts.push({ x: xOf(clipStartTime), y: yOf(val) });
  } else {
    const val = interpolatedCloseAtTime(allIntervals, intervalSeconds, clipStartTime);
    pts.push({ x: xOf(clipStartTime), y: yOf(val) });
  }

  // Visible centers
  for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
    const cT = centerOf(i);
    if (cT >= clipStartTime && cT <= clipEndTime) {
      pts.push({ x: xOf(cT), y: yOf(allIntervals[i].c) });
    }
  }

  // Right edge:
  // If the window ends before the last center, interpolate there;
  // if it goes beyond the last center, end at the last center (no horizontal tail).
  if (clipEndTime < lastCtr) {
    const val = interpolatedCloseAtTime(allIntervals, intervalSeconds, clipEndTime);
    pts.push({ x: xOf(clipEndTime), y: yOf(val) });
  } else {
    pts.push({ x: xOf(lastCtr), y: yOf(allIntervals[lastIdx].c) });
  }

  if (pts.length < 2) return;

  // PASS 1 — fill under the graph (close to bottom). We do NOT stroke this path.
  const startX = pts[0].x;
  const endX   = pts[pts.length - 1].x;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
  ctx.lineTo(endX, clientHeight);
  ctx.lineTo(startX, clientHeight);
  ctx.closePath();
  ctx.fillStyle = style.area.fillColor;
  ctx.fill();
  ctx.restore();

  // PASS 2 — stroke only the graph polyline (no bottom closure).
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
  ctx.strokeStyle = style.area.strokeColor;
  ctx.lineWidth   = style.area.lineWidth;
  ctx.stroke();
  ctx.restore();
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