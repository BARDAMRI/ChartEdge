import { createChart } from './index';
import { ChartOptions } from './types';

const container = document.getElementById('chart-container');

if (container) {
  const options: ChartOptions = {
    type: 'line', // בעתיד נרחיב
    theme: 'light',
    data: [] // עדיין אין דאטה אמיתי
  };

  createChart(container, options);
} else {
  console.error('Chart container not found');
}