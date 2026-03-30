import {Interval} from "../../../types/Interval";
import {PriceRange} from "../../../types/Graph";

const medianDeltas = (nums: number[]): number => {
    if (nums.length === 0) return 0;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 ? nums[mid]! : (nums[mid - 1]! + nums[mid]!) / 2;
};

/** Typical bar spacing in seconds (median of successive `t` deltas), aligned with {@link TickUpStage} / pan-zoom. */
export function getBarIntervalSeconds(arr: Interval[], fallbackSeconds = 60): number {
    if (!arr || arr.length <= 1) return Math.max(1, fallbackSeconds);
    const deltas: number[] = [];
    for (let i = 1; i < arr.length; i++) {
        deltas.push(Math.max(0, arr[i]!.t - arr[i - 1]!.t));
    }
    deltas.sort((a, b) => a - b);
    const m = medianDeltas(deltas);
    return Math.max(1, Math.round(m || fallbackSeconds));
}

export function findPriceRange(allCandles: Interval[], startIndex: number, endIndex: number): PriceRange {
    let maxPrice = -Infinity;
    let minPrice = Infinity;
    for (let i = startIndex; i <= endIndex; i++) {
        const candle = allCandles[i];
        if (candle.h > maxPrice) maxPrice = candle.h;
        if (candle.l < minPrice) minPrice = candle.l;
    }
    return {min: minPrice, max: maxPrice, range: maxPrice - minPrice || 1};
}


export function isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return false;

    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const closestX = t < 0 ? x1 : t > 1 ? x2 : x1 + t * dx;
    const closestY = t < 0 ? y1 : t > 1 ? y2 : y1 + t * dy;

    const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
    return distSq <= tolerance ** 2;
}
