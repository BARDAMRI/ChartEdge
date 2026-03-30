import type {DeepRequired} from '../../types/types';
import type {ChartOptions} from '../../types/chartOptions';
import {TickUpRenderEngine} from '../../types/chartOptions';

export function isPrimeEngine(options: DeepRequired<ChartOptions> | ChartOptions): boolean {
    return options.base?.engine === TickUpRenderEngine.prime;
}
