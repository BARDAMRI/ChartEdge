// =================================================================================
// == HELPER FUNCTIONS
// =================================================================================

import {PriceRange, TimeRange} from "../../../types/Graph";
import type {Interval} from "../../../types/Interval";

export const xFromStart = (tStart: number, clientWidth: number, visibleRange: TimeRange) =>
    clientWidth * ((tStart - visibleRange.start) / (visibleRange.end - visibleRange.start));
export const xFromCenter = (tStart: number, intervalSeconds: number, clientWidth: number, visibleRange: TimeRange) =>
    clientWidth * (((tStart + intervalSeconds / 2) - visibleRange.start) / (visibleRange.end - visibleRange.start));

export const priceToY = (p: number, clientHeight: number, price: PriceRange) => {
    return clientHeight * (1 - (p - price.min) / price.range);
}
export const timeToX = (time: number, clientWidth: number, visibleRange: TimeRange) => clientWidth * ((time - visibleRange.start) / (visibleRange.end - visibleRange.start));


export function lerp(y1: number, y2: number, t: number): number {
    return y1 * (1 - t) + y2 * t;
}

export const interpolatedCloseAtTime = (all: Interval[], intervalSeconds: number, timeSec: number): number => {
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
