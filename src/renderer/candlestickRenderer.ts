interface Candle {
    x: number;
    openY: number;
    closeY: number;
    highY: number;
    lowY: number;
}

interface CandleRendererOptions {
    upColor?: string;
    downColor?: string;
    lineWidth?: number;
}

export class CandlestickRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    draw(candles: Candle[], options?: CandleRendererOptions) {
        const upColor = options?.upColor || '#049981';    // ירוק לעלייה
        const downColor = options?.downColor || '#f23645'; // אדום לירידה
        const lineWidth = options?.lineWidth || 1;

        const numberOfCandles = candles.length;
        const candleSpacing = 0.2; // Slight spacing between candles
        const totalSpacing = (numberOfCandles + 1) * candleSpacing;
        const candleWidth = (this.ctx.canvas.width - totalSpacing) / numberOfCandles;
        const halfCandleWidth = candleWidth / 2;

        candles.forEach(candle => {
            const isUp = candle.closeY < candle.openY;

            this.ctx.strokeStyle = isUp ? upColor : downColor;
            this.ctx.fillStyle = isUp ? upColor : downColor;
            this.ctx.lineWidth = lineWidth;

            // Draw the wick (קו דק בין high ל-low)
            this.ctx.beginPath();
            this.ctx.moveTo(candle.x, candle.highY);
            this.ctx.lineTo(candle.x, candle.lowY);
            this.ctx.stroke();

            // Draw the body (מלבן בין open ל-close)
            const bodyTop = Math.min(candle.openY, candle.closeY);
            const bodyHeight = Math.abs(candle.openY - candle.closeY);

            this.ctx.fillRect(candle.x - halfCandleWidth, bodyTop, candleWidth, bodyHeight);
        });
    }
}