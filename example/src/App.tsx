import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {
    DrawingPoint,
    DrawingStyleOptions,
    Interval,
    RectangleShapeArgs,
    SimpleChartEdgeHandle,
} from 'chartedge';
import {
    ChartType,
    OverlayKind,
    ShapeType,
    SimpleChartEdge,
    TimeDetailLevel,
    OverlaySpecs,
    overlay,
    withOverlayStyle,
    OverlayPriceKey,
    RectangleShape,
    LineShape,
    AxesPosition,
} from 'chartedge';
import './App.css';

function simplePRNG(seed = 12345) {
    // Tiny LCG (deterministic)
    let s = seed >>> 0;
    const rand = () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
    return {rand};
}

/**
 * Generate simple OHLC bars with mild trend + volatility.
 * No regimes, no spikes/gaps (optional toggle below).
 */
function makeSimpleIntervals(params: {
    startTime: number;      // epoch seconds
    startPrice: number;     // e.g. 100
    intervalSec: number;    // e.g. 300 = 5m
    count: number;          // number of bars
    seed?: number;          // deterministic if provided
    driftPerBar?: number;   // small trend component, default 0.04
    vol?: number;           // noise amplitude, default 0.6
    addGapsEvery?: number;  // optional: add small gap every N bars (e.g., 40). Omit for none.
}): Interval[] {
    const {
        startTime,
        startPrice,
        intervalSec,
        count,
        seed = 12345,
        driftPerBar = 0.04,
        vol = 0.6,
        addGapsEvery
    } = params;

    const rng = simplePRNG(seed);
    const out: Interval[] = [];
    let t = startTime;
    let lastClose = startPrice;

    for (let i = 0; i < count; i++) {
        // Optional tiny gap every N bars (disabled if addGapsEvery is undefined)
        if (addGapsEvery && i > 0 && i % addGapsEvery === 0) {
            const gapPct = (rng.rand() - 0.5) * 0.01; // ~±1%
            lastClose = +(lastClose * (1 + gapPct)).toFixed(2);
        }

        const o = lastClose;

        // Simple random-walk close: drift + symmetric noise
        const noise = (rng.rand() - 0.5) * 2 * vol;
        const c = o + driftPerBar + noise;

        // High/Low add small intra-bar wiggle
        const wigUp = Math.abs((rng.rand() - 0.5) * 2) * (vol * 0.8 + 0.1);
        const wigDn = Math.abs((rng.rand() - 0.5) * 2) * (vol * 0.8 + 0.1);
        const h = Math.max(o, c) + wigUp;
        const l = Math.min(o, c) - wigDn;

        // Synthetic volume so VWAP overlays have data
        const baseVol = 1200; // arbitrary baseline
        const volJitter = (rng.rand() - 0.5) * 2 * 300; // ±300 variation
        const v = Math.max(1, Math.round(baseVol + volJitter));

        out.push({
            t,
            o: +o.toFixed(2),
            h: +h.toFixed(2),
            l: +l.toFixed(2),
            c: +c.toFixed(2),
            v,
        });

        lastClose = c;
        t += intervalSec;
    }

    return out;
}

// ---- Seed series: 200 bars of 5m starting at 1688000000 around price 100 ----
const INTERVAL_SEC = 300; // 5 minutes

const INITIAL_INTERVALS: Interval[] = makeSimpleIntervals({
    startTime: 1688000000,
    startPrice: 100,
    intervalSec: INTERVAL_SEC,
    count: 200,
    seed: 4242,
    driftPerBar: 0.03,
    vol: 0.7,
});

function cloneIntervals(rows: Interval[]): Interval[] {
    return rows.map((b) => ({...b}));
}

