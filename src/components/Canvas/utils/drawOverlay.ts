// -----------------------------------------------------------------------------
// Overlay builder helpers
// -----------------------------------------------------------------------------

import {
    OverlayCalcSpec,
    OverlayKind,
    OverlayOptions,
    OverlayPriceKey,
    OverlaySeries,
    OverlayWithCalc
} from "../../../types/overlay";
import type {Interval} from "../../../types/Interval";
import type {ChartRenderContext} from "../../../types/chartOptions";
import type {PriceRange} from "../../../types/Graph";
import {DeepRequired} from "../../../types/types";

/** Factory helpers for calculation specs */
export const OverlaySpecs = {
    // direct accessors
    close: (): OverlayCalcSpec => ({kind: 'close'}),
    open: (): OverlayCalcSpec => ({kind: 'open'}),
    high: (): OverlayCalcSpec => ({kind: 'high'}),
    low: (): OverlayCalcSpec => ({kind: 'low'}),

    // moving averages
    sma: (period: number, price: OverlayPriceKey = 'close'): OverlayCalcSpec => (
        {kind: 'sma', period, price}
    ),
    ema: (period: number, price: OverlayPriceKey = 'close'): OverlayCalcSpec => (
        {kind: 'ema', period, price}
    ),
    wma: (period: number, price: OverlayPriceKey = 'close'): OverlayCalcSpec => (
        {kind: 'wma', period, price}
    ),

    // volume-weighted average price
    vwap: (): OverlayCalcSpec => ({kind: 'vwap'}),

    // Bollinger Bands (three separate helpers)
    bbandsMid: (period: number, price: OverlayPriceKey = 'close'): OverlayCalcSpec => (
        {kind: 'bbands_mid', period, price}
    ),
    bbandsUpper: (period: number, stddev = 2, price: OverlayPriceKey = 'close'): OverlayCalcSpec => (
        {kind: 'bbands_upper', period, stddev, price}
    ),
    bbandsLower: (period: number, stddev = 2, price: OverlayPriceKey = 'close'): OverlayCalcSpec => (
        {kind: 'bbands_lower', period, stddev, price}
    ),
} as const;

/**
 * Build an OverlayWithCalc from style + calc, with optional flags.
 * Example:
 *   makeOverlay({ lineColor: '#f90', lineWidth: 2, lineStyle: 'solid' }, OverlaySpecs.sma(20))
 */
export function makeOverlay(
    style?: DeepRequired<OverlayOptions>,
    calc: OverlayCalcSpec = OverlaySpecs.close(),
    extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>
): OverlayWithCalc {

    return {
        ...style,
        calc,
        connectNulls: extras?.connectNulls ?? true,
        useCenterX: extras?.useCenterX ?? true,
    } as OverlayWithCalc;
}

/**
 * Currying helper: create a family of overlays sharing the same style.
 * Example:
 *   const withOrange = withOverlayStyle({ lineColor: '#f90', lineWidth: 2, lineStyle: 'solid' });
 *   const sma20 = withOrange(OverlaySpecs.sma(20));
 */
export function withOverlayStyle(style?: DeepRequired<OverlayOptions>) {
    return (calc: OverlayCalcSpec = OverlaySpecs.close(), extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>): OverlayWithCalc =>
        makeOverlay(style, calc, extras);
}

// -----------------------------------------------------------------------------
// Computation + Rendering for Overlays
// -----------------------------------------------------------------------------


type PriceAccessor = (it: Interval) => number;

function priceAccessor(key?: OverlayPriceKey): PriceAccessor {
    const k = key ?? 'close';
    switch (k) {
        case 'open':
            return (it) => it.o;
        case 'high':
            return (it) => it.h;
        case 'low':
            return (it) => it.l;
        default:
            return (it) => it.c; // close
    }
}

