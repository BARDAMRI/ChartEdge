import {ChartOptions, LineData, CandleData, CandleDataCompact} from '../types/types.ts';
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
    private padding = { top: 10, bottom: 30, left: 50, right: 50 };

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

        // Set up automatic canvas resizing
        this.resizeCanvas();
        // Re-Draw the canvas.
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.drawInitial();
        });

        // Initial drawing when chart is created
        this.drawInitial();
    }

    /**
     * Adjust the canvas size to match its container's dimensions.
     */
    private resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.drawableOriginX = this.padding.left + 5; // 5px safe edge
        this.drawableOriginY = this.padding.top;
        this.drawableWidth = this.canvas.width - this.padding.left - this.padding.right - 10; // 5px each side
        this.drawableHeight = this.canvas.height - this.padding.top - this.padding.bottom;
    }

    /**
     * Draws the initial background and triggers data drawing.
     * Uses backgroundColor from style options or defaults to white.
     */
    private drawInitial() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = this.options?.style?.backgroundColor ?? '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawData();
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

        const edgeSpacingPx = 5;

        const type = this.options?.type ?? 'line';

        if (type === 'line') {
            // Normal line chart mode
            const lineData = this.options?.data as LineData[];

            const minTime = Math.min(...lineData.map(d => d.time));
            const maxTime = Math.max(...lineData.map(d => d.time));

            const chartWidth = this.drawableWidth;
            const chartHeight = this.drawableHeight;

            const points = lineData.map((item) => {
                return {
                    x: this.drawableOriginX + ((item.time - minTime) / (maxTime - minTime)) * chartWidth,
                    y: this.drawableOriginY + (chartHeight - ((item.value / 100) * chartHeight)), // assuming values 0-100
                };
            });

            this.lineRenderer.draw(points, {
                color: this.options?.style?.lineOverlay?.color ?? '#007bff',
                lineWidth: this.options?.style?.lineOverlay?.lineWidth ?? 2,
            });

        } else if (type === 'candlestick') {
            const candleData = this.options?.data as (CandleData | CandleDataCompact)[];
            const isCompact = 'o' in candleData[0];

            const minTime = Math.min(...candleData.map(d => isCompact ? (d as CandleDataCompact).t : (d as CandleData).time));
            const maxTime = Math.max(...candleData.map(d => isCompact ? (d as CandleDataCompact).t : (d as CandleData).time));

            const timeRange = maxTime - minTime;
            const timePadding = timeRange * 0.02;
            const extendedMinTime = minTime - timePadding;
            const extendedMaxTime = maxTime + timePadding;

            const minPrice = Math.min(...candleData.map(d => isCompact ? (d as CandleDataCompact).l : (d as CandleData).low));
            const maxPrice = Math.max(...candleData.map(d => isCompact ? (d as CandleDataCompact).h : (d as CandleData).high));

            const priceRange = maxPrice - minPrice;
            const pricePadding = priceRange * 0.02;
            const extendedMinPrice = minPrice - pricePadding;
            const extendedMaxPrice = maxPrice + pricePadding;

            const chartWidth = this.drawableWidth;
            const chartHeight = this.drawableHeight;

            const spacingFactor = this.options?.style?.candles?.spacingFactor ?? 0.3;
            const totalUnits = candleData.length + (candleData.length - 1) * spacingFactor;
            const unitWidth = chartWidth / totalUnits;
            const candleBodyWidth = unitWidth;
            const spacingWidth = unitWidth * spacingFactor;

            this.ctx.beginPath();
            this.ctx.moveTo(this.drawableOriginX, this.drawableOriginY + chartHeight);
            this.ctx.lineTo(this.drawableOriginX + chartWidth, this.drawableOriginY + chartHeight);
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

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
                this.options?.style?.axes?.axisPosition ?? 'right',
                this.options?.style?.axes?.numberLocale ?? 'en-US',
                this.options?.style?.axes?.dateLocale ?? 'en-US'
            );

            const candles = candleData.map((item: any) => {
                const time = isCompact ? item.t : item.time;
                const open = isCompact ? item.o : item.open;
                const high = isCompact ? item.h : item.high;
                const low = isCompact ? item.l : item.low;
                const close = isCompact ? item.c : item.close;

                // חישוב מיקום X לפי זמן
                const xPos = this.drawableOriginX + ((time - extendedMinTime) / (extendedMaxTime - extendedMinTime)) * chartWidth;

                // חישוב רוחב נר מתוך chartWidth חלקי מספר נרות
                const totalUnits = candleData.length + (candleData.length - 1) * (this.options?.style?.candles?.spacingFactor ?? 0.3);
                const unitWidth = chartWidth / totalUnits;
                const candleBodyWidth = unitWidth;

                return {
                    x: xPos,
                    openY: this.drawableOriginY + (chartHeight - ((open - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * chartHeight),
                    closeY: this.drawableOriginY + (chartHeight - ((close - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * chartHeight),
                    highY: this.drawableOriginY + (chartHeight - ((high - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * chartHeight),
                    lowY: this.drawableOriginY + (chartHeight - ((low - extendedMinPrice) / (extendedMaxPrice - extendedMinPrice)) * chartHeight),
                    bodyWidth: candleBodyWidth,
                    offsetX: candleBodyWidth / 2,
                };
            });

            this.candlestickRenderer.draw(candles, {
                upColor: this.options?.style?.candles?.upColor ?? '#26a69a',
                downColor: this.options?.style?.candles?.downColor ?? '#ef5350',
                borderColor: this.options?.style?.candles?.borderColor ?? '#000000',
                borderWidth: this.options?.style?.candles?.borderWidth ?? 1,
                bodyWidthFactor: this.options?.style?.candles?.bodyWidthFactor ?? 0.7,
                xOffset: undefined,
            });

            if (this.options?.showOverlayLine) {
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
                    lineWidth: this.options?.style?.lineOverlay?.lineWidth ?? 1,
                    dashed: this.options?.style?.lineOverlay?.dashed ?? false,
                });
            }
        }
    }
}

// Public API function to create a chart instance
export function createChart(container: HTMLElement, options: ChartOptions) {
    return new ChartManager(container, options);
}
