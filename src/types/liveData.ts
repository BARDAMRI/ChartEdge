import type { Interval } from './Interval';

/** How incoming bars are combined with the series already on the chart. */
export type LiveDataPlacement =
    | 'replace'
    | 'append'
    | 'prepend'
    | 'mergeByTime';

export interface LiveDataApplyResult {
    ok: boolean;
    intervals: Interval[];
    errors: string[];
    warnings: string[];
}
