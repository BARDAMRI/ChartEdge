import {ChartOptions, LineData, CandleData, CandleDataCompact} from '../types/types';
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

    // Adjust the canvas size to match its container's dimensions
    private resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    // Draws a simple demo line to verify that everything works correctly
    private drawInitial() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawData();
    }


// Draw the data provided in ChartOptions
    private drawData() {
        if (!this.options.data || this.options.data.length === 0) {
            console.warn('No data provided to ChartEdge.');
            return;
        }

        if (this.options.type === 'line') {
            // מצב קו רגיל
            const lineData = this.options.data as LineData[];

            const minTime = Math.min(...lineData.map(d => d.time));
            const maxTime = Math.max(...lineData.map(d => d.time));

            const points = lineData.map((item) => {
                return {
                    x: ((item.time - minTime) / (maxTime - minTime)) * this.canvas.width,
                    y: this.canvas.height - (item.value / 100) * this.canvas.height, // נניח שהערכים 0-100
                };
            });

            this.lineRenderer.draw(points, {
                color: '#007bff', // כחול
                lineWidth: 2,
            });

        } else if (this.options.type === 'candlestick') {
            const candleData = this.options.data as (CandleData | CandleDataCompact)[];
            const isCompact = 'o' in candleData[0];

            const minTime = Math.min(...candleData.map(d => isCompact ? (d as CandleDataCompact).t : (d as CandleData).time));
            const maxTime = Math.max(...candleData.map(d => isCompact ? (d as CandleDataCompact).t : (d as CandleData).time));

            // חשב min ו-max אמיתיים של מחירים
            const minPrice = Math.min(...candleData.map(d => isCompact ? (d as CandleDataCompact).l : (d as CandleData).low));
            const maxPrice = Math.max(...candleData.map(d => isCompact ? (d as CandleDataCompact).h : (d as CandleData).high));

            // הוסף padding של 2% לבטיחות
            const padding = (maxPrice - minPrice) * 0.02;
            const scaledMin = minPrice - padding;
            const scaledMax = maxPrice + padding;

            // drawing the grid net
            this.gridRenderer.drawGrid(
                minTime,
                maxTime,
                scaledMin,
                scaledMax,
                this.canvas.width,
                this.canvas.height
            );

            // drawing the x and y-axis
            this.axisRenderer.drawAxes(
                minTime,
                maxTime,
                scaledMin,
                scaledMax,
                this.canvas.width,
                this.canvas.height
            );
            const candles = candleData.map((item: any) => {
                const time = isCompact ? item.t : item.time;
                const open = isCompact ? item.o : item.open;
                const high = isCompact ? item.h : item.high;
                const low = isCompact ? item.l : item.low;
                const close = isCompact ? item.c : item.close;

                return {
                    x: ((time - minTime) / (maxTime - minTime)) * this.canvas.width,
                    openY: this.canvas.height - ((open - scaledMin) / (scaledMax - scaledMin)) * this.canvas.height,
                    closeY: this.canvas.height - ((close - scaledMin) / (scaledMax - scaledMin)) * this.canvas.height,
                    highY: this.canvas.height - ((high - scaledMin) / (scaledMax - scaledMin)) * this.canvas.height,
                    lowY: this.canvas.height - ((low - scaledMin) / (scaledMax - scaledMin)) * this.canvas.height,
                };
            });
            this.candlestickRenderer.draw(candles, {
                upColor: '#26a69a', // ירוק
                downColor: '#ef5350', // אדום
                lineWidth: 1,
            });

            // ציור קו overlay אם מוגדר
            if (this.options.showOverlayLine) {
                const overlayPoints = candleData.map((item: any) => {
                    const time = isCompact ? item.t : item.time;
                    const close = isCompact ? item.c : item.close;

                    return {
                        x: ((time - minTime) / (maxTime - minTime)) * this.canvas.width,
                        y: this.canvas.height - ((close - scaledMin) / (scaledMax - scaledMin)) * this.canvas.height,
                    };
                });

                this.lineRenderer.draw(overlayPoints, {
                    color: '#007bff',
                    lineWidth: 1,
                });
            }
        }
    }
}

// Public API function to create a chart instance
export function createChart(container: HTMLElement, options: ChartOptions) {
    return new ChartManager(container, options);
}
