import {Interval} from "../../../types/Interval";
import {PriceRange} from "../../../types/Graph";

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
    if (dx === 0 && dy === 0) return false; // It's a point

    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    const closestX = t < 0 ? x1 : t > 1 ? x2 : x1 + t * dx;
    const closestY = t < 0 ? y1 : t > 1 ? y2 : y1 + t * dy;

    const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
    return distSq <= tolerance ** 2;
}