function computeSMA(values: (number | null | undefined)[], period: number): (number | null)[] {
    const out: (number | null)[] = Array(values.length).fill(null);
    if (period <= 1) {
        for (let i = 0; i < values.length; i++) out[i] = values[i] ?? null;
        return out;
    }
    let sum = 0;
    const q: number[] = [];
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v == null || !Number.isFinite(Number(v))) {
            sum = 0;
            q.length = 0;
            out[i] = null;
            continue;
        }
        const nv = Number(v);
        q.push(nv);
        sum += nv;
        if (q.length > period) sum -= q.shift()!;
        out[i] = q.length === period ? (sum / period) : null;
    }
    return out;
}

function computeEMA(values: (number | null | undefined)[], period: number): (number | null)[] {
    const out: (number | null)[] = Array(values.length).fill(null);
    if (period <= 1) {
        for (let i = 0; i < values.length; i++) out[i] = values[i] ?? null;
        return out;
    }
    const k = 2 / (period + 1);
    let ema: number | null = null;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v == null || !Number.isFinite(Number(v))) {
            ema = null;
            out[i] = null;
            continue;
        }
        const nv = Number(v);
        if (ema == null) {
            ema = nv;
            out[i] = null;
        } else {
            ema = nv * k + ema * (1 - k);
            out[i] = ema;
        }
    }
    return out;
}

function computeWMA(values: (number | null | undefined)[], period: number): (number | null)[] {
    const out: (number | null)[] = Array(values.length).fill(null);
    if (period <= 1) {
        for (let i = 0; i < values.length; i++) out[i] = values[i] ?? null;
        return out;
    }
    const wsum = period * (period + 1) / 2; // 1..p
    const win: (number | null)[] = Array(period).fill(null);
    for (let i = 0; i < values.length; i++) {
        win.shift();
        const v = values[i];
        win.push(v == null ? null : Number(v));
        if (win.some(x => x == null)) {
            out[i] = null;
            continue;
        }
        let num = 0;
        for (let j = 0; j < period; j++) num += (j + 1) * (win[j] as number);
        out[i] = num / wsum;
    }
    return out;
}

function rollingStd(values: (number | null)[], period: number): (number | null)[] {
    const out: (number | null)[] = Array(values.length).fill(null);
    const win: number[] = [];
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v == null) {
            win.length = 0;
            out[i] = null;
            continue;
        }
        win.push(v);
        if (win.length > period) win.shift();
        if (win.length < period) {
            out[i] = null;
            continue;
        }
        const mean = win.reduce((a, b) => a + b, 0) / period;
        const variance = win.reduce((a, b) => a + (b - mean) * (b - mean), 0) / period;
        out[i] = Math.sqrt(variance);
    }
    return out;
}

function computeVWAP(intervals: Interval[]): (number | null)[] {
    const out: (number | null)[] = Array(intervals.length).fill(null);
    let cumPV = 0, cumV = 0;
    for (let i = 0; i < intervals.length; i++) {
        const it: any = intervals[i];
        const v = it?.v;
        if (v == null || !Number.isFinite(Number(v))) {
            out[i] = null;
            continue;
        }
        const typical = (it.h + it.l + it.c) / 3;
        cumPV += typical * v;
        cumV += v;
        out[i] = cumV === 0 ? null : (cumPV / cumV);
    }
    return out;
}

export function computeSeriesBySpec(intervals: Interval[], spec: OverlayCalcSpec): (number | null)[] {
    const acc = priceAccessor((spec as any).price);
    switch (spec.kind) {
        case 'close':
            return intervals.map(acc);
        case 'open':
            return intervals.map(acc);
        case 'high':
            return intervals.map(acc);
        case 'low':
            return intervals.map(acc);
        case 'sma':
            return computeSMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case 'ema':
            return computeEMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case 'wma':
            return computeWMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case 'vwap':
            return computeVWAP(intervals);
        case 'bbands_mid': {
            const period = Math.max(1, (spec as any).period ?? 20);
            return computeSMA(intervals.map(acc), period);
        }
        case 'bbands_upper': {
            const period = Math.max(1, (spec as any).period ?? 20);
            const base = intervals.map(acc);
            const sma = computeSMA(base, period);
            const std = rollingStd(sma, period); // approx on SMA
            const k = (spec as any).stddev ?? 2;
            return sma.map((m, i) => (m == null || std[i] == null) ? null : (m + k * (std[i] as number)));
        }
        case 'bbands_lower': {
            const period = Math.max(1, (spec as any).period ?? 20);
            const base = intervals.map(acc);
            const sma = computeSMA(base, period);
            const std = rollingStd(sma, period);
            const k = (spec as any).stddev ?? 2;
            return sma.map((m, i) => (m == null || std[i] == null) ? null : (m - k * (std[i] as number)));
        }
        default:
            return intervals.map(() => null);
    }
}

