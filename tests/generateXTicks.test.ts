import {generateXTicks, LABEL_TYPE} from '../src/components/Canvas/utils/generateXTicks'

describe('generateXTicks', () => {
    const baseCandles = Array.from({length: 100}, (_, i) => ({
        t: 1700000000 + i * 60, // 1-minute intervals
        o: 100 + i,
        h: 100 + i + 2,
        l: 100 + i - 1,
        c: 100 + i + 1
    }));

    const canvas = {width: 800, height: 300};
    const textSize = 12;

    test('returns empty array for empty candles', () => {
        const result = generateXTicks('1d', 'auto', [], canvas, textSize);
        expect(result).toEqual([]);
    });

    test('throws for invalid timeRange', () => {
        expect(() => generateXTicks('10x', 'auto', baseCandles, canvas, textSize)).toThrow();
    });

    test('returns ticks with valid structure', () => {
        const ticks = generateXTicks('1d', 'auto', baseCandles, canvas, textSize);
        expect(Array.isArray(ticks)).toBe(true);
        expect(ticks.length).toBeGreaterThan(0);
        ticks.forEach(tick => {
            expect(typeof tick.label).toBe('string');
            expect(typeof tick.x).toBe('number');
            expect(typeof tick.timestamp).toBe('number');
        });
    });

    test('respects canvas width and avoids overlapping labels', () => {
        const ticks = generateXTicks('1d', 'auto', baseCandles, {width: 200, height: 300}, textSize);
        for (let i = 1; i < ticks.length; i++) {
            expect(ticks[i].x - ticks[i - 1].x).toBeGreaterThanOrEqual(textSize * 5);
        }
    });

    test('generates fallback ticks if filtered out', () => {
        const shortCandles = baseCandles.slice(0, 1);
        const ticks = generateXTicks('1d', 3, shortCandles, canvas, textSize);
        expect(ticks.length).toBe(2); // fallback tick count
        expect(ticks[0].x).toBe(0);
        expect(ticks[1].x).toBe(canvas.width);
    });

    test('supports standard label format', () => {
        const ticks = generateXTicks('1d', 'auto', baseCandles, canvas, textSize, {
            labelType: LABEL_TYPE.STANDARD,
            dateFormat: 'dd/mm/yy',
            timeFormat: 'hh:mm',
            locale: 'en-GB'
        });
        expect(ticks.every(t => typeof t.label === 'string')).toBe(true);
    });

    test('supports ui-friendly label format', () => {
        const ticks = generateXTicks('1d', 'auto', baseCandles, canvas, textSize, {
            labelType: LABEL_TYPE.UI_FRIENDLY,
            locale: 'en-US'
        });
        expect(ticks.every(t => typeof t.label === 'string')).toBe(true);
    });

    test('respects fixed tick count if given', () => {
        const ticks = generateXTicks('1d', 5, baseCandles, canvas, textSize);
        expect(ticks.length).toBeLessThanOrEqual(5);
    });

    test('filters bad candle data', () => {
        const invalidCandles = [
            {t: 1700000000, o: 100, h: 101, l: 99, c: 101},
            null,
            undefined,
            {t: null, o: 1, h: 1, l: 1, c: 1}
        ];
        const ticks = generateXTicks('1d', 'auto', invalidCandles, canvas, textSize);
        expect(ticks.length).toBeGreaterThan(0);
    });
});