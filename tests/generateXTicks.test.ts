import {generateAndDrawTimeTicks} from '../src/components/Canvas/utils/generateTicks';
import type {DrawTicksOptions, TimeRange} from '../src/types/Graph';
import {TimeDetailLevel} from '../src/types/chartOptions';

function createMockCanvas(width: number, height: number): HTMLCanvasElement {
    const ctx = {
        measureText: jest.fn(() => ({width: 40})),
        save: jest.fn(),
        restore: jest.fn(),
        strokeStyle: '',
        fillStyle: '',
        font: '',
        lineWidth: 1,
        textAlign: 'center' as CanvasTextAlign,
        textBaseline: 'top' as CanvasTextBaseline,
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        fillText: jest.fn(),
        canvas: null as unknown as HTMLCanvasElement,
    };
    const canvas = {
        clientWidth: width,
        clientHeight: height,
        getContext: jest.fn((type: string) => (type === '2d' ? ctx : null)),
    } as unknown as HTMLCanvasElement;
    ctx.canvas = canvas;
    return canvas;
}

function drawOptions(axisY: number): DrawTicksOptions {
    return {
        tickHeight: 10,
        tickColor: '#000',
        labelColor: '#000',
        labelFont: '12px Arial',
        labelOffset: 15,
        axisY,
    };
}

function timeTicks(
    canvas: HTMLCanvasElement,
    timeRange: TimeRange,
    numberOfXTicks: number,
    timeFormat: string,
    locale: string,
    timeDetailLevel: TimeDetailLevel = TimeDetailLevel.Auto
) {
    const xAxisHeight = 40;
    return generateAndDrawTimeTicks(
        canvas,
        timeRange,
        numberOfXTicks,
        timeFormat,
        false,
        xAxisHeight,
        '#000',
        timeDetailLevel,
        drawOptions(canvas.clientHeight - xAxisHeight),
        locale
    );
}

describe('generateAndDrawTimeTicks', () => {
    const dayRange: TimeRange = {start: 1700000000, end: 1700000000 + 86400};

    test('returns empty array when end <= start', () => {
        const canvas = createMockCanvas(800, 300);
        const result = timeTicks(canvas, {start: 100, end: 50}, 12, 'HH:mm', 'en-US');
        expect(result).toEqual([]);
    });

    test('returns empty array when canvas width is zero', () => {
        const canvas = createMockCanvas(0, 300);
        const result = timeTicks(canvas, dayRange, 12, 'HH:mm', 'en-US');
        expect(result).toEqual([]);
    });

    test('returns empty array when numberOfXTicks <= 0', () => {
        const canvas = createMockCanvas(800, 300);
        const result = timeTicks(canvas, dayRange, 0, 'HH:mm', 'en-US');
        expect(result).toEqual([]);
    });

    test('throws when canvas has no 2d context', () => {
        const canvas = {
            clientWidth: 800,
            clientHeight: 300,
            getContext: () => null,
        } as unknown as HTMLCanvasElement;
        expect(() => timeTicks(canvas, dayRange, 12, 'HH:mm', 'en-US')).toThrow(
            'Cannot get canvas context'
        );
    });

    test('returns ticks with valid structure', () => {
        const canvas = createMockCanvas(800, 300);
        const ticks = timeTicks(canvas, dayRange, 12, 'HH:mm', 'en-US');
        expect(Array.isArray(ticks)).toBe(true);
        expect(ticks.length).toBeGreaterThan(0);
        ticks.forEach(tick => {
            expect(typeof tick.label).toBe('string');
            expect(typeof tick.position).toBe('number');
        });
    });

    test('produces ordered tick positions within canvas width', () => {
        const canvas = createMockCanvas(200, 300);
        const ticks = timeTicks(canvas, dayRange, 12, 'HH:mm', 'en-US');
        expect(ticks.length).toBeGreaterThan(0);
        for (let i = 1; i < ticks.length; i++) {
            expect(ticks[i].position).toBeGreaterThanOrEqual(ticks[i - 1].position);
            expect(ticks[i].position).toBeLessThanOrEqual(200);
        }
    });

    test('uses locale without throwing and yields string labels', () => {
        const canvas = createMockCanvas(800, 300);
        const ticksGb = timeTicks(canvas, dayRange, 12, 'dd/MM/yyyy', 'en-GB');
        expect(ticksGb.every(t => typeof t.label === 'string')).toBe(true);
        const canvasUs = createMockCanvas(800, 300);
        const ticksUs = timeTicks(canvasUs, dayRange, 12, 'MM/dd/yyyy', 'en-US');
        expect(ticksUs.every(t => typeof t.label === 'string')).toBe(true);
    });

    test('respects TimeDetailLevel.High for short ranges', () => {
        const canvas = createMockCanvas(800, 300);
        const hourRange: TimeRange = {start: 1700000000, end: 1700000000 + 3600};
        const ticks = timeTicks(canvas, hourRange, 12, 'HH:mm', 'en-US', TimeDetailLevel.High);
        expect(ticks.length).toBeGreaterThan(0);
        expect(ticks.every(t => typeof t.label === 'string')).toBe(true);
    });

    test('sub-hour visible span uses minute grid (zoomed time axis)', () => {
        const canvas = createMockCanvas(800, 40);
        const start = 1700000000 + 15 * 60; // +15 min into epoch second bucket
        const subHour: TimeRange = {start, end: start + 20 * 60};
        const ticks = timeTicks(canvas, subHour, 12, 'HH:mm', 'en-US', TimeDetailLevel.Auto);
        expect(ticks.length).toBeGreaterThan(2);
        expect(ticks.every(t => typeof t.label === 'string')).toBe(true);
        expect(ticks.every(t => t.position >= 0 && t.position <= 800)).toBe(true);
    });
});
