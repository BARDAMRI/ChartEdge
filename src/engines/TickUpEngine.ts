import type {DeepPartial} from '../types/types';
import type {ChartOptions} from '../types/chartOptions';

/**
 * Pluggable render / theme profile. Apply via {@link TickUpHostHandle.setEngine} or by merging
 * {@link TickUpChartEngine.getChartOptionsPatch} into `chartOptions`.
 */
export interface TickUpChartEngine {
    readonly id: 'standard' | 'prime' | string;
    /** Deep-partial merge applied on top of current chart options */
    getChartOptionsPatch(): DeepPartial<ChartOptions>;
}
