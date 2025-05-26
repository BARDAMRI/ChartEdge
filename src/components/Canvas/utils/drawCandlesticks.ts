import { Candle } from '../../../types/Candle.ts';

export function drawCandlesticks(
  backgroundCtx: CanvasRenderingContext2D,
  candles: Candle[],
  canvas: HTMLCanvasElement
): void {
  const dpr = window.devicePixelRatio || 1;
  const paddingLeft = 40;
  const paddingRight = 20;
  const drawableWidth = canvas.width / dpr - paddingLeft - paddingRight;
  const candleSpacing = drawableWidth / candles.length;
  const candleWidth = candleSpacing * 0.6;

  const max = Math.max(...candles.map(c => c.high));
  const min = Math.min(...candles.map(c => c.low));
  const priceRange = max - min;

  const priceToY = (price: number) => {
    const logicalHeight = canvas.height / dpr;
    return logicalHeight - ((price - min) / priceRange) * logicalHeight;
  };

  candles.forEach((candle, i) => {
    const x = paddingLeft + i * candleSpacing;
    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    const openY = priceToY(candle.open);
    const closeY = priceToY(candle.close);

    const isUp = candle.close >= candle.open;
    backgroundCtx.strokeStyle = isUp ? 'green' : 'red';
    backgroundCtx.lineWidth = 1;

    // Wick
    backgroundCtx.beginPath();
    backgroundCtx.moveTo(x + candleWidth / 2, highY);
    backgroundCtx.lineTo(x + candleWidth / 2, lowY);
    backgroundCtx.stroke();

    // Body
    backgroundCtx.fillStyle = isUp ? 'green' : 'red';
    const bodyY = Math.min(openY, closeY);
    const bodyHeight = Math.abs(openY - closeY);
    backgroundCtx.fillRect(x, bodyY, candleWidth, bodyHeight);
  });
}

