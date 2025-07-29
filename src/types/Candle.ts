export interface Candle {
    t: number; // timestamp
    o: number; // open
    c: number; // close
    l: number; // low
    h: number; // high
}

export interface CandleWithIndex extends Candle {
    index: number; // index in the original array
}