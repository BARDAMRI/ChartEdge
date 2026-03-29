/**
 * Interactive **tickup Charts** showcase — uses the real library API (`TickUpHost`, `ref.setEngine`, `chartOptions`).
 * There is no `TickUpCore` class; hosts embed `TickUpHost` / `TickUpStage` from `tickup/full`.
 */
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import type {Interval, TickUpChartEngine, TickUpHostHandle} from 'tickup/full';
import {
    AxesPosition,
    ChartType,
    Mode,
    OverlayKind,
    TickUpHost,
    TickUpPrime,
    TimeDetailLevel,
} from 'tickup/full';
import {
    AreaChart,
    BookOpen,
    CandlestickChart,
    Eraser,
    Flame,
    GitBranch,
    Layers,
    LineChart,
    MousePointer2,
    Pencil,
    TrendingUp,
    Zap,
} from 'lucide-react';
import logoDarkUrl from '@brand/logos/tickup-logo-full-dark.png';
import logoGradientUrl from '@brand/logos/tickup-logo-full-brand-gradient.png';
import iconTransparentUrl from '@brand/icons/tickup-icon-transparent.png';
import {
    advanceLiveSeries,
    buildMockIntervals,
    LIVE_TICK_MS,
    toHeikinAshi,
    type LiveTickCounter,
} from '../data-generator';

const DOCS_TREE_URL = 'https://github.com/BARDAMRI/tickup-charts/tree/main/documentation';
const REPO_DOCS_URL = 'https://github.com/BARDAMRI/tickup-charts/tree/main/docs';

type TimeframeKey = '1m' | '5m' | '15m' | '1h' | '1D' | '1W';
type ChartKind = 'candle' | 'area' | 'line' | 'heikin';

const TF_SECONDS: Record<TimeframeKey, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '1D': 86400,
    '1W': 604800,
};

const CHART_KIND_TO_TYPE: Record<ChartKind, ChartType> = {
    candle: ChartType.Candlestick,
    area: ChartType.Area,
    line: ChartType.Line,
    /** Heikin-Ashi values are OHLC candles; native type is still candlestick. */
    heikin: ChartType.Candlestick,
};

/** Standard dark “core” look for the demo (not {@link TickUpStandardEngine}, which resets to light defaults). */
const demoStandardDarkEngine: TickUpChartEngine = {
    id: 'demo-standard-dark',
    getChartOptionsPatch: () => ({
        base: {
            engine: 'standard',
            theme: 'dark',
            style: {
                backgroundColor: '#0b0e14',
                showGrid: true,
                grid: {
                    lineColor: 'rgba(255,255,255,0.07)',
                    lineWidth: 1,
                    gridSpacing: 56,
                    lineDash: [],
                    color: 'rgba(255,255,255,0.07)',
                },
                axes: {
                    textColor: '#9ca3af',
                    lineColor: 'rgba(255,255,255,0.12)',
                    font: '12px Inter, system-ui, sans-serif',
                },
                candles: {
                    bullColor: '#34d399',
                    bearColor: '#f87171',
                    upColor: '#34d399',
                    downColor: '#f87171',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    bodyWidthFactor: 0.62,
                    spacingFactor: 0.18,
                },
                histogram: {
                    bullColor: 'rgba(52, 211, 153, 0.5)',
                    bearColor: 'rgba(248, 113, 113, 0.5)',
                    opacity: 0.5,
                    heightRatio: 0.24,
                },
                bar: {
                    bullColor: '#34d399',
                    bearColor: '#f87171',
                    opacity: 0.85,
                },
                line: {color: '#60a5fa', lineWidth: 2},
                area: {
                    fillColor: 'rgba(96, 165, 250, 0.15)',
                    strokeColor: '#60a5fa',
                    lineWidth: 2,
                },
            },
        },
    }),
};

type TickUpDemoProps = {
    onOpenCompare?: () => void;
};