/** Next synthetic bar after `last` (used for append live demo). */
function makeNextBar(last: Interval, intervalSec: number): Interval {
    const o = last.c;
    const noise = (Math.random() - 0.5) * 1.2;
    const drift = 0.02 + (Math.random() - 0.5) * 0.02;
    const c = o + drift + noise;
    const wickUp = Math.random() * 0.45;
    const wickDn = Math.random() * 0.45;
    const h = Math.max(o, c) + wickUp;
    const l = Math.min(o, c) - wickDn;
    const v = Math.max(1, Math.round(1000 + Math.random() * 500));
    return {
        t: last.t + intervalSec,
        o: +o.toFixed(2),
        h: +h.toFixed(2),
        l: +l.toFixed(2),
        c: +c.toFixed(2),
        v,
    };
}

/** Mutate the forming candle (same `t`) for mergeByTime demo. */
function jitterLastBar(last: Interval): Interval {
    const delta = (Math.random() - 0.5) * 0.35;
    const c = +(last.c + delta).toFixed(2);
    const h = +Math.max(last.h, last.o, c, last.l + 0.01).toFixed(2);
    const l = +Math.min(last.l, last.o, c, last.h - 0.01).toFixed(2);
    const v = Math.max(1, Math.round((last.v ?? 1200) + (Math.random() - 0.5) * 80));
    return {...last, o: last.o, c, h, l, v};
}

// --- Demo overlays ---
const withBlue = withOverlayStyle({lineColor: '#2962ff', lineWidth: 2, lineStyle: 'solid'});
const sma20 = withBlue(OverlaySpecs.sma(20, OverlayPriceKey.close));

// Using the simple "kind" helper with explicit full style (DeepRequired<OverlayOptions>)
const emaDefault = overlay(OverlayKind.ema, {lineColor: '#26a69a', lineWidth: 2, lineStyle: 'solid'});
const vwapOv = overlay(OverlayKind.vwap, {lineColor: '#7e57c2', lineWidth: 1.5, lineStyle: 'solid'});

const demoOverlays = [sma20, emaDefault, vwapOv];

const LIVE_TICK_MS = 900;