// --- drawing -------------------------------------------------------------------------

function applyStrokeStyle(ctx: CanvasRenderingContext2D, opt: OverlayOptions) {
    ctx.strokeStyle = opt?.lineColor ?? '#2a7fff';
    ctx.lineWidth = Math.max(0.5, opt?.lineWidth ?? 1.5);
    switch (opt?.lineStyle) {
        case 'dashed':
            ctx.setLineDash([6, 4]);
            ctx.lineCap = 'butt';
            break;
        case 'dotted':
            ctx.setLineDash([2, 3]);
            ctx.lineCap = 'round';
            break;
        default:
            ctx.setLineDash([]);
            ctx.lineCap = 'butt';
            break;
    }
}

function xFromStart(tStart: number, canvasWidth: number, visibleRange: { start: number; end: number }) {
    const span = Math.max(1, visibleRange.end - visibleRange.start);
    return ((tStart - visibleRange.start) / span) * canvasWidth;
}

function xFromCenter(tStart: number, intervalSeconds: number, canvasWidth: number, visibleRange: {
    start: number;
    end: number
}) {
    const half = (intervalSeconds || 0) / 2;
    return xFromStart(tStart + half, canvasWidth, visibleRange);
}

export function drawOverlays(
    ctx: CanvasRenderingContext2D,
    context: ChartRenderContext,
    visiblePriceRange: PriceRange,
    seriesList: OverlaySeries[],
) {
    const {
        allIntervals,
        visibleStartIndex,
        visibleEndIndex,
        visibleRange,
        intervalSeconds,
        canvasWidth,
        canvasHeight
    } = context;
    if (!seriesList?.length) return;
    if (!allIntervals?.length) return;
    if (visibleEndIndex < visibleStartIndex) return;
    if (!Number.isFinite(visiblePriceRange.range) || visiblePriceRange.range <= 0) return;

    const yOf = (p: number) => canvasHeight * (1 - (p - visiblePriceRange.min) / visiblePriceRange.range);
    const xStartOf = (tStart: number) => xFromStart(tStart, canvasWidth, visibleRange);
    const xCenterOf = (tStart: number) => xFromCenter(tStart, intervalSeconds, canvasWidth, visibleRange);

    for (const series of seriesList) {
        if (!series) continue;

        ctx.save();
        applyStrokeStyle(ctx, series.options);

        const useCenter = series.useCenterX !== false; // default true
        const getX = useCenter ? xCenterOf : xStartOf;

        let started = false;
        let prevValid = false;
        ctx.beginPath();

        for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
            const it = allIntervals[i];
            if (!it) {
                prevValid = false;
                continue;
            }

            const v = series.source[i];

            const isNullish = (v == null) || !Number.isFinite(Number(v));
            const x = getX(it.t);
            if (x < -8 || x > canvasWidth + 8) {
                prevValid = prevValid && !isNullish;
                continue;
            }

            if (isNullish) {
                if (!series.connectNulls) {
                    started = false;
                    prevValid = false;
                }
                continue;
            }

            const y = yOf(Number(v));
            if (!Number.isFinite(y)) {
                prevValid = false;
                continue;
            }

            if (!started) {
                ctx.moveTo(x, y);
                started = true;
                prevValid = true;
            } else {
                if (!series.connectNulls && !prevValid) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                prevValid = true;
            }
        }

        if (started) ctx.stroke();
        ctx.restore();
    }
}

// --- mapping from user options to series --------------------------------------------

function toSeriesFromUserOverlays(intervals: Interval[], overlays: OverlayWithCalc[]): OverlaySeries[] {
    return overlays.map((overlay) => {
        const values = computeSeriesBySpec(intervals, overlay.calc);
        const series: OverlaySeries = {
            source: values as number[],
            options: {
                lineColor: overlay.lineColor,
                lineWidth: overlay.lineWidth,
                lineStyle: overlay.lineStyle,
            },
            connectNulls: overlay.connectNulls ?? true,
            useCenterX: overlay.useCenterX ?? true,
        };
        const maybeId: unknown = (overlay as any).id;
        if (typeof maybeId === 'string') series.id = maybeId;
        return series;
    });
}

/**
 * Draw overlays directly from user options (OverlayWithCalc[]).
 * Computes series values internally from intervals and forwards them to drawOverlays.
 */
export function drawOverlaysFromOptions(
    ctx: CanvasRenderingContext2D,
    context: ChartRenderContext,
    visiblePriceRange: PriceRange,
    overlays: OverlayWithCalc[] | undefined,
) {
    if (!overlays || overlays.length === 0) return;
    if (!context?.allIntervals?.length) return;

    const series = toSeriesFromUserOverlays(context.allIntervals, overlays);
    return drawOverlays(ctx, context, visiblePriceRange, series);
}

/** Convenience: quick overlay creator with defaults.
 *  Example: overlay('sma', { lineColor: '#f90' }, { connectNulls: false })
 */
export function overlay(
    kindOrSpec?: OverlayCalcSpec | 'close' | 'open' | 'high' | 'low' | 'sma' | 'ema' | 'wma' | 'vwap' | 'bbands_mid' | 'bbands_upper' | 'bbands_lower',
    style?: DeepRequired<OverlayOptions>,
    extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>
): OverlayWithCalc {
    let calc: OverlayCalcSpec;
    if (!kindOrSpec) calc = OverlaySpecs.close();
    else if (typeof kindOrSpec === 'string') {
        const k = kindOrSpec;
        // Map kind to a calc with sensible defaults
        if (k === 'sma' || k === 'ema' || k === 'wma') calc = OverlaySpecs[k](20, 'close') as OverlayCalcSpec;
        else if (k === 'bbands_mid') calc = OverlaySpecs.bbandsMid(20);
        else if (k === 'bbands_upper') calc = OverlaySpecs.bbandsUpper(20, 2);
        else if (k === 'bbands_lower') calc = OverlaySpecs.bbandsLower(20, 2);
        else if (k === 'vwap') calc = OverlaySpecs.vwap();
        else calc = OverlaySpecs[k]();
    } else {
        calc = kindOrSpec;
    }
    return makeOverlay(style, calc, extras);
}

// -----------------------------------------------------------------------------
// Simple external entry: drawOverlay
// Supports either an existing overlays array OR a kind/spec + optional style
// -----------------------------------------------------------------------------

export function drawOverlay(
    ctx: CanvasRenderingContext2D,
    context: ChartRenderContext,
    visiblePriceRange: PriceRange,
    overlaysOrKind?: OverlayWithCalc[] | OverlayCalcSpec | OverlayKind,
    style?: DeepRequired<OverlayOptions>,
    extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>
) {
    let overlays: OverlayWithCalc[] | undefined;

    if (Array.isArray(overlaysOrKind)) {
        // Case 1: user supplied overlays[] directly
        overlays = overlaysOrKind;
    } else if (overlaysOrKind) {
        // Case 2: user supplied a kind string or a full calc spec; build single overlay
        const single = overlay(overlaysOrKind as any, style, extras);
        overlays = [single];
    } else {
        // No input → nothing to draw
        return;
    }

    return drawOverlaysFromOptions(ctx, context, visiblePriceRange, overlays);
}
