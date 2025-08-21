export function parseInterval( fallbackMs: number, interval?: string): number {
    const map: Record<string, number> = {
        '1m': 60,
        '5m': 5 * 60,
        '15m': 15 * 60,
        '30m': 30 * 60,
        '1h': 60 * 60,
        '5h': 5 * 60 * 60,
        '1d': 24 * 60 * 60,
        '5d': 5 * 24 * 60 * 60,
        '7d': 7 * 24 * 60 * 60,
        '1mth': 30 * 24 * 60 * 60,
        '1y': 365 * 24 * 60 * 60,
    };
    return interval && map[interval] ? map[interval] : fallbackMs ?? 60 * 60;
}