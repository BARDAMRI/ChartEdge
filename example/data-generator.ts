import type {Interval} from 'tickup/full';

/** Interval between simulated live ticks (ms). */
export const LIVE_TICK_MS = 450;

/** After this many ticks, append a new bar; otherwise merge into the last bar. */
export const LIVE_APPEND_EVERY = 5;

function simplePRNG(seed = 12345) {
    let s = seed >>> 0;
    const rand = () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
    return {rand};
}

/** Deterministic synthetic OHLCV for the playground (thousands of bars). */
export function buildMockIntervals(params: {
    startTime: number;
    startPrice: number;
    intervalSec: number;
    count: number;
    seed?: number;
    driftPerBar?: number;
    vol?: number;
}): Interval[] {
    const {
        startTime,
        startPrice,
        intervalSec,
        count,
        seed = 12345,
        driftPerBar = 0.02,
        vol = 0.55,
    } = params;

    const rng = simplePRNG(seed);
    const out: Interval[] = [];
    let t = startTime;
    let lastClose = startPrice;

    for (let i = 0; i < count; i++) {
        const o = lastClose;
        const noise = (rng.rand() - 0.5) * 2 * vol;
        const c = o + driftPerBar + noise;
        const wigUp = Math.abs((rng.rand() - 0.5) * 2) * (vol * 0.75 + 0.08);
        const wigDn = Math.abs((rng.rand() - 0.5) * 2) * (vol * 0.75 + 0.08);
        const h = Math.max(o, c) + wigUp;
        const l = Math.min(o, c) - wigDn;
        const v = Math.max(1, Math.round(800 + rng.rand() * 2200));

        out.push({
            t,
            o: +o.toFixed(4),
            h: +h.toFixed(4),
            l: +l.toFixed(4),
            c: +c.toFixed(4),
            v,
        });

        lastClose = c;
        t += intervalSec;
    }

    return out;
}

/** Jitter the last bar (simulates live updates to the forming candle). */
export function jitterLastBar(last: Interval, rngSeed = 999_001): Interval {
    const rng = simplePRNG((last.t ^ rngSeed) >>> 0);
    const delta = (rng.rand() - 0.5) * (Math.abs(last.c - last.o) * 0.35 + 0.08);
    const c = +(last.c + delta).toFixed(4);
    const h = +Math.max(last.h, c, last.o).toFixed(4);
    const l = +Math.min(last.l, c, last.o).toFixed(4);
    const baseV = last.v ?? 0;
    const v = Math.max(1, baseV + Math.round((rng.rand() - 0.35) * 180));
    return {...last, c, h, l, v};
}

/** Append the next bar after `last` (closed candle + new session open). */
export function appendBarAfter(last: Interval, intervalSec: number, rngSeed = 888_777): Interval {
    const rng = simplePRNG((last.t + intervalSec + rngSeed) >>> 0);
    const o = last.c;
    const noise = (rng.rand() - 0.5) * 1.1;
    const c = +(o + noise * 0.12).toFixed(4);
    const wigUp = Math.abs((rng.rand() - 0.5) * 2) * 0.45;
    const wigDn = Math.abs((rng.rand() - 0.5) * 2) * 0.45;
    const h = +Math.max(o, c) + wigUp;
    const l = +Math.min(o, c) - wigDn;
    const v = Math.max(1, Math.round(900 + rng.rand() * 2000));
    return {
        t: last.t + intervalSec,
        o: +o.toFixed(4),
        h: +h.toFixed(4),
        l: +l.toFixed(4),
        c: +c.toFixed(4),
        v,
    };
}

/**
 * Classic Heikin-Ashi OHLC from regular candles.
 * Render with chart type **Candlestick** — the library has no native Heikin type.
 */
export function toHeikinAshi(regular: Interval[]): Interval[] {
    if (!regular.length) {
        return [];
    }
    const out: Interval[] = [];
    let haOpen = (regular[0]!.o + regular[0]!.c) / 2;
    let haClose =
        (regular[0]!.o + regular[0]!.h + regular[0]!.l + regular[0]!.c) / 4;
    let haHigh = Math.max(regular[0]!.h, haOpen, haClose);
    let haLow = Math.min(regular[0]!.l, haOpen, haClose);
    out.push({
        t: regular[0]!.t,
        o: +haOpen.toFixed(4),
        h: +haHigh.toFixed(4),
        l: +haLow.toFixed(4),
        c: +haClose.toFixed(4),
        v: regular[0]!.v,
    });

    for (let i = 1; i < regular.length; i++) {
        const r = regular[i]!;
        const prev = out[i - 1]!;
        const close = (r.o + r.h + r.l + r.c) / 4;
        const open = (prev.o + prev.c) / 2;
        const high = Math.max(r.h, open, close);
        const low = Math.min(r.l, open, close);
        out.push({
            t: r.t,
            o: +open.toFixed(4),
            h: +high.toFixed(4),
            l: +low.toFixed(4),
            c: +close.toFixed(4),
            v: r.v,
        });
    }
    return out;
}

export type LiveTickCounter = {current: number};

/** One live step: usually update last bar; every Nth tick append a new bar. */
export function advanceLiveSeries(
    series: Interval[],
    intervalSec: number,
    tickCounter: LiveTickCounter
): Interval[] {
    if (!series.length) {
        return series;
    }
    tickCounter.current += 1;
    const last = series[series.length - 1]!;
    if (tickCounter.current % LIVE_APPEND_EVERY !== 0) {
        return [...series.slice(0, -1), jitterLastBar(last)];
    }
    return [...series, appendBarAfter(last, intervalSec)];
}
