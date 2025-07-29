import { Candle } from '../../../types/Candle';

export function drawCandlesticks(
  ctx: CanvasRenderingContext2D,
  candles: Candle[],
  visibleRange: { start: number; end: number },
  padding: number,
  minPrice: number,
  maxPrice: number,
  width: number,
  height: number
): void {
  const drawableWidth = width - 2 * padding;
  const drawableHeight = height - 2 * padding;

  const candleCount = visibleRange.end - visibleRange.start;
  if (candleCount <= 0) return;

  const candleSpacing = drawableWidth / candleCount;
  const candleWidth = candleSpacing * 0.6;

  const priceRange = maxPrice - minPrice;

  const priceToY = (price: number) => {
    return padding + drawableHeight * (1 - (price - minPrice) / priceRange);
  };

  const visibleCandles = candles.slice(visibleRange.start, visibleRange.end);

  visibleCandles.forEach((candle, i) => {
    const x = padding + i * candleSpacing;
    const highY = priceToY(candle.h);
    const lowY = priceToY(candle.l);
    const openY = priceToY(candle.o);
    const closeY = priceToY(candle.c);

    const isUp = candle.c >= candle.o;

    ctx.strokeStyle = isUp ? 'green' : 'red';
    ctx.fillStyle = isUp ? 'green' : 'red';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x + candleWidth / 2, highY);
    ctx.lineTo(x + candleWidth / 2, lowY);
    ctx.stroke();

    const bodyY = Math.min(openY, closeY);
    const bodyHeight = Math.max(1, Math.abs(openY - closeY));
    ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
  });
}
