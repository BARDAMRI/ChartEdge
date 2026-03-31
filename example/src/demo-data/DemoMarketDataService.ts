import type {Interval} from 'tickup/full';
import {advanceLiveSeries, buildMockIntervals} from '../../data-generator';

export type DemoSymbol = 'TICKUP' | 'AAPL' | 'TSLA' | 'MSFT' | 'BTC-USD';
export type DemoIntervalKey = '1m' | '5m' | '15m' | '1h' | '1D' | '1W';

export type DemoHistoryParams = {
    symbol: string;
    interval: DemoIntervalKey;
    /** How many bars to fetch. */
    count: number;
    /** End timestamp (seconds). Defaults to a stable demo epoch. */
    endTimeSec?: number;
};

export type DemoHistoryResult = {
    symbol: DemoSymbol;
    interval: DemoIntervalKey;
    intervalSec: number;
    intervals: Interval[];
};

export type DemoSubscription = {
    stop: () => void;
};

const INTERVAL_SEC: Record<DemoIntervalKey, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '1D': 86400,
    '1W': 7 * 86400,
};

const SYMBOLS: readonly DemoSymbol[] = ['TICKUP', 'AAPL', 'TSLA', 'MSFT', 'BTC-USD'] as const;
const INTERVALS: readonly DemoIntervalKey[] = ['1m', '5m', '15m', '1h', '1D', '1W'] as const;

function normalizeSymbol(s: string): DemoSymbol | null {
    const sym = String(s || '')
        .trim()
        .toUpperCase();
    return (SYMBOLS as readonly string[]).includes(sym) ? (sym as DemoSymbol) : null;
}

function seedFor(symbol: DemoSymbol, interval: DemoIntervalKey): number {
    // Stable, deterministic seed per (symbol, interval)
    let h = 2166136261;
    const str = `${symbol}:${interval}`;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function startPriceFor(symbol: DemoSymbol): number {
    switch (symbol) {
        case 'BTC-USD':
            return 68000;
        case 'TSLA':
            return 190;
        case 'AAPL':
            return 175;
        case 'MSFT':
            return 410;
        case 'TICKUP':
        default:
            return 128.5;
    }
}

function driftFor(symbol: DemoSymbol): number {
    switch (symbol) {
        case 'BTC-USD':
            return 3.5;
        case 'TSLA':
            return 0.06;
        case 'AAPL':
            return 0.03;
        case 'MSFT':
            return 0.035;
        case 'TICKUP':
        default:
            return 0.02;
    }
}

function volFor(symbol: DemoSymbol): number {
    switch (symbol) {
        case 'BTC-USD':
            return 120;
        case 'TSLA':
            return 1.2;
        case 'AAPL':
            return 0.8;
        case 'MSFT':
            return 0.9;
        case 'TICKUP':
        default:
            return 0.55;
    }
}

function isFiniteIntervalBar(it: Interval): boolean {
    return (
        Number.isFinite(it.t) &&
        Number.isFinite(it.o) &&
        Number.isFinite(it.h) &&
        Number.isFinite(it.l) &&
        Number.isFinite(it.c) &&
        (it.v === undefined || Number.isFinite(it.v))
    );
}

export class DemoMarketDataService {
    readonly symbols = SYMBOLS;
    readonly intervals = INTERVALS;
    readonly intervalSecByKey = INTERVAL_SEC;

    /**
     * Fetch synthetic history (yfinance-like).
     * This is async to mimic real APIs; it is deterministic per (symbol, interval, count, endTimeSec).
     */
    async history(params: DemoHistoryParams): Promise<DemoHistoryResult> {
        const symbol = normalizeSymbol(params.symbol);
        if (!symbol) {
            throw new Error(`Unknown demo symbol: ${params.symbol}`);
        }
        const interval = params.interval;
        const intervalSec = INTERVAL_SEC[interval];
        const count = Math.max(2, Math.floor(params.count || 0));
        const endTimeSec = Math.floor(params.endTimeSec ?? 1_700_000_000);

        const startTime = endTimeSec - intervalSec * count;
        const intervals = buildMockIntervals({
            startTime,
            startPrice: startPriceFor(symbol),
            intervalSec,
            count,
            seed: seedFor(symbol, interval) ^ endTimeSec,
            driftPerBar: driftFor(symbol),
            vol: volFor(symbol),
        });

        const finiteIntervals = intervals.filter(isFiniteIntervalBar);
        if (!finiteIntervals.length) {
            throw new Error(`Demo history produced invalid values for ${symbol} ${interval}.`);
        }

        return {symbol, interval, intervalSec, intervals: finiteIntervals};
    }

    /**
     * Subscribe to synthetic live updates (merge/append).
     * Caller owns the current series state; `onUpdate` receives the next series array.
     */
    subscribeLive(opts: {
        symbol: DemoSymbol;
        interval: DemoIntervalKey;
        tickMs: number;
        onUpdate: (next: Interval[]) => void;
        getCurrent: () => Interval[];
    }): DemoSubscription {
        const {interval} = opts;
        const intervalSec = INTERVAL_SEC[interval];
        const tickCounter = {current: 0};
        const id = window.setInterval(() => {
            const cur = opts.getCurrent();
            const next = advanceLiveSeries(cur, intervalSec, tickCounter);
            opts.onUpdate(next);
        }, Math.max(120, opts.tickMs));
        return {
            stop: () => window.clearInterval(id),
        };
    }
}

export const demoMarketData = new DemoMarketDataService();

