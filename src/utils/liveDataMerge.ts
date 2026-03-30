import type { Interval } from '../types/Interval';
import { LiveDataPlacement, type LiveDataApplyResult } from '../types/liveData';

function clamp(n: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, n));
}

/**
 * Validates fields, coerces OHLC consistency, drops bad volume.
 * Returns null if the row cannot be represented as an interval.
 */
export function normalizeInterval(
    raw: Partial<Interval>,
    sourceLabel = 'row'
): { value: Interval | null; notes: string[] } {
    const notes: string[] = [];
    const t = raw.t;
    let o = raw.o;
    let c = raw.c;
    let l = raw.l;
    let h = raw.h;
    let v = raw.v;

    if (!Number.isFinite(t as number)) {
        return { value: null, notes: [`${sourceLabel}: invalid timestamp`] };
    }
    for (const [key, val] of [
        ['open', o],
        ['close', c],
        ['low', l],
        ['high', h],
    ] as const) {
        if (!Number.isFinite(val as number)) {
            return { value: null, notes: [`${sourceLabel}: invalid ${key}`] };
        }
    }

    if ((l as number) > (h as number)) {
        notes.push(`${sourceLabel}: low and high swapped`);
        [l, h] = [h, l];
    }
    if ((o as number) < (l as number) || (o as number) > (h as number)) {
        notes.push(`${sourceLabel}: open clamped into [low, high]`);
        o = clamp(o as number, l as number, h as number);
    }
    if ((c as number) < (l as number) || (c as number) > (h as number)) {
        notes.push(`${sourceLabel}: close clamped into [low, high]`);
        c = clamp(c as number, l as number, h as number);
    }
    if (v !== undefined && !Number.isFinite(v)) {
        notes.push(`${sourceLabel}: volume omitted (non-finite)`);
        v = undefined;
    }

    const interval: Interval =
        v !== undefined ? { t: t as number, o: o as number, c: c as number, l: l as number, h: h as number, v } : { t: t as number, o: o as number, c: c as number, l: l as number, h: h as number };
    return { value: interval, notes };
}

export function normalizeIntervals(items: Array<Partial<Interval>>): {
    intervals: Interval[];
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];
    const out: Interval[] = [];
    items.forEach((raw, i) => {
        const { value, notes } = normalizeInterval(raw, `incoming[${i}]`);
        if (!value) {
            errors.push(...notes);
        } else {
            out.push(value);
            for (const n of notes) warnings.push(n);
        }
    });
    return { intervals: out, errors, warnings };
}

function sortByT(arr: Interval[]): Interval[] {
    return [...arr].sort((a, b) => a.t - b.t);
}

/** Later rows with the same timestamp overwrite earlier ones (typical live tick update). */
export function dedupeByTimePreferLast(chronological: Interval[]): Interval[] {
    const map = new Map<number, Interval>();
    for (const b of chronological) {
        map.set(b.t, b);
    }
    return Array.from(map.keys())
        .sort((a, b) => a - b)
        .map((tt) => map.get(tt)!);
}

function mergeAppend(base: Interval[], inc: Interval[]): { data: Interval[]; warnings: string[] } {
    const warnings: string[] = [];
    if (!base.length) {
        return { data: dedupeByTimePreferLast(sortByT(inc)), warnings };
    }
    const out = [...base];
    let lastT = out[out.length - 1].t;
    const sorted = sortByT(inc);
    for (const b of sorted) {
        if (b.t < lastT) {
            warnings.push(`append: skipped bar at t=${b.t} (before last time ${lastT})`);
            continue;
        }
        if (b.t === lastT) {
            out[out.length - 1] = b;
            continue;
        }
        out.push(b);
        lastT = b.t;
    }
    return { data: out, warnings };
}

function mergePrepend(base: Interval[], inc: Interval[]): { data: Interval[]; warnings: string[] } {
    const warnings: string[] = [];
    if (!base.length) {
        return { data: dedupeByTimePreferLast(sortByT(inc)), warnings };
    }
    const firstT = base[0].t;
    let head = base[0];
    const prefix: Interval[] = [];
    const sorted = sortByT(inc);
    for (const b of sorted) {
        if (b.t > firstT) {
            warnings.push(`prepend: skipped bar at t=${b.t} (after first time ${firstT})`);
            continue;
        }
        if (b.t === firstT) {
            head = b;
            continue;
        }
        prefix.push(b);
    }
    const tail = base.slice(1);
    const combined = sortByT([...prefix, head, ...tail]);
    return { data: dedupeByTimePreferLast(combined), warnings };
}

/**
 * Applies live / partial updates with explicit placement rules and normalized OHLC.
 */
export function applyLiveDataMerge(
    existing: Interval[],
    incomingRaw: Interval | Interval[],
    placement: LiveDataPlacement
): LiveDataApplyResult {
    const incomingArr = Array.isArray(incomingRaw) ? incomingRaw : [incomingRaw];
    const inc = normalizeIntervals(incomingArr);
    const errors: string[] = [...inc.errors];
    const warnings: string[] = [...inc.warnings];

    if (placement === LiveDataPlacement.replace) {
        const sorted = dedupeByTimePreferLast(sortByT(inc.intervals));
        if (!incomingArr.length) {
            errors.push('replace: no incoming data');
        }
        return {
            ok: inc.errors.length === 0 && incomingArr.length > 0,
            intervals: sorted,
            errors,
            warnings,
        };
    }

    const ex = normalizeIntervals(existing);
    for (const e of ex.errors) errors.push(`existing: ${e}`);
    warnings.push(...ex.warnings);
    const base = dedupeByTimePreferLast(sortByT(ex.intervals));

    if (!inc.intervals.length) {
        errors.push('no valid incoming bars after validation');
        return { ok: false, intervals: base, errors, warnings };
    }

    if (placement === LiveDataPlacement.mergeByTime) {
        const merged = dedupeByTimePreferLast(sortByT([...base, ...inc.intervals]));
        return {
            ok: inc.errors.length === 0 && ex.errors.length === 0,
            intervals: merged,
            errors,
            warnings,
        };
    }

    if (placement === LiveDataPlacement.append) {
        const { data, warnings: w } = mergeAppend(base, inc.intervals);
        warnings.push(...w);
        return {
            ok: inc.errors.length === 0 && ex.errors.length === 0,
            intervals: data,
            errors,
            warnings,
        };
    }

    if (placement === LiveDataPlacement.prepend) {
        const { data, warnings: w } = mergePrepend(base, inc.intervals);
        warnings.push(...w);
        return {
            ok: inc.errors.length === 0 && ex.errors.length === 0,
            intervals: data,
            errors,
            warnings,
        };
    }

    errors.push(`unknown placement: ${String(placement)}`);
    return { ok: false, intervals: base, errors, warnings };
}
