import type { Interval } from './Interval';

/** How incoming bars are combined with the series already on the chart. */
export enum LiveDataPlacement {
    replace = 'replace',
    append = 'append',
    prepend = 'prepend',
    mergeByTime = 'mergeByTime',
}

export interface LiveDataApplyResult {
    ok: boolean;
    intervals: Interval[];
    errors: string[];
    warnings: string[];
}