export default function TickUpDemo({onOpenCompare}: TickUpDemoProps) {
    const chartRef = useRef<TickUpHostHandle | null>(null);
    const [timeframe, setTimeframe] = useState<TimeframeKey>('5m');
    const [chartKind, setChartKind] = useState<ChartKind>('candle');
    const [primeMode, setPrimeMode] = useState(false);
    const [symbol, setSymbol] = useState('TICKUP');
    const [symbolDraft, setSymbolDraft] = useState('TICKUP');
    const [emaOn, setEmaOn] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [fps, setFps] = useState(60);
    const [activeTool, setActiveTool] = useState<'cursor' | 'line' | 'ray' | 'fib' | 'pencil'>('cursor');
    const [liveTrading, setLiveTrading] = useState(true);
    const liveTickRef = useRef<LiveTickCounter>({current: 0});

    const barCount = primeMode ? 100_000 : 4_000;
    const intervalSec = TF_SECONDS[timeframe];
    const hostKey = `${timeframe}-${primeMode}-${barCount}-${chartKind}`;

    const [baseIntervals, setBaseIntervals] = useState<Interval[]>(() =>
        buildMockIntervals({
            startTime: 1_700_000_000,
            startPrice: 128.5,
            intervalSec: TF_SECONDS['5m'],
            count: 4_000,
            seed: (TF_SECONDS['5m'] % 997) * 17 + 4_000,
            driftPerBar: 0.015,
            vol: 0.5,
        })
    );

    useEffect(() => {
        liveTickRef.current = {current: 0};
        setBaseIntervals(
            buildMockIntervals({
                startTime: 1_700_000_000,
                startPrice: 128.5,
                intervalSec,
                count: barCount,
                seed: (intervalSec % 997) * 17 + barCount,
                driftPerBar: 0.015,
                vol: primeMode ? 0.35 : 0.5,
            })
        );
    }, [intervalSec, barCount, primeMode]);

    useEffect(() => {
        if (!liveTrading) {
            return;
        }
        const id = window.setInterval(() => {
            setBaseIntervals((prev) => advanceLiveSeries(prev, intervalSec, liveTickRef.current));
        }, LIVE_TICK_MS);
        return () => window.clearInterval(id);
    }, [liveTrading, intervalSec]);

    const displayIntervals = useMemo(
        () => (chartKind === 'heikin' ? toHeikinAshi(baseIntervals) : baseIntervals),
        [baseIntervals, chartKind]
    );

    const initialVisibleTimeRange = useMemo(() => {
        if (!displayIntervals.length) {
            return {start: 0, end: 1};
        }
        const last = displayIntervals[displayIntervals.length - 1];
        return {start: displayIntervals[0].t, end: last.t + intervalSec};
    }, [displayIntervals, intervalSec]);

    const overlayKinds = useMemo(() => {
        type EmaOverlay = {kind: OverlayKind.ema; period: number};
        const list: EmaOverlay[] = [];
        if (emaOn) {
            list.push({kind: OverlayKind.ema, period: 21});
        }
        return list;
    }, [emaOn]);

    const chartOptions = useMemo(
        () => ({
            base: {
                engine: 'standard' as const,
                theme: 'dark' as const,
                chartType: CHART_KIND_TO_TYPE[chartKind],
                showHistogram: true,
                showOverlayLine: overlayKinds.length > 0,
                overlayKinds,
                showCrosshair: true,
                showCrosshairValues: true,
                showCandleTooltip: true,
                style: {
                    backgroundColor: '#0b0e14',
                    showGrid: true,
                    axes: {
                        timezone: 'UTC',
                        locale: 'en-US',
                        language: 'en',
                    },
                },
            },
            axes: {
                yAxisPosition: AxesPosition.right,
                numberOfYTicks: 8,
            },
        }),
        [overlayKinds, chartKind]
    );

    useLayoutEffect(() => {
        let raf = 0;
        raf = requestAnimationFrame(() => {
            const r = chartRef.current;
            if (!r?.setEngine) {
                return;
            }
            if (primeMode) {
                r.setEngine(TickUpPrime);
            } else {
                r.setEngine(demoStandardDarkEngine);
            }
        });
        return () => cancelAnimationFrame(raf);
    }, [primeMode, hostKey]);

    useEffect(() => {
        const id = window.setTimeout(() => {
            chartRef.current?.fitVisibleRangeToData?.();
        }, 80);
        return () => window.clearTimeout(id);
    }, [displayIntervals, timeframe, primeMode, chartKind]);

    useEffect(() => {
        let frames = 0;
        let last = performance.now();
        let raf = 0;

        const loop = (now: number) => {
            frames += 1;
            const dt = now - last;
            if (dt >= 500) {
                setFps(Math.round((frames * 1000) / dt));
                frames = 0;
                last = now;
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);

    const showFibComingSoon = useCallback(() => {
        setToast('Fibonacci retracement is on the Pro roadmap — see documentation/15.');
        window.setTimeout(() => setToast(null), 4200);
    }, []);

    const setModeSafe = useCallback((mode: Mode) => {
        chartRef.current?.setInteractionMode?.(mode);
    }, []);

    const onToolPencil = () => {
        setActiveTool('pencil');
        setModeSafe(Mode.drawLine);
    };

    const onToolCursor = () => {
        setActiveTool('cursor');
        setModeSafe(Mode.select);
    };

    const onToolLine = () => {
        setActiveTool('line');
        setModeSafe(Mode.drawLine);
    };

    const onToolRay = () => {
        setActiveTool('ray');
        setModeSafe(Mode.drawLine);
    };

    const onToolFib = () => {
        setActiveTool('fib');
        showFibComingSoon();
        setModeSafe(Mode.none);
    };

    const onToolEraser = () => {
        chartRef.current?.deleteSelectedDrawing?.();
        setToast('Eraser: removes the selected drawing (select a shape first).');
        window.setTimeout(() => setToast(null), 2800);
    };

    const chartTypeButtons: {key: ChartKind; label: string; Icon: typeof CandlestickChart}[] = [
        {key: 'candle', label: 'Candle', Icon: CandlestickChart},
        {key: 'area', label: 'Area', Icon: AreaChart},
        {key: 'line', label: 'Line', Icon: LineChart},
        {key: 'heikin', label: 'Heikin', Icon: Flame},
    ];

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#0B0E14] font-sans text-[#E7EBFF]">
            <div className="flex min-h-0 flex-1 flex-row">
                <aside className="glass-panel flex w-16 shrink-0 flex-col items-center gap-3 border-r border-white/10 py-6">
                    <ToolRailBtn
                        active={activeTool === 'pencil'}
                        label="Trend line (pencil)"
                        onClick={onToolPencil}
                    >
                        <Pencil className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn
                        active={activeTool === 'cursor'}
                        label="Select"
                        onClick={onToolCursor}
                    >
                        <MousePointer2 className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn active={activeTool === 'line'} label="Trend line" onClick={onToolLine}>
                        <TrendingUp className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn active={activeTool === 'fib'} label="Fibonacci" onClick={onToolFib}>
                        <GitBranch className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn active={activeTool === 'ray'} label="Ray (line tool)" onClick={onToolRay}>
                        <Layers className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn active={false} label="Eraser" onClick={onToolEraser}>
                        <Eraser className="h-5 w-5" />
                    </ToolRailBtn>
                </aside>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <header className="glass-panel flex h-auto min-h-[5rem] shrink-0 flex-col gap-3 border-b border-white/10 px-4 py-3 md:h-20 md:flex-row md:items-center md:justify-between md:px-8">
                        <div className="flex flex-wrap items-center gap-3">
                            <img
                                src={logoDarkUrl}
                                alt="TickUp Charts"
                                className="h-8 w-auto max-h-10 object-contain md:h-10"
                            />
                            <img
                                src={logoGradientUrl}
                                alt=""
                                className="h-7 w-auto object-contain opacity-95 md:h-8"
                                title="TickUp wordmark (light)"
                            />
                            <div className="flex items-baseline">
                                <span className="text-2xl font-black italic tracking-tight text-white">
                                    tickup
                                </span>
                                <span className="ml-1 text-2xl font-light not-italic text-[#3EC5FF]">CHARTS</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-stretch gap-2 md:items-center">
                            <div className="flex flex-wrap justify-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                                {chartTypeButtons.map(({key, label, Icon}) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setChartKind(key)}
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all duration-300 md:px-4 ${
                                            chartKind === key
                                                ? 'bg-[#3EC5FF] text-black shadow-[0_0_12px_rgba(62,197,255,0.35)]'
                                                : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5 opacity-80" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <nav className="flex flex-wrap justify-center gap-1" aria-label="Timeframe">
                                {(Object.keys(TF_SECONDS) as TimeframeKey[]).map((tf) => (
                                    <button
                                        key={tf}
                                        type="button"
                                        onClick={() => setTimeframe(tf)}
                                        className={`rounded-lg px-2 py-1 font-mono text-[10px] font-medium transition-all duration-300 md:text-xs ${
                                            timeframe === tf
                                                ? 'bg-[#5A48DE]/40 text-violet-200 ring-1 ring-[#3EC5FF]/40'
                                                : 'text-slate-500 hover:bg-white/10 hover:text-slate-300'
                                        }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <a
                                href={DOCS_TREE_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="glass-panel hidden items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#E7EBFF] transition-all duration-300 hover:border-[#3EC5FF]/40 sm:inline-flex"
                            >
                                <BookOpen className="h-4 w-4 text-[#3EC5FF]" />
                                Docs
                            </a>
                            <a
                                href={REPO_DOCS_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="glass-panel inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#E7EBFF] sm:hidden"
                            >
                                <BookOpen className="h-4 w-4" />
                                Docs
                            </a>

                            <button
                                type="button"
                                onClick={() => setPrimeMode((p) => !p)}
                                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 ${
                                    primeMode
                                        ? 'border-[#3EC5FF] bg-[#5A48DE] text-white shadow-[0_0_15px_rgba(90,72,222,0.5)]'
                                        : 'glass-panel border-white/10 text-gray-300 hover:border-white/20'
                                }`}
                            >
                                <Zap className="h-3.5 w-3.5" fill={primeMode ? 'currentColor' : 'none'} />
                                {primeMode ? 'PRIME ACTIVE' : 'GO PRIME'}
                            </button>
                        </div>
                    </header>

                    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                        <main className="relative min-h-[50vh] min-w-0 flex-1 p-2 md:p-3 lg:min-h-0">
                            <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                                <TickUpHost
                                    key={hostKey}
                                    ref={chartRef}
                                    intervalsArray={displayIntervals}
                                    chartOptions={chartOptions}
                                    showSidebar={false}
                                    showTopBar={false}
                                    showSettingsBar={false}
                                    showAttribution={false}
                                    symbol={symbol}
                                    onSymbolChange={setSymbol}
                                    initialTimeDetailLevel={TimeDetailLevel.Medium}
                                    initialNumberOfYTicks={8}
                                    initialVisibleTimeRange={initialVisibleTimeRange}
                                />
                                <img
                                    src={iconTransparentUrl}
                                    alt=""
                                    className="pointer-events-none absolute bottom-4 right-4 z-10 w-24 opacity-[0.15] md:w-28"
                                    aria-hidden
                                />
                            </div>

                            <div className="pointer-events-none absolute bottom-6 left-6 z-20 font-mono text-[11px] leading-relaxed md:bottom-8 md:left-8 md:text-xs">
                                <div className="glass-panel pointer-events-auto rounded-xl border border-white/10 px-3 py-2 text-[#E7EBFF]">
                                    <div>
                                        <span className="text-slate-500">FPS </span>
                                        <span className="text-[#3EC5FF]">{fps}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Engine </span>
                                        <span className="text-[#5A48DE]">
                                            {primeMode ? 'Prime' : 'Standard'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Data points </span>
                                        <span className="text-emerald-300">
                                            {displayIntervals.length.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </main>

                        <aside className="glass-panel w-full shrink-0 border-t border-white/10 p-4 lg:w-[280px] lg:border-l lg:border-t-0">
                            <h2 className="mb-3 text-sm font-semibold text-white">Market data</h2>
                            <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                                <span className="text-xs text-slate-400">Live trading</span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={liveTrading}
                                    onClick={() => setLiveTrading((v) => !v)}
                                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                                        liveTrading ? 'bg-[#34d399]/40' : 'bg-white/10'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                                            liveTrading ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                            <label className="mb-4 block text-xs text-slate-400">
                                Symbol
                                <div className="mt-1 flex gap-2">
                                    <input
                                        value={symbolDraft}
                                        onChange={(e) => setSymbolDraft(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setSymbol(symbolDraft.trim() || 'TICKUP');
                                            }
                                        }}
                                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none ring-[#3EC5FF]/40 focus:ring-2"
                                        placeholder="TICKUP"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSymbol(symbolDraft.trim() || 'TICKUP')}
                                        className="shrink-0 rounded-lg border border-[#3EC5FF]/40 bg-[#3EC5FF]/10 px-3 py-2 text-sm font-medium text-[#3EC5FF] hover:bg-[#3EC5FF]/20"
                                    >
                                        Go
                                    </button>
                                </div>
                            </label>

                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Indicators
                            </h3>
                            <ul className="space-y-2">
                                <IndicatorRow
                                    label="EMA (21)"
                                    active={emaOn}
                                    onAdd={() => setEmaOn(true)}
                                    onRemove={() => setEmaOn(false)}
                                    supported
                                />
                                <IndicatorRow
                                    label="RSI"
                                    active={false}
                                    onAdd={() => undefined}
                                    onRemove={() => undefined}
                                    supported={false}
                                />
                                <IndicatorRow
                                    label="MACD"
                                    active={false}
                                    onAdd={() => undefined}
                                    onRemove={() => undefined}
                                    supported={false}
                                />
                                <IndicatorRow
                                    label="Volume Profile"
                                    active={false}
                                    onAdd={() => undefined}
                                    onRemove={() => undefined}
                                    supported={false}
                                />
                            </ul>

                            <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">
                                <p className="mb-2 font-mono text-[10px] leading-relaxed">
                                    Data: <code className="text-slate-400">../data-generator.ts</code> ·{' '}
                                    {liveTrading ? (
                                        <>
                                            Live <code className="text-slate-400">{LIVE_TICK_MS}ms</code> ticks
                                        </>
                                    ) : (
                                        'Live paused'
                                    )}
                                    · Prime stress path uses {barCount.toLocaleString()} bars.
                                </p>
                                {onOpenCompare ? (
                                    <button
                                        type="button"
                                        onClick={onOpenCompare}
                                        className="text-[#3EC5FF] underline-offset-2 hover:underline"
                                    >
                                        API comparison lab (all tiers)
                                    </button>
                                ) : null}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {toast ? (
                <div className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 text-center text-sm text-slate-100 shadow-2xl backdrop-blur-xl">
                    {toast}
                </div>
            ) : null}
        </div>
    );
}

function ToolRailBtn({
    children,
    active,
    label,
    onClick,
}: {
    children: ReactNode;
    active: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 ${
                active
                    ? 'border-[#3EC5FF]/50 bg-[#3EC5FF]/15 text-[#3EC5FF]'
                    : 'border-transparent text-gray-500 hover:border-white/10 hover:text-[#3EC5FF]'
            }`}
        >
            {children}
        </button>
    );
}

function IndicatorRow({
    label,
    active,
    supported,
    onAdd,
    onRemove,
}: {
    label: string;
    active: boolean;
    supported: boolean;
    onAdd: () => void;
    onRemove: () => void;
}) {
    return (
        <li className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
            <span className="font-mono text-xs text-slate-300">{label}</span>
            {!supported ? (
                <span className="rounded-md bg-[#5A48DE]/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-300">
                    Planned
                </span>
            ) : (
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={onAdd}
                        disabled={active}
                        className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 enabled:hover:bg-white/10 disabled:opacity-40"
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={!active}
                        className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 enabled:hover:bg-red-500/20 enabled:hover:text-red-200 disabled:opacity-40"
                    >
                        Remove
                    </button>
                </div>
            )}
        </li>
    );
}
