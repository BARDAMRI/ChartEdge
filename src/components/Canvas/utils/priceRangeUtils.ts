import { Candle } from '../../../types/Candle';

export function getYAxisPriceRange(candles: Candle[], chartType: string): { min: number; max: number } {
  if (candles.length === 0) return { min: 0, max: 1 };

  if (chartType === 'histogram') {
    const volumes = candles.map(c => c.v ?? 0);
    const max = Math.max(...volumes);
    const adjustedMax = max > 0 ? max : 1;
    return { min: 0, max: adjustedMax };
  }

  const prices = candles.flatMap(c => [c.o, c.h, c.l, c.c]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max };
}