export default function App() {
    const chartRef = useRef<SimpleChartEdgeHandle | null>(null);
    const [series, setSeries] = useState<Interval[]>(() => cloneIntervals(INITIAL_INTERVALS));
    const [livePaused, setLivePaused] = useState(false);
    const tickCountRef = useRef(0);
    /** Ensures the three demo drawings are only added once (survives Strict Mode remount). */
    const programmaticShapesSeededRef = useRef(false);

    const exampleVisibleRange = useMemo(() => {
        if (!series.length) {
            return {start: 0, end: 1};
        }
        const lastT = series[series.length - 1].t;
        return {start: series[0].t, end: lastT + INTERVAL_SEC};
    }, [series]);

    const {minPrice, maxPrice} = useMemo(() => {
        if (!series.length) {
            return {minPrice: 0, maxPrice: 100};
        }
        const flat = series.flatMap((c) => [c.l, c.h, c.c, c.o]);
        return {minPrice: Math.min(...flat), maxPrice: Math.max(...flat)};
    }, [series]);

    const pushLiveTick = useCallback(() => {
        const api = chartRef.current;
        if (!api?.applyLiveData || !api.getViewInfo) {
            return;
        }
        const {intervals} = api.getViewInfo();
        if (!intervals?.length) {
            return;
        }
        const last = intervals[intervals.length - 1];
        tickCountRef.current += 1;
        const n = tickCountRef.current;
        // Mostly update the current candle; every 5th tick append a new bar (shows mergeByTime + append).
        const result =
            n % 5 !== 0
                ? api.applyLiveData(jitterLastBar(last), 'mergeByTime')
                : api.applyLiveData(makeNextBar(last, INTERVAL_SEC), 'append');
        if (result.intervals.length) {
            setSeries(result.intervals);
        }
        if (!result.ok && result.errors.length) {
            console.warn('[example] live data:', result.errors, result.warnings);
        }
    }, []);

    useEffect(() => {
        if (livePaused) {
            return;
        }
        const id = window.setInterval(pushLiveTick, LIVE_TICK_MS);
        return () => window.clearInterval(id);
    }, [livePaused, pushLiveTick]);

    /**
     * Seed three drawings entirely from code (`addShape` + plain specs: type, points, style).
     * Geometry is derived from the loaded interval series so shapes stay on-chart.
     */
    useEffect(() => {
        if (!series.length || programmaticShapesSeededRef.current) {
            return;
        }
        const timer = window.setTimeout(() => {
            const api = chartRef.current;
            if (!api?.addShape || programmaticShapesSeededRef.current) {
                return;
            }
            programmaticShapesSeededRef.current = true;

            const t0 = series[0].t;
            const tLast = series[series.length - 1].t;
            const span = Math.max(INTERVAL_SEC, tLast - t0);
            const prices = series.flatMap((b) => [b.l, b.h]);
            const pMin = Math.min(...prices);
            const pMax = Math.max(...prices);
            const pMid = (pMin + pMax) / 2;

            // 1) Trend line — dashed magenta
            api.addShape({
                type: ShapeType.Line,
                points: [
                    {time: t0 + span * 0.12, price: pMid - (pMax - pMin) * 0.08},
                    {time: t0 + span * 0.58, price: pMid + (pMax - pMin) * 0.12},
                ],
                style: {
                    lineColor: '#e040fb',
                    lineWidth: 2,
                    lineStyle: 'dashed',
                },
            });

            // 2) Highlight rectangle — semi-transparent cyan fill
            api.addShape({
                type: ShapeType.Rectangle,
                points: [
                    {time: t0 + span * 0.32, price: pMid - 1.2},
                    {time: t0 + span * 0.48, price: pMid + 2.4},
                ],
                style: {
                    lineColor: '#26c6da',
                    lineWidth: 1,
                    lineStyle: 'solid',
                    fillColor: 'rgba(38, 198, 218, 0.18)',
                },
            });

            // 3) Circle (two corners of bounding box) — amber stroke + light fill
            api.addShape({
                type: ShapeType.Circle,
                points: [
                    {time: t0 + span * 0.62, price: pMid - 0.5},
                    {time: t0 + span * 0.74, price: pMid + 2},
                ],
                style: {
                    lineColor: '#ffca28',
                    lineWidth: 2,
                    lineStyle: 'solid',
                    fillColor: 'rgba(255, 202, 40, 0.14)',
                },
            });

            api.redrawCanvas?.();
        }, 200);

        return () => window.clearTimeout(timer);
    }, [series]);

    const handleRefreshSeries = useCallback(async () => {
        tickCountRef.current = 0;
        programmaticShapesSeededRef.current = false;
        chartRef.current?.clearCanvas?.();
        const reset = cloneIntervals(INITIAL_INTERVALS);
        setSeries(reset);
        // Let React commit props before fitting the view (next frame).
        window.requestAnimationFrame(() => {
            chartRef.current?.fitVisibleRangeToData?.();
            chartRef.current?.redrawCanvas?.();
        });
    }, []);

    const handleSymbolSearch = useCallback((sym: string) => {
        const label = sym || '(empty)';
        window.alert(`Symbol search (demo): ${label}\nWire onSymbolSearch to load data for this symbol.`);
    }, []);

    // Example: add a random shape (rect or line) via API, within visible ranges
    function handleAddShape() {
        const view = chartRef.current?.getViewInfo();
        if (!view) {
            return;
        }

        function createRandomShape(view: any) {
            const {visibleRange, visiblePriceRange} = view;
            const {start, end} = visibleRange;
            const {min, max} = visiblePriceRange;

            const randTime = start + Math.random() * (end - start);
            const randPrice = min + Math.random() * (max - min);

            // Randomly choose shape type
            if (Math.random() < 0.5) {
                // RectangleShape
                const width = (end - start) * 0.05; // 5% of visible time range
                const height = (max - min) * 0.1;   // 10% of visible price range
                return new RectangleShape({
                    points: [
                        {time: randTime, price: randPrice},
                        {time: randTime + width, price: randPrice + height}
                    ]
                } as RectangleShapeArgs, {color: '#e53935'} as DrawingStyleOptions);
            } else {
                // LineShape with two points
                // Generate two points within visible ranges
                const time1 = start + Math.random() * (end - start);
                const price1 = min + Math.random() * (max - min);
                const time2 = start + Math.random() * (end - start);
                const price2 = min + Math.random() * (max - min);

                // Ensure LineShape constructor usage
                return new LineShape(
                    {points: [{time: time1, price: price1}, {time: time2, price: price2}]},
                    {color: '#2962ff', lineWidth: 2} as DrawingStyleOptions
                );
            }
        }

        const shape = createRandomShape(view);

        // Validate shape points are within visible ranges
        function isShapeInRange(shape: any, view: any) {
            const {visibleRange, visiblePriceRange} = view;
            const {start, end} = visibleRange;
            const {min, max} = visiblePriceRange;

            let points: DrawingPoint[] = [];

            if (shape instanceof RectangleShape) {
                points = shape.getPoints();
            } else if (shape instanceof LineShape) {
                points = shape.getPoints();
            } else {
                // Unknown shape type, assume out of range
                return false;
            }

            // Check all points within time and price ranges
            return points.every(p => p.time >= start && p.time <= end && p.price >= min && p.price <= max);
        }

        if (isShapeInRange(shape, view)) {
            chartRef.current?.addShape(shape);
        }
    }

    // Example: get info about the current view
    function handleGetInfo() {
        if (chartRef.current && chartRef.current.getViewInfo) {
            const info = chartRef.current.getViewInfo();
            alert(JSON.stringify(info, null, 2));
        }
    }

    // Example: clear all shapes/canvas
    function handleClear() {
        if (chartRef.current && chartRef.current.clearCanvas) {
            chartRef.current.clearCanvas();
        }
    }

    // Example: force redraw
    function handleRedraw() {
        if (chartRef.current && chartRef.current.redrawCanvas) {
            chartRef.current.redrawCanvas();
        }
    }

    function reloadCanvas() {
        if (chartRef.current && chartRef.current.reloadCanvas) {
            chartRef.current.reloadCanvas();
        }
    }

    return (
        <div className={'app-root'}>
            <div className="live-demo-bar">
                <span className="live-demo-label">
                    Live data demo
                    <span className={`live-demo-status ${livePaused ? 'paused' : 'on'}`}>
                        {livePaused ? 'paused' : 'running'}
                    </span>
                </span>
                <span className="live-demo-hint">
                    Uses <code>applyLiveData</code> with <code>mergeByTime</code> (tick) and <code>append</code> (new bars).
                </span>
                <button type="button" className="live-demo-btn" onClick={() => setLivePaused((p) => !p)}>
                    {livePaused ? 'Resume' : 'Pause'}
                </button>
            </div>
            <SimpleChartEdge
                ref={chartRef}
                className="simple-chart-edge"
                intervalsArray={series}
                onRefreshRequest={handleRefreshSeries}
                defaultSymbol="DEMO"
                onSymbolSearch={handleSymbolSearch}
                initialNumberOfYTicks={5}
                initialXAxisHeight={40}
                initialYAxisWidth={50}
                initialTimeDetailLevel={TimeDetailLevel.Auto}
                initialTimeFormat12h={false}
                initialVisibleTimeRange={exampleVisibleRange}
                initialVisiblePriceRange={{min: minPrice, max: maxPrice}}
                chartOptions={{
                    base: {
                        chartType: ChartType.Candlestick,
                        showOverlayLine: true,
                        // overlays: demoOverlays,
                        // style: {
                        //     overlay: {lineWidth: 1.5, lineStyle: 'solid', lineColor: '#22ff34'},
                        // },
                        // overlayKinds: [OverlayKind.sma, OverlayKind.bbands_lower],
                        showHistogram: true,

                    },
                    axes: {
                        yAxisPosition: AxesPosition.left
                    }
                }}
            />
        </div>
    );
}