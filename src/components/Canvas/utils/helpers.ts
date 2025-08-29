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
