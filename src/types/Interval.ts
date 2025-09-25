export interface Interval {
    t: number;
    o: number;
    c: number;
    l: number;
    h: number;
    v?: number;
}

export interface CandleWithIndex extends Interval {
    index: number; // index in the original array
}