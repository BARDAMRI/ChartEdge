import {Candle} from '../../../types/Candle';
import {useChartStore} from "../../../store/useChartStore.ts";

export function drawCandlesticks(
    ctx: CanvasRenderingContext2D,
    candles: Candle[],
    visibleRange: { start: number; end: number },
    padding: number,
    minPrice: number,
    maxPrice: number
): void {

    const {canvasWidth, canvasHeight} = useChartStore.getState?.();

    const drawableWidth = canvasWidth - 2 * padding;
    const drawableHeight = canvasHeight - 2 * padding;

    const candleCount = visibleRange.end - visibleRange.start;
    if (candleCount <= 0) return;

    const candleSpacing = drawableWidth / candleCount;
    const candleWidth = candleSpacing * 0.6;

    const priceRange = maxPrice - minPrice;

    // פונקציה להמרת מחיר למיקום Y בקנבס
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

        // ציור ה-wick (הקו העליון והתחתון)
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        // ציור גוף הנר
        const bodyY = Math.min(openY, closeY);
        const bodyHeight = Math.max(1, Math.abs(openY - closeY)); // לפחות 1 פיקסל גובה
        ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
    });
}

