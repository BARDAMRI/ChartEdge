import {createChart} from './index';
import {AxesPosition, ChartOptions} from './types/types';

const container = document.getElementById('chart-container');

if (container) {
    // Starting timestamp
    const candles = [];
    const startTime = 1714150800000; // Starting timestamp
    let lastClose = 100; // Initial closing price

    // Generate 200 random candle data points
    for (let i = 0; i < 200; i++) {
        const open = lastClose + (Math.random() - 0.5) * 2;
        const close = open + (Math.random() - 0.5) * 2;
        const high = Math.max(open, close) + Math.random() * 1.5;
        const low = Math.min(open, close) - Math.random() * 1.5;
        const time = startTime + i * 60000; // Each candle is 1 minute apart

        candles.push({time, open, high, low, close});
        lastClose = close; // Update lastClose for next candle
    }

    // Chart configuration options
    const options: ChartOptions = {
        type: 'candlestick',
        theme: 'light',
        showOverlayLine: true,
        style: {
            candles: {
                upColor: '#049981', // Color for upward candles
                downColor: '#f23645', // Color for downward candles
                borderColor: '#333', // Border color for candles
                borderWidth: 1, // Border thickness
                bodyWidthFactor: 0.8, // Width of the candle body relative to available space
                spacingFactor: 0.3 // Spacing between candles
            },
            axes: { // Corrected from "axes" to "axes"
                axisPosition: AxesPosition.right, // Y-axis positioned on the right
                numberFractionDigits: 3
            }
        },
        data: candles // Pass generated candle data
    };

    // Initialize the chart with the specified options
    createChart(container, options);
}