import {createChart} from './index';
import {AxesPosition, ChartOptions} from './types/types';

const container = document.getElementById('chart-container');

if (container) {
    const candles = [];
    const startTime = 1714150800000; // זמן התחלתי כלשהו
    let lastClose = 100; // נתחיל מ-100

    for (let i = 0; i < 1000; i++) {
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
        style: {
            candles: {
                upColor: '#049981',
                downColor: '#f23645',
                borderColor: '#333',
                borderWidth: 1,
                bodyWidthFactor: 0.8,
                spacingFactor: 0.3
            },
            axes: {
                axisPosition: AxesPosition.right
            }
        },
        data: candles
    };

    createChart(container, options);
}