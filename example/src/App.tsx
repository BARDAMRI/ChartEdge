import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {Interval, TickUpHostHandle} from 'tickup/full';
import {
    AxesPosition,
    ChartTheme,
    LiveDataPlacement,
    ShapeType,
    StrokeLineStyle,
    TickUpCommand,
    TickUpDesk,
    TickUpFlow,
    TickUpPrime,
    TickUpPrimeTier,
    TickUpPulse,
    TimeDetailLevel,
} from 'tickup/full';
import {Zap, Play, Pause, RefreshCw, Sun, Moon} from 'lucide-react';
import TickUpDemo from './TickUpDemo';
import './index.css';

// ----------------------------------------------------------------------------
// DATA GENERATION
// ----------------------------------------------------------------------------
function simplePRNG(seed = 12345) {
    let s = seed >>> 0;
    const rand = () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
    return {rand};
}

function makeSimpleIntervals({
    startTime,
    startPrice,
    intervalSec,
    count,
    seed = 12345,
    driftPerBar = 0.04,
    vol = 0.6,
    addGapsEvery,
}: any): Interval[] {
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

// ----------------------------------------------------------------------------
// STRUCTURE
// ----------------------------------------------------------------------------
type TierKey = 'pulse' | 'flow' | 'command' | 'desk' | 'prime';

// Seed demo drawings on a single chart only (avoid clutter).
const TIERS_WITH_DEMO_SHAPES: TierKey[] = ['command'];

const TIER_ROWS: {
    key: TierKey;
    title: string;
    blurb: string;
    Cmp: any; // e.g. typeof TickUpCommand
    lux?: boolean;
}[] = [
    {
        key: 'pulse',
        title: 'TickUp Pulse',
        blurb: 'Minimal embed — price plot and axes only (no toolbars). Pure data.',
        Cmp: TickUpPulse,
    },
    {
        key: 'flow',
        title: 'TickUp Flow',
        blurb: 'Analysis — top bar & settings; no drawing tools sidebar.',
        Cmp: TickUpFlow,
    },
    {
        key: 'command',
        title: 'TickUp Command',
        blurb: 'Full trader UI — drawings, modals, programmatic API.',
        Cmp: TickUpCommand,
    },
    {
        key: 'desk',
        title: 'TickUp Desk',
        blurb: 'Broker-style — same as Command; attribution always on.',
        Cmp: TickUpDesk,
    },
    {
        key: 'prime',
        title: 'TickUp Prime',
        blurb: 'The luxury offering — next-gen vibrant WebGL features & ultra-performance.',
        Cmp: TickUpPrimeTier,
        lux: true,
    },
];

function seedDemoShapes(api: TickUpHostHandle | null, series: Interval[]) {
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
            lineStyle: StrokeLineStyle.dashed,
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
            lineStyle: StrokeLineStyle.solid,
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
            lineStyle: StrokeLineStyle.solid,
            fillColor: 'rgba(255, 202, 40, 0.14)',
        },
    });
    api.addShape({
        type: ShapeType.Triangle,
        points: [
            {time: t0 + span * 0.78, price: pMid + 0.8},
            {time: t0 + span * 0.86, price: pMid + 0.1},
        ],
        style: {
            lineColor: '#60a5fa',
            lineWidth: 2,
            lineStyle: StrokeLineStyle.solid,
            fillColor: 'rgba(96, 165, 250, 0.14)',
        },
    });
    api.addShape({
        type: ShapeType.Arrow,
        points: [
            {time: t0 + span * 0.18, price: pMid + 0.4},
            {time: t0 + span * 0.26, price: pMid + 1.0},
        ],
        style: {
            lineColor: '#34d399',
            lineWidth: 2,
            lineStyle: StrokeLineStyle.solid,
        },
    });
    api.redrawCanvas?.();
}

export default function App() {
    const refs = useRef<Record<TierKey, TickUpHostHandle | null>>({
        pulse: null,
        flow: null,
        command: null,
        desk: null,
        prime: null,
    });

    const commandRef = useRef<TickUpHostHandle | null>(null);

    const tierRefCallbacks = useMemo(() => {
        const keys: TierKey[] = ['pulse', 'flow', 'command', 'desk', 'prime'];
        const out = {} as Record<TierKey, (h: TickUpHostHandle | null) => void>;
        keys.forEach((key) => {
            out[key] = (h: TickUpHostHandle | null) => {
                refs.current[key] = h;
                if (key === 'command') {
                    commandRef.current = h;
                }
                
                // We avoid calling h.setEngine here during render/ref assignment
            };
        });
        return out;
    }, []);

    const [series, setSeries] = useState<Interval[]>(() => cloneIntervals(INITIAL_INTERVALS));
    const [livePaused, setLivePaused] = useState(false);
    const tickCountRef = useRef(0);
    const programmaticShapesSeededRef = useRef(false);

    const [theme, setTheme] = useState<ChartTheme>(() => {
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return ChartTheme.light;
        }
        return ChartTheme.dark;
    });
    const [page, setPage] = useState<'tiers' | 'ticks'>('tiers');

    useEffect(() => {
        const mqLight = window.matchMedia('(prefers-color-scheme: light)');
        const handler = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? ChartTheme.light : ChartTheme.dark);
        };
        mqLight.addEventListener('change', handler);
        return () => mqLight.removeEventListener('change', handler);
    }, []);

    // Apply Prime engine once using an effect
    useLayoutEffect(() => {
        const timer = requestAnimationFrame(() => {
            const h = refs.current.prime;
            if (h?.setEngine) {
                h.setEngine(TickUpPrime);
            }
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    const exampleVisibleRange = useMemo(() => {
        if (!series.length) {
            return {start: 0, end: 1};
        }
        const lastT = series[series.length - 1].t;
        return {start: series[0].t, end: lastT + INTERVAL_SEC};
    }, [series]);

    const standardChartOptions = useMemo(
        () => ({
            base: {
                theme: theme,
                showOverlayLine: true,
                showHistogram: true,
                showCrosshair: true,
                showCrosshairValues: true,
                style: {
                    backgroundColor: theme === ChartTheme.dark ? '#0b0e14' : '#ffffff',
                    grid: {
                        lineColor: theme === ChartTheme.dark ? '#334155' : '#e2e8f0',
                    },
                    histogram: {
                        bullColor: theme === ChartTheme.dark ? 'rgba(38, 166, 154, 0.5)' : 'rgba(38, 166, 154, 0.5)',
                        bearColor: theme === ChartTheme.dark ? 'rgba(239, 83, 80, 0.5)' : 'rgba(239, 83, 80, 0.5)',
                        opacity: theme === ChartTheme.dark ? 0.9 : 0.6,
                    },
                    axes: {
                        lineColor: theme === ChartTheme.dark ? '#334155' : '#e2e8f0',
                        textColor: theme === ChartTheme.dark ? '#94a3b8' : '#64748b',
                    }
                }
            },
            axes: {
                yAxisPosition: AxesPosition.right,
            },
        }),
        [theme]
    );

    const pushLiveTick = useCallback(() => {
        const api = commandRef.current;
        if (!api?.applyLiveData || !api.getViewInfo) {
            return;
        }
        const viewInfo = api.getViewInfo();
        const intervals = viewInfo?.intervals;
        if (!intervals?.length) {
            return;
        }
        const last = intervals[intervals.length - 1];
        tickCountRef.current += 1;
        const n = tickCountRef.current;
        const result =
            n % 5 !== 0
                ? api.applyLiveData(jitterLastBar(last), LiveDataPlacement.mergeByTime)
                : api.applyLiveData(makeNextBar(last, INTERVAL_SEC), LiveDataPlacement.append);
        if (result.intervals.length) {
            setSeries(result.intervals);
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
        initialNumberOfYTicks: 8,
        initialTimeDetailLevel: TimeDetailLevel.Medium,
        initialVisibleTimeRange: exampleVisibleRange,
        chartOptions: standardChartOptions,
        themeVariant: theme,
        onThemeVariantChange: setTheme,
    };

    return (
        <div 
            className={`flex min-h-screen flex-col font-sans transition-colors duration-300 ${
                theme === ChartTheme.dark ? 'bg-[#050608] text-slate-200' : 'bg-slate-50 text-slate-800'
            }`} 
            style={{ backgroundImage: theme === ChartTheme.dark ? 'radial-gradient(circle at 50% 10%, rgba(62,197,255,0.06), transparent 50%)' : 'radial-gradient(circle at 50% 10%, rgba(62,197,255,0.15), transparent 50%)' }}
        >
            <header className={`sticky top-0 z-50 py-4 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-b ${
                theme === ChartTheme.dark ? 'border-white/5 bg-[#0f121c]/80 backdrop-blur-md' : 'border-slate-200 bg-white/80 backdrop-blur-md'
            }`}>
                <div className="flex items-center">
                    <div className="flex flex-col leading-tight">
                        <div className="text-lg font-extrabold tracking-tight">
                            TickUp <span className="text-[#3EC5FF]">Charts</span>
                        </div>
                        <div className={`${theme === ChartTheme.dark ? 'text-slate-400' : 'text-slate-500'} text-xs font-semibold uppercase tracking-wider`}>
                            Demo
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <a
                        href="https://github.com/BARDAMRI/tickup-charts/blob/main/documentation/README.md"
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                            theme === ChartTheme.dark
                                ? 'border-white/10 bg-black/30 text-slate-300 hover:border-[#3EC5FF]/45 hover:text-white'
                                : 'border-slate-200 bg-white/70 text-slate-700 hover:border-[#3EC5FF]/60 hover:text-slate-900'
                        }`}
                        title="Open documentation (GitHub)"
                    >
                        Docs
                    </a>
                    <button
                        type="button"
                        onClick={() => setPage((p) => (p === 'tiers' ? 'ticks' : 'tiers'))}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                            page === 'ticks'
                                ? 'border-[#3EC5FF]/60 bg-[#3EC5FF]/10 text-[#3EC5FF]'
                                : theme === ChartTheme.dark
                                    ? 'border-white/10 bg-black/30 text-slate-300 hover:border-white/20 hover:text-white'
                                    : 'border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                        }`}
                        aria-pressed={page === 'ticks'}
                        title={page === 'ticks' ? 'Back to tier showcase' : 'Open tick/axis demo page'}
                    >
                        {page === 'ticks' ? 'Back' : 'Tick demo'}
                    </button>
                    <div className={`flex items-center gap-3 rounded-full border p-1.5 pl-4 pr-1.5 shadow-xl ${
                    theme === ChartTheme.dark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-white/60'
                }`}>
                    <div className="flex items-center gap-2 pr-2">
                        <span className="relative flex h-3 w-3">
                            {!livePaused && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex h-3 w-3 rounded-full ${livePaused ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        </span>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${theme === ChartTheme.dark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {livePaused ? 'Live Paused' : 'Live Data API'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setLivePaused((p) => !p)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ${
                            livePaused 
                                ? (theme === ChartTheme.dark ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30') 
                                : (theme === ChartTheme.dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-slate-800 hover:bg-black/10')
                        }`}
                        title={livePaused ? "Resume Data" : "Pause Data"}
                    >
                        {livePaused ? <Play className="h-4 w-4" fill="currentColor" /> : <Pause className="h-4 w-4" fill="currentColor" />}
                    </button>
                    <button
                        type="button"
                        onClick={handleRefreshSeries}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ${
                            theme === ChartTheme.dark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-black/5 text-slate-500 hover:bg-black/10 hover:text-slate-900'
                        }`}
                        title="Reset Data"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setTheme((t) => t === ChartTheme.dark ? ChartTheme.light : ChartTheme.dark)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ${
                            theme === ChartTheme.dark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-black/5 text-amber-500 hover:bg-black/10 hover:text-amber-600'
                        }`}
                        title={theme === ChartTheme.dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === ChartTheme.dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    </div>
                </div>
            </header>

            {page === 'ticks' ? (
                <TickUpDemo />
            ) : (
                <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 p-6 lg:gap-16 lg:p-12 mb-20">
                <div className="text-center pt-8 pb-4">
                    <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl">
                        <span className={`text-transparent bg-clip-text bg-gradient-to-b ${theme === ChartTheme.dark ? 'from-white to-slate-400' : 'from-slate-800 to-slate-500'}`}>Next-Gen</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#3EC5FF] to-[#0A6B99] ml-4 drop-shadow-lg">Analysis</span>
                    </h1>
                    <p className={`mx-auto max-w-3xl text-lg mb-8 leading-relaxed ${theme === ChartTheme.dark ? 'text-slate-400' : 'text-slate-600'}`}>
                        TickUp is an ultra-fast, lightweight charting engine built for serious financial applications. 
                        With a remarkably tiny footprint, full developer support, and seamless turnkey integrations, it scales 
                        effortlessly from simple data embeds to immersive, WebGL-accelerated trading platforms. 
                        Give your users the institutional-grade technical analysis tools they deserve.
                    </p>
                    <div className={`flex flex-wrap items-center justify-center gap-4 text-xs lg:text-sm font-semibold uppercase tracking-wider ${theme === ChartTheme.dark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className={`flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm ${theme === ChartTheme.dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                            <span className="text-[#3EC5FF]">⚡</span> Ultra Lightweight
                        </span>
                        <span className={`flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm ${theme === ChartTheme.dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                            <span className="text-emerald-400">🛡️</span> Developer Native
                        </span>
                        <span className={`flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm ${theme === ChartTheme.dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                            <span className="text-[#5A48DE]">✨</span> WebGL Accelerated
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-16">
                    {TIER_ROWS.map(({key, title, blurb, Cmp, lux}) => (
                        <section 
                            key={key} 
                            className={`group relative overflow-hidden rounded-[2rem] border transition-all duration-500 ${
                                lux 
                                    ? (theme === ChartTheme.dark 
                                        ? 'border-[#3EC5FF]/30 bg-[#0c121e]/80 shadow-[0_0_80px_-20px_rgba(62,197,255,0.25)] hover:border-[#3EC5FF]/60 hover:shadow-[0_0_100px_-20px_rgba(62,197,255,0.4)]'
                                        : 'border-[#3EC5FF]/40 bg-white/90 shadow-[0_0_60px_-10px_rgba(62,197,255,0.15)] hover:border-[#3EC5FF]/70 hover:shadow-[0_0_80px_-10px_rgba(62,197,255,0.25)]')
                                    : (theme === ChartTheme.dark
                                        ? 'border-white/5 bg-white/[0.02] shadow-2xl hover:border-white/10'
                                        : 'border-slate-200 bg-white shadow-xl hover:border-slate-300')
                            }`}
                        >
                            <div className={`absolute inset-0 z-0 bg-gradient-to-b pointer-events-none ${theme === ChartTheme.dark ? 'from-white/[0.03] to-transparent' : 'from-slate-100 to-transparent'}`} />
                            
                            <div className={`relative z-10 flex flex-col gap-2 border-b p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8 ${theme === ChartTheme.dark ? 'border-white/5' : 'border-slate-100'}`}>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className={`text-2xl font-bold tracking-tight lg:text-3xl ${theme === ChartTheme.dark ? 'text-white' : 'text-slate-900'}`}>
                                            {title}
                                        </h2>
                                        {lux && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#5A48DE]/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-300 ring-1 ring-violet-400/30">
                                                <Zap className="h-3 w-3" fill="currentColor" /> Luxury
                                            </span>
                                        )}
                                    </div>
                                    <p className={`mt-2 text-sm lg:text-base ${theme === ChartTheme.dark ? 'text-slate-400' : 'text-slate-600'}`}>{blurb}</p>
                                </div>
                            </div>

                            <div className="relative z-10 p-2 sm:p-4 lg:p-6 pb-0 shadow-inner">
                                <div className={`relative w-full overflow-hidden rounded-xl border ${theme === ChartTheme.dark ? 'bg-black/50' : 'bg-slate-50'} ${
                                    lux 
                                        ? (theme === ChartTheme.dark ? 'h-[550px] border-[#3EC5FF]/20 shadow-[inset_0_0_40px_rgba(62,197,255,0.05)]' : 'h-[550px] border-[#3EC5FF]/30 shadow-[inset_0_0_20px_rgba(62,197,255,0.02)]') 
                                        : (theme === ChartTheme.dark ? 'h-[500px] border-white/10' : 'h-[500px] border-slate-200')
                                }`}>
                                    <Cmp ref={tierRefCallbacks[key]} {...sharedProps} />
                                </div>
                            </div>
                        </section>
                    ))}
                </div>
                </main>
            )}
        </div>
    );
}
