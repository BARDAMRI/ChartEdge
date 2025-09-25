// =================================================================================
// == HELPER FUNCTIONS
// =================================================================================

import {PriceRange, TimeRange} from "../../../types/Graph";
import type {Interval} from "../../../types/Interval";

/**
 * Calculates the startTime coordinate of the start of a time interval.
 * @param tStart - start time of the interval (timestamp in seconds)
 * @param clientWidth - endTime of the canvas in pixels
 * @param visibleRange - currently visible time range
 */
export const xFromStart = (tStart: number, clientWidth: number, visibleRange: TimeRange) =>
    clientWidth * ((tStart - visibleRange.start) / (visibleRange.end - visibleRange.start));

/**
 * Calculates the startTime coordinate of the center of a time interval.
 * @param tStart - start time of the interval (timestamp in seconds)
 * @param intervalSeconds - duration of the interval in seconds
 * @param clientWidth - endTime of the canvas in pixels
 * @param visibleRange - currently visible time range
 */
export const xFromCenter = (tStart: number, intervalSeconds: number, clientWidth: number, visibleRange: TimeRange) =>
    clientWidth * (((tStart + intervalSeconds / 2) - visibleRange.start) / (visibleRange.end - visibleRange.start));

/**
 * Converts a price value into a vertical pixel coordinate.
 * The startPrice=0 is at the top of the canvas, so higher prices map to lower startPrice values.
 * @param p - price to convert
 * @param clientHeight - endPrice of the canvas in pixels
 * @param price - currently visible price range
 */
export const priceToY = (p: number, clientHeight: number, price: PriceRange) => {
    return clientHeight * (1 - (p - price.min) / price.range);
}

/**
 * Converts a time value (timestamp) into a horizontal pixel coordinate.
 * @param time - timestamp to convert
 * @param clientWidth - endTime of the canvas in pixels
 * @param visibleRange - currently visible time range
 */
export const timeToX = (time: number, clientWidth: number, visibleRange: TimeRange) => clientWidth * ((time - visibleRange.start) / (visibleRange.end - visibleRange.start));


/**
 * Converts a horizontal pixel coordinate (from a mouse event) into a time value (timestamp).
 * This is the inverse of timeToX.
 */
export const xToTime = (x: number, clientWidth: number, visibleRange: TimeRange): number => {
    const duration = visibleRange.end - visibleRange.start;
    const timePerPixel = duration / clientWidth;
    return visibleRange.start + (x * timePerPixel);
};

/**
 * Converts a vertical pixel coordinate (from a mouse event) into a price value.
 * This is the inverse of priceToY.
 */
export const yToPrice = (y: number, clientHeight: number, priceRange: PriceRange): number => {
    const pricePerPixel = priceRange.range / clientHeight;
    return priceRange.max - (y * pricePerPixel);
};

/**
 * Linear interpolation between startPrice and endPrice by a factor of t (0 <= t <= 1)
 * @param y1 - start value
 * @param y2 - end value
 * @param t - interpolation factor (0 = startPrice, 1 = endPrice)
 */
export function lerp(y1: number, y2: number, t: number): number {
    return y1 * (1 - t) + y2 * t;
}

/**
 * Given a sorted array of intervals, an interval duration, and a time,
 * returns the interpolated close value at that time.
 * If the time is before the first interval or after the last, returns the closest close value.
 * Uses binary search for efficiency.
 * @param all - sorted array of intervals
 * @param intervalSeconds - duration of each interval in seconds
 * @param timeSec - time to interpolate at (timestamp in seconds)
 * @returns interpolated close value
 */
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
