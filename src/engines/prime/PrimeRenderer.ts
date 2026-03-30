import type {DeepRequired} from '../../types/types';
import type {ChartOptions} from '../../types/chartOptions';

export function isPrimeEngine(options: DeepRequired<ChartOptions> | ChartOptions): boolean {
    return options.base?.engine === import('../../types/chartOptions').TickUpRenderEngine.prime;
}
