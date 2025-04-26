import {ChartOptions} from '../types';

// 2D canvas manager.
export class ChartManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private options: ChartOptions;

    constructor(container: HTMLElement, options: ChartOptions) {
        this.options = options;

        // Create and append the canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        container.appendChild(this.canvas);

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to get 2D context');
        }
        this.ctx = ctx;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.drawInitial();
    }

    //Adjust the canvas side to the div's size.
    private resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    // Draws demo line to make sure everything works.
    private drawInitial() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Example line
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(50, this.canvas.height - 50);
        this.ctx.lineTo(this.canvas.width - 50, 50);
        this.ctx.stroke();
    }
}

// The function to be used from outside.
export function createChart(container: HTMLElement, options: ChartOptions) {
    return new ChartManager(container, options);
}