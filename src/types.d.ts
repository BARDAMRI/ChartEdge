export type ChartType = 'line' | 'candlestick';

export interface ChartOptions {
  type: ChartType;
  theme?: 'light' | 'dark' | 'grey' | string;
  data: any[];
}