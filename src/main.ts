import { createChart } from './index';
import { ChartOptions } from './types/types';

const container = document.getElementById('chart-container');

if (container) {
    const candles = [];
    const startTime = 1714150800000; // זמן התחלתי כלשהו
    let lastClose = 100; // נתחיל מ-100

    for (let i = 0; i < 200; i++) {
        const open = lastClose + (Math.random() - 0.5) * 2;
        const close = open + (Math.random() - 0.5) * 2;
        const high = Math.max(open, close) + Math.random() * 1.5;
        const low = Math.min(open, close) - Math.random() * 1.5;
        const time = startTime + i * 60000; // כל דקה

        candles.push({ time, open, high, low, close });
        lastClose = close; // לעבור לנר הבא
    }

    const options: ChartOptions = {
        type: 'candlestick',
        theme: 'light',
        showOverlayLine: true,
        data: candles,
    };


    createChart(container, options);
}