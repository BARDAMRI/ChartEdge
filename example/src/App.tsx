import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {Interval, SimpleChartEdgeHandle} from 'chartedge';
import {
    AxesPosition,
    ChartEdgeApex,
    ChartEdgeCommand,
    ChartEdgeDesk,
    ChartEdgeFlow,
    ChartEdgePulse,
    ShapeType,
    TimeDetailLevel,
} from 'chartedge';
import './App.css';

function simplePRNG(seed = 12345) {
    let s = seed >>> 0;
    const rand = () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
    return {rand};
}

function makeSimpleIntervals(params: {
    startTime: number;
    startPrice: number;
    intervalSec: number;
    count: number;
    seed?: number;
    driftPerBar?: number;
    vol?: number;
    addGapsEvery?: number;
}): Interval[] {
    const {
        startTime,
        startPrice,
        intervalSec,
        count,
        seed = 12345,
        driftPerBar = 0.04,
        vol = 0.6,
        addGapsEvery,
    } = params;

    const rng = simplePRNG(seed);
    const out: Interval[] = [];
    let t = startTime;
    let lastClose = startPrice;

    for (let i = 0; i < count; i++) {
        if (addGapsEvery && i > 0 && i % addGapsEvery === 0) {
            const gapPct = (rng.rand() - 0.5) * 0.01;
            lastClose = +(lastClose * (1 + gapPct)).toFixed(2);
        }

        const o = lastClose;
        const noise = (rng.rand() - 0.5) * 2 * vol;
        const c = o + driftPerBar + noise;
        const wigUp = Math.abs((rng.rand() - 0.5) * 2) * (vol * 0.8 + 0.1);
        const wigDn = Math.abs((rng.rand() - 0.5) * 2) * (vol * 0.8 + 0.1);
        const h = Math.max(o, c) + wigUp;
        const l = Math.min(o, c) - wigDn;
        const baseVol = 1200;
        const volJitter = (rng.rand() - 0.5) * 2 * 300;
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

const INTERVAL_SEC = 300;

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

function jitterLastBar(last: Interval): Interval {
    const delta = (Math.random() - 0.5) * 0.35;
    const c = +(last.c + delta).toFixed(2);
    const h = +Math.max(last.h, last.o, c, last.l + 0.01).toFixed(2);
    const l = +Math.min(last.l, last.o, c, last.h - 0.01).toFixed(2);
    const v = Math.max(1, Math.round((last.v ?? 1200) + (Math.random() - 0.5) * 80));
    return {...last, o: last.o, c, h, l, v};
}

const LIVE_TICK_MS = 900;

type TierKey = 'pulse' | 'flow' | 'command' | 'desk' | 'apex';

/** Programmatic demo shapes (line, rectangle, circle) are seeded only on these tiers. */
const TIERS_WITH_DEMO_SHAPES: TierKey[] = ['pulse', 'flow'];

const TIER_ROWS: {
    key: TierKey;
    title: string;
    blurb: string;
    Cmp: typeof ChartEdgeCommand;
}[] = [
    {
        key: 'pulse',
        title: 'ChartEdge Pulse',
        blurb: 'Minimal embed — price plot and axes only (no toolbars).',
        Cmp: ChartEdgePulse,
    },
    {
        key: 'flow',
        title: 'ChartEdge Flow',
        blurb: 'Analysis — top bar & settings; no drawing tools sidebar.',
        Cmp: ChartEdgeFlow,
    },
    {
        key: 'command',
        title: 'ChartEdge Command',
        blurb: 'Full trader UI — drawings, modals, programmatic API.',
        Cmp: ChartEdgeCommand,
    },
    {
        key: 'desk',
        title: 'ChartEdge Desk',
        blurb: 'Broker-style — same as Command; attribution always on.',
        Cmp: ChartEdgeDesk,
    },
    {
        key: 'apex',
        title: 'ChartEdge Apex',
        blurb: 'Premium tier (preview) — evaluation banner until licenseKey is set.',
        Cmp: ChartEdgeApex,
    },
];

function seedDemoShapes(api: SimpleChartEdgeHandle | null, series: Interval[]) {
    if (!api?.addShape || !series.length) {
        return;
    }
    const t0 = series[0].t;
    const tLast = series[series.length - 1].t;
    const span = Math.max(INTERVAL_SEC, tLast - t0);
    const prices = series.flatMap((b) => [b.l, b.h]);
    const pMin = Math.min(...prices);
    const pMax = Math.max(...prices);
    const pMid = (pMin + pMax) / 2;

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
}

export default function App() {
    const refs = useRef<Record<TierKey, SimpleChartEdgeHandle | null>>({
        pulse: null,
        flow: null,
        command: null,
        desk: null,
        apex: null,
    });

    const commandRef = useRef<SimpleChartEdgeHandle | null>(null);

    const tierRefCallbacks = useMemo(() => {
        const keys: TierKey[] = ['pulse', 'flow', 'command', 'desk', 'apex'];
        const out = {} as Record<TierKey, (h: SimpleChartEdgeHandle | null) => void>;
        keys.forEach((key) => {
            out[key] = (h: SimpleChartEdgeHandle | null) => {
                refs.current[key] = h;
                if (key === 'command') {
                    commandRef.current = h;
                }
            };
        });
        return out;
    }, []);

    const [series, setSeries] = useState<Interval[]>(() => cloneIntervals(INITIAL_INTERVALS));
    const [livePaused, setLivePaused] = useState(false);
    const tickCountRef = useRef(0);
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

    const chartOptions = useMemo(
        () => ({
            base: {
                showOverlayLine: true,
                showHistogram: true,
            },
            axes: {
                yAxisPosition: AxesPosition.left,
            },
        }),
        []
    );

    const pushLiveTick = useCallback(() => {
        const api = commandRef.current;
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

    useEffect(() => {
        if (!series.length || programmaticShapesSeededRef.current) {
            return;
        }
        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 24;

        const trySeed = () => {
            if (cancelled || programmaticShapesSeededRef.current) {
                return;
            }
            const demoReady = TIERS_WITH_DEMO_SHAPES.every((k) => refs.current[k] != null);
            attempts += 1;
            if (!demoReady && attempts < maxAttempts) {
                requestAnimationFrame(trySeed);
                return;
            }
            programmaticShapesSeededRef.current = true;
            TIERS_WITH_DEMO_SHAPES.forEach((k) => {
                const api = refs.current[k];
                if (api) {
                    seedDemoShapes(api, series);
                }
            });
        };

        const timer = window.setTimeout(() => requestAnimationFrame(trySeed), 200);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [series]);

    const handleRefreshSeries = useCallback(async () => {
        tickCountRef.current = 0;
        programmaticShapesSeededRef.current = false;
        (Object.keys(refs.current) as TierKey[]).forEach((key) => {
            refs.current[key]?.clearCanvas?.();
        });
        const reset = cloneIntervals(INITIAL_INTERVALS);
        setSeries(reset);
        window.requestAnimationFrame(() => {
            (Object.keys(refs.current) as TierKey[]).forEach((key) => {
                const api = refs.current[key];
                api?.fitVisibleRangeToData?.();
                api?.redrawCanvas?.();
            });
        });
    }, []);

    const handleSymbolSearch = useCallback((sym: string) => {
        const label = sym || '(empty)';
        window.alert(`Symbol search (demo): ${label}\nWire onSymbolSearch to load data for this symbol.`);
    }, []);

    const sharedProps = {
        intervalsArray: series,
        onRefreshRequest: handleRefreshSeries,
        defaultSymbol: 'DEMO',
        onSymbolSearch: handleSymbolSearch,
        initialNumberOfYTicks: 5,
        initialXAxisHeight: 40,
        initialYAxisWidth: 50,
        initialTimeDetailLevel: TimeDetailLevel.Auto,
        initialTimeFormat12h: false,
        initialVisibleTimeRange: exampleVisibleRange,
        chartOptions,
    };

    return (
        <div className="app-root app-compare">
            <header className="compare-header">
                <h1 className="compare-title">ChartEdge product comparison</h1>
                <p className="compare-lead">
                    Same synthetic series and chart options on every tier. Live updates run through{' '}
                    <strong>Command</strong>’s API; all panels follow <code>intervalsArray</code>.
                </p>
            </header>

            <div className="live-demo-bar">
                <span className="live-demo-label">
                    Live data demo
                    <span className={`live-demo-status ${livePaused ? 'paused' : 'on'}`}>
                        {livePaused ? 'paused' : 'running'}
                    </span>
                </span>
                <span className="live-demo-hint">
                    Uses <code>applyLiveData</code> on Command (<code>mergeByTime</code> / <code>append</code>).
                </span>
                <button type="button" className="live-demo-btn" onClick={() => setLivePaused((p) => !p)}>
                    {livePaused ? 'Resume' : 'Pause'}
                </button>
            </div>

            <div className="chart-compare-list">
                {TIER_ROWS.map(({key, title, blurb, Cmp}) => (
                    <section key={key} className="chart-compare-panel" data-tier={key}>
                        <div className="chart-compare-panel-head">
                            <h2 className="chart-compare-panel-title">{title}</h2>
                            <p className="chart-compare-panel-blurb">{blurb}</p>
                        </div>
                        <div className="chart-compare-chart-wrap">
                            <Cmp ref={tierRefCallbacks[key]} {...sharedProps} />
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
