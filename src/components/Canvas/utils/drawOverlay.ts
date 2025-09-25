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
import {DeepPartial, DeepRequired} from "../../../types/types";

/** Factory helpers for calculation specs */
export const OverlaySpecs = {
    close: (): OverlayCalcSpec => ({kind: OverlayPriceKey.close}),
    open: (): OverlayCalcSpec => ({kind: OverlayPriceKey.open}),
    high: (): OverlayCalcSpec => ({kind: OverlayPriceKey.high}),
    low: (): OverlayCalcSpec => ({kind: OverlayPriceKey.low}),

    sma: (period: number, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.sma, period, price}
    ),
    ema: (period: number, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.ema, period, price}
    ),
    wma: (period: number, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.wma, period, price}
    ),

    vwap: (): OverlayCalcSpec => ({kind: OverlayKind.vwap}),

    bbandsMid: (period: number, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.bbands_mid, period, price}
    ),
    bbandsUpper: (period: number, stddev = 2, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.bbands_upper, period, stddev, price}
    ),
    bbandsLower: (period: number, stddev = 2, price: OverlayPriceKey = OverlayPriceKey.close): OverlayCalcSpec => (
        {kind: OverlayKind.bbands_lower, period, stddev, price}
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
export function withOverlayStyle(style?: DeepPartial<OverlayOptions>) {
    let defaultStyle: DeepRequired<OverlayOptions> = {
        lineColor: '#2962ff',
        lineWidth: 2,
        lineStyle: 'solid',
    }
    defaultStyle = {...defaultStyle, ...style};
    return (calc: OverlayCalcSpec = OverlaySpecs.close(), extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>): OverlayWithCalc =>
        makeOverlay(defaultStyle, calc, extras);
}

// -----------------------------------------------------------------------------
// Computation + Rendering for Overlays
// -----------------------------------------------------------------------------


type PriceAccessor = (it: Interval) => number;

function priceAccessor(key?: OverlayPriceKey): PriceAccessor {
    const k = key ?? OverlayPriceKey.close;
    switch (k) {
        case OverlayPriceKey.open:
            return (it) => it.o;
        case OverlayPriceKey.high:
            return (it) => it.h;
        case OverlayPriceKey.low:
            return (it) => it.l;
        default:
            return (it) => it.c;
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
    const wsum = period * (period + 1) / 2;
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
        case  OverlayPriceKey.close:
            return intervals.map(acc);
        case OverlayPriceKey.open:
            return intervals.map(acc);
        case OverlayPriceKey.high:
            return intervals.map(acc);
        case OverlayPriceKey.low:
            return intervals.map(acc);
        case OverlayKind.sma:
            return computeSMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case OverlayKind.ema:
            return computeEMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case OverlayKind.wma:
            return computeWMA(intervals.map(acc), Math.max(1, (spec as any).period ?? 20));
        case OverlayKind.vwap:
            return computeVWAP(intervals);
        case OverlayKind.bbands_mid: {
            const period = Math.max(1, (spec as any).period ?? 20);
            return computeSMA(intervals.map(acc), period);
        }
        case OverlayKind.bbands_upper: {
            const period = Math.max(1, (spec as any).period ?? 20);
            const base = intervals.map(acc);
            const sma = computeSMA(base, period);
            const std = rollingStd(sma, period);
            const k = (spec as any).stddev ?? 2;
            return sma.map((m, i) => (m == null || std[i] == null) ? null : (m + k * (std[i] as number)));
        }
        case OverlayKind.bbands_lower: {
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

        const useCenter = series.useCenterX;
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
    kindOrSpec?: OverlayCalcSpec | OverlayKind | OverlayPriceKey,
    style?: DeepPartial<OverlayOptions>,
    extras?: Pick<OverlayWithCalc, 'connectNulls' | 'useCenterX'>
): OverlayWithCalc {
    let calc: OverlayCalcSpec;
    if (!kindOrSpec) {
        calc = {kind: OverlayPriceKey.close};
    } else if (typeof kindOrSpec === 'string') {
        switch (kindOrSpec) {
            case OverlayKind.sma:
                calc = {kind: OverlayKind.sma, period: 20, price: OverlayPriceKey.close};
                break;
            case OverlayKind.ema:
                calc = {kind: OverlayKind.ema, period: 20, price: OverlayPriceKey.close};
                break;
            case OverlayKind.wma:
                calc = {kind: OverlayKind.wma, period: 20, price: OverlayPriceKey.close};
                break;
            case OverlayKind.vwap:
                calc = {kind: OverlayKind.vwap};
                break;
            case OverlayKind.bbands_mid:
                calc = {kind: OverlayKind.bbands_mid, period: 20, price: OverlayPriceKey.close};
                break;
            case OverlayKind.bbands_upper:
                calc = {kind: OverlayKind.bbands_upper, period: 20, stddev: 2, price: OverlayPriceKey.close};
                break;
            case OverlayKind.bbands_lower:
                calc = {kind: OverlayKind.bbands_lower, period: 20, stddev: 2, price: OverlayPriceKey.close};
                break;
            case OverlayPriceKey.close:
            case OverlayPriceKey.open:
            case OverlayPriceKey.high:
            case OverlayPriceKey.low:
                calc = {kind: kindOrSpec as OverlayPriceKey};
                break;
            default:
                calc = {kind: OverlayPriceKey.close};
        }
    } else {
        calc = kindOrSpec as OverlayCalcSpec;
    }
    let defaultStyle: DeepRequired<OverlayOptions> = {
        lineColor: '#2962ff',
        lineWidth: 2,
        lineStyle: 'solid',
    };
    defaultStyle = {...defaultStyle, ...style};
    return makeOverlay(defaultStyle, calc, extras);
}

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
