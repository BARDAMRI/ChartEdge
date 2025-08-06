export function parseInterval( fallbackMs: number, interval?: string): number {
    const map: Record<string, number> = {
        '1m': 60_000,
        '5m': 5 * 60_000,
        '15m': 15 * 60_000,
        '30m': 30 * 60_000,
        '1h': 60 * 60_000,
        '5h': 5 * 60 * 60_000,
        '1d': 24 * 60 * 60_000,
        '5d': 5 * 24 * 60 * 60_000,
        '7d': 7 * 24 * 60 * 60_000,
        '1mth': 30 * 24 * 60 * 60_000,
        '1y': 365 * 24 * 60 * 60_000,
    };
    return interval && map[interval] ? map[interval] : fallbackMs ?? 60 * 60 * 1000;
}