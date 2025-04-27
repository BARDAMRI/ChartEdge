import {AxesPosition, CandleData, CandleDataCompact, ChartOptions, LineData} from '../types/types.ts';
import {LineRenderer} from '../renderer/lineRenderer';
import {CandlestickRenderer} from '../renderer/candlestickRenderer';
import {GridRenderer} from '../renderer/gridRenderer';
import {AxisRenderer} from '../renderer/axisRenderer';


// 2D canvas manager for ChartEdge: handles canvas creation, resizing, and rendering.
export class ChartManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private options: ChartOptions;
    private lineRenderer: LineRenderer;
    private candlestickRenderer: CandlestickRenderer;
    private gridRenderer: GridRenderer;
    private axisRenderer: AxisRenderer;
    private padding = {top: 10, bottom: 30, left: 50, right: 50};

    private drawableWidth: number = 0;
    private drawableHeight: number = 0;
    private drawableOriginX: number = 0;
    private drawableOriginY: number = 0;

    constructor(container: HTMLElement, options: ChartOptions) {
        this.options = options;

        // Create and append a full-size canvas inside the given container
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        container.appendChild(this.canvas);

        // Obtain the 2D rendering context
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to get 2D context');
        }
        this.ctx = ctx;

        // Initialize a LineRenderer with the 2D context
        this.lineRenderer = new LineRenderer(ctx);
        this.candlestickRenderer = new CandlestickRenderer(ctx);
        this.gridRenderer = new GridRenderer(ctx);
        this.axisRenderer = new AxisRenderer(ctx);

        // Set up automatic canvas resizing with debounce
        this.resizeCanvas();
        // Re-Draw the canvas on resize, debounced
        let resizeTimeout: any;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
                this.drawInitial();
            }, 100);
        });

        // Initial drawing when chart is created
        this.drawInitial();
    }

    /**
     * Adjust the canvas size to match its container's dimensions.
     */
    private resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;

        // קובע את הגודל הפיזי של הקנבס לפי רזולוציית המסך
        this.canvas.width = rect.width * pixelRatio;
        this.canvas.height = rect.height * pixelRatio;

        // קובע את הגודל הוויזואלי בקוד CSS
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        // אומר לקנבס לצייר בקואורדינטות רגילות (לא פי רזולוציה)
        this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        // עדכון אזורי הציור
        this.drawableOriginX = this.padding.left + 5; // 5px safe margin
        this.drawableOriginY = this.padding.top;
        this.drawableWidth = rect.width - this.padding.left - this.padding.right - 10; // במונחי CSS
        this.drawableHeight = rect.height - this.padding.top - this.padding.bottom;
    }

    /**
     * Draws the initial background and triggers data drawing.
     * Uses backgroundColor from style options or defaults to white.
     */
    /**
     * Draws the initial background and triggers data drawing.
     * Uses backgroundColor from style options or detects light/dark mode.
     */
    private drawInitial() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let backgroundColor = this.options?.style?.backgroundColor;

        // Detect light/dark mode if not explicitly set
        if (!backgroundColor) {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            backgroundColor = prefersDark ? '#1e1e1e' : '#ffffff';  // Dark grey or White
        }

        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawData();
        // // 🛠️ הוספת ציור סימונים
        // this.drawDebugMarkers();
    }


    /**
     * Draws the chart data (line or candlestick) according to options and styles.
     * Applies style defaults for grid, axes, candles, and overlay line.
     */
    private drawData() {
        if (!this.options?.data || this.options.data.length === 0) {
            console.warn('No data provided to ChartEdge.');
            return;
        }

        const type = this.options?.type ?? 'line';
        if (type === 'line') {
            this.drawLineChart();
        } else if (type === 'candlestick') {
            this.drawCandlestickChart();
        }
    }

    private drawLineChart() {
        const lineData = this.options.data as LineData[];
        const minTime = Math.min(...lineData.map(d => d.time));
        const maxTime = Math.max(...lineData.map(d => d.time));
        const chartWidth = this.drawableWidth;
        const chartHeight = this.drawableHeight;

        const points = lineData.map(item => ({
            x: this.drawableOriginX + ((item.time - minTime) / (maxTime - minTime)) * chartWidth,
            y: this.drawableOriginY + (chartHeight - ((item.value / 100) * chartHeight)),
        }));

        this.lineRenderer.draw(points, {
            color: this.options?.style?.lineOverlay?.color ?? '#007bff',
            lineWidth: this.options?.style?.lineOverlay?.lineWidth ?? 2,
        });
    }

    private drawCandlestickChart() {
        const candleData = this.options.data as (CandleData | CandleDataCompact)[];
        const isCompact = 'o' in candleData[0];

        const {extendedMinTime, extendedMaxTime} = this.calculateTimeRange(candleData, isCompact);
        const {extendedMinPrice, extendedMaxPrice} = this.calculatePriceRange(candleData, isCompact);

        const chartWidth = this.drawableWidth;
        const chartHeight = this.drawableHeight;

        this.drawGridAndAxes(extendedMinTime, extendedMaxTime, extendedMinPrice, extendedMaxPrice, chartWidth, chartHeight);

        const [candles, candleWidth] = this.calculateCandles(candleData, extendedMinPrice, extendedMaxPrice, isCompact);

        // Draw candlestick chart
        this.candlestickRenderer.draw(candles, candleWidth, {
            upColor: this.options?.style?.candles?.upColor ?? '#26a69a',
            downColor: this.options?.style?.candles?.downColor ?? '#ef5350',
            borderColor: this.options?.style?.candles?.borderColor ?? '#000000',
            borderWidth: this.options?.style?.candles?.borderWidth ?? 1,
            bodyWidthFactor: this.options?.style?.candles?.bodyWidthFactor ?? 0.7,
        });

        if (this.options?.showOverlayLine) {
            this.drawOverlayLine(candleData, extendedMinTime, extendedMaxTime, extendedMinPrice, extendedMaxPrice, chartWidth, chartHeight, isCompact);
        }
    }

    private calculateTimeRange(data: (CandleData | CandleDataCompact)[], isCompact: boolean) {
        const minTime = Math.min(...data.map(d => isCompact ? (d as CandleDataCompact).t : (d as CandleData).time));
        const maxTime = Math.max(...data.map(d => isCompact ? (d as CandleDataCompact).t : (d as CandleData).time));
        const timeRange = maxTime - minTime;
        const timePadding = timeRange * 0.02;
        return {
            extendedMinTime: minTime - timePadding,
            extendedMaxTime: maxTime + timePadding,
        };
    }

    private calculatePriceRange(data: (CandleData | CandleDataCompact)[], isCompact: boolean) {
        const minPrice = Math.min(...data.map(d => isCompact ? (d as CandleDataCompact).l : (d as CandleData).low));
        const maxPrice = Math.max(...data.map(d => isCompact ? (d as CandleDataCompact).h : (d as CandleData).high));
        const priceRange = maxPrice - minPrice;
        const pricePadding = priceRange * 0.02;
        return {
            extendedMinPrice: minPrice - pricePadding,
            extendedMaxPrice: maxPrice + pricePadding,
        };
    }

    private drawGridAndAxes(
        extendedMinTime: number,
        extendedMaxTime: number,
        extendedMinPrice: number,
        extendedMaxPrice: number,
        chartWidth: number,
        chartHeight: number
    ) {
        this.gridRenderer.drawGrid(
            extendedMinTime,
            extendedMaxTime,
            extendedMinPrice,
            extendedMaxPrice,
            chartWidth,
            chartHeight,
            this.drawableOriginX,
            this.drawableOriginY,
            this.options?.style?.grid?.gridSpacing ?? 80,
            this.options?.style?.grid?.lineWidth ?? 1,
            this.options?.style?.grid?.lineColor ?? 'rgba(200,200,200,0.5)',
            this.options?.style?.grid?.lineDash ?? []
        );

        this.axisRenderer.drawAxes(
            extendedMinTime,
            extendedMaxTime,
            extendedMinPrice,
            extendedMaxPrice,
            chartWidth,
            chartHeight,
            this.drawableOriginX,
            this.drawableOriginY,
            this.options?.style?.grid?.gridSpacing ?? 80,
            this.options?.style?.axes?.textColor ?? '#131722',
            this.options?.style?.axes?.font ?? '10px Arial',
            this.options?.style?.axes?.lineColor ?? '#131722',
            this.options?.style?.axes?.lineWidth ?? 1.5,
            this.options?.style?.axes?.axisPosition ?? AxesPosition.right,
            this.options?.style?.axes?.numberLocale ?? 'en-US',
            this.options?.style?.axes?.dateLocale ?? 'en-US'
        );
    }

    private drawDebugMarkers() {
        const ctx = this.ctx;
        const radius = 3;

        ctx.save(); // שמירה על ההגדרות

        // Canvas Size Outline
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = 'gray';
        ctx.fillText('canvas.width', this.canvas.width - 100, 15);

        // Drawable Origin X
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.moveTo(this.drawableOriginX, 0);
        ctx.lineTo(this.drawableOriginX, this.canvas.height);
        ctx.stroke();
        ctx.fillStyle = 'red';
        ctx.fillText('drawableOriginX', this.drawableOriginX + 5, 20);
        // Added numeric value at start of line
        ctx.fillText(`${this.drawableOriginX}`, this.drawableOriginX + 5, 10);
        // Draw circles at the ends of the line
        ctx.beginPath();
        ctx.arc(this.drawableOriginX, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${this.drawableOriginX},0`, this.drawableOriginX + 7, 8);
        ctx.beginPath();
        ctx.arc(this.drawableOriginX, this.canvas.height, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${this.drawableOriginX},${this.canvas.height}`, this.drawableOriginX + 7, this.canvas.height - 7);

        // Drawable Origin Y
        ctx.strokeStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(0, this.drawableOriginY);
        ctx.lineTo(this.canvas.width, this.drawableOriginY);
        ctx.stroke();
        ctx.fillStyle = 'orange';
        ctx.fillText('drawableOriginY', 5, this.drawableOriginY - 5);
        // Added numeric value at start of line
        ctx.fillText(`${this.drawableOriginY}`, 5, this.drawableOriginY - 10);
        // Draw circles at the ends of the line
        ctx.beginPath();
        ctx.arc(0, this.drawableOriginY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`0,${this.drawableOriginY}`, 7, this.drawableOriginY - 7);
        ctx.beginPath();
        ctx.arc(this.canvas.width, this.drawableOriginY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${this.canvas.width},${this.drawableOriginY}`, this.canvas.width - 70, this.drawableOriginY - 7);

        // Drawable Width
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        ctx.moveTo(this.drawableOriginX, this.drawableOriginY + 10);
        ctx.lineTo(this.drawableOriginX + this.drawableWidth, this.drawableOriginY + 10);
        ctx.stroke();
        ctx.fillStyle = 'green';
        ctx.fillText('drawableWidth', this.drawableOriginX + this.drawableWidth / 2 - 30, this.drawableOriginY + 25);
        // Added numeric value at end of line
        ctx.fillText(`${this.drawableOriginX + this.drawableWidth}`, this.drawableOriginX + this.drawableWidth + 5, this.drawableOriginY + 10);
        // Draw circles at the ends of the line
        ctx.beginPath();
        ctx.arc(this.drawableOriginX, this.drawableOriginY + 10, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${this.drawableOriginX},${this.drawableOriginY + 10}`, this.drawableOriginX + 7, this.drawableOriginY + 18);
        ctx.beginPath();
        ctx.arc(this.drawableOriginX + this.drawableWidth, this.drawableOriginY + 10, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${this.drawableOriginX + this.drawableWidth},${this.drawableOriginY + 10}`, this.drawableOriginX + this.drawableWidth + 7, this.drawableOriginY + 18);

        // Drawable Height
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(this.drawableOriginX + 10, this.drawableOriginY);
        ctx.lineTo(this.drawableOriginX + 10, this.drawableOriginY + this.drawableHeight);
        ctx.stroke();
        ctx.fillStyle = 'blue';
        ctx.fillText('drawableHeight', this.drawableOriginX + 15, this.drawableOriginY + this.drawableHeight / 2);
        // Added numeric value at end of line
        ctx.fillText(`${this.drawableOriginY + this.drawableHeight}`, this.drawableOriginX + 10, this.drawableOriginY + this.drawableHeight + 15);
        // Draw circles at the ends of the line
        ctx.beginPath();
        ctx.arc(this.drawableOriginX + 10, this.drawableOriginY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${this.drawableOriginX + 10},${this.drawableOriginY}`, this.drawableOriginX + 17, this.drawableOriginY - 7);
        ctx.beginPath();
        ctx.arc(this.drawableOriginX + 10, this.drawableOriginY + this.drawableHeight, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${this.drawableOriginX + 10},${this.drawableOriginY + this.drawableHeight}`, this.drawableOriginX + 17, this.drawableOriginY + this.drawableHeight - 7);

        // Edge Spacing
        const edgeSpacingPx = 5;
        ctx.fillStyle = 'purple';
        ctx.fillText('edgeSpacingPx', this.drawableOriginX - edgeSpacingPx - 40, 50);

        // Spacing Factor (יחס - אין מיקום פיזי, אבל נשים בטקסט)
        const spacingFactor = this.options?.style?.candles?.spacingFactor ?? 0.2;
        ctx.fillStyle = 'brown';
        ctx.fillText(`spacingFactor: ${spacingFactor}`, 10, this.canvas.height - 10);

        ctx.restore(); // החזרת ההגדרות הקודמות
    }

    private calculateCandles(
        candleData: (CandleData | CandleDataCompact)[],
        extendedMinPrice: number,
        extendedMaxPrice: number,
        isCompact: boolean
    ) {
        const edgeSpacingPx = 5;
        const candleCount = candleData.length;
        // Calculate spacingWidth dynamically based on candleCount
        // 0–99: 5px, 100–199: 4px, 200–299: 3px, 300–399: 2px, 400+: 1px
        const spacingWidth = Math.max(1, 5 - Math.floor(candleCount / 100));

        // חישוב הרוחב הפנוי לציור
        const availableWidth = this.drawableWidth - (2 * edgeSpacingPx);

        // חישוב רוחב גוף כל נר
        const candleBodyWidth = (availableWidth - (spacingWidth * (candleCount - 1))) / candleCount;

        let currentX = this.drawableOriginX + edgeSpacingPx;
        const retCandles = [];

        for (let index = 0; index < candleData.length; index++) {
            const time = isCompact ? candleData[index]['t'] : candleData[index]['time'];
            const open = isCompact ? candleData[index]['o'] : candleData[index]['open'];
            const high = isCompact ? candleData[index]['h'] : candleData[index]['high'];
            const low = isCompact ? candleData[index]['l'] : candleData[index]['low'];
            const close = isCompact ? candleData[index]['c'] : candleData[index]['close'];

            const currCandle = {
                x: currentX,
                openY: this.drawableOriginY + (this.drawableHeight - ((open - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * this.drawableHeight),
                closeY: this.drawableOriginY + (this.drawableHeight - ((close - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * this.drawableHeight),
                highY: this.drawableOriginY + (this.drawableHeight - ((high - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * this.drawableHeight),
                lowY: this.drawableOriginY + (this.drawableHeight - ((low - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * this.drawableHeight),
                bodyWidth: candleBodyWidth,
            };
            retCandles.push(currCandle);

            // מעבר לנר הבא
            currentX += candleBodyWidth + spacingWidth;
        }
        return [retCandles, candleBodyWidth];
    }

    private drawOverlayLine(
        candleData: (CandleData | CandleDataCompact)[],
        extendedMinTime: number,
        extendedMaxTime: number,
        extendedMinPrice: number,
        extendedMaxPrice: number,
        chartWidth: number,
        chartHeight: number,
        isCompact: boolean
    ) {
        const overlayPoints = candleData.map((item: any) => {
            const time = isCompact ? item.t : item.time;
            const close = isCompact ? item.c : item.close;
            const xPos = this.drawableOriginX + ((time - extendedMinTime) / (extendedMaxTime - extendedMinTime)) * chartWidth;
            return {
                x: xPos,
                y: this.drawableOriginY + (chartHeight - ((close - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * chartHeight),
            };
        });

        this.lineRenderer.draw(overlayPoints, {
            color: this.options?.style?.lineOverlay?.color ?? '#007bff',
            lineWidth: this.options?.style?.lineOverlay?.lineWidth ?? 2,
            dashed: this.options?.style?.lineOverlay?.dashed ?? false,
        });
    }
}

// Public API function to create a chart instance
export function createChart(container: HTMLElement, options: ChartOptions) {
    return new ChartManager(container, options);
}
