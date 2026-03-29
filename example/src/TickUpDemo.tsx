/**
 * Interactive **TickUp Charts** playground — real `TickUpHost` from `tickup/full` (`ref.setEngine`, live range nudge, `chartOptions`).
 * There is no `TickUpCore` class; embed `TickUpHost` / `TickUpStage` per the package docs.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Interval, TickUpChartEngine, TickUpHostHandle } from 'tickup/full';
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
    Moon,
    MousePointer2,
    Pencil,
    Sun,
    TrendingUp,
    Zap,
} from 'lucide-react';
import logoWordmarkLightSurfacesUrl from '@brand/logos/tickup-logo-full-light-transparent.png';
import logoWordmarkDarkSurfacesUrl from '@brand/logos/tickup-logo-full-dark-transparent.png';
import iconForLightPlotUrl from '@brand/icons/tickup-icon-transparent.png';
import iconForDarkPlotUrl from '@brand/icons/tickup-icon-dark-transparent.png';
import {
    advanceLiveSeries,
    buildMockIntervals,
    LIVE_TICK_MS,
    toHeikinAshi,
    type LiveTickCounter,
} from '../data-generator';

const DOCS_TREE_URL = 'https://github.com/BARDAMRI/tickup-charts/tree/main/documentation';

type ThemePreference = 'system' | 'light' | 'dark';

function usePrefersColorSchemeDark(): boolean {
    const [dark, setDark] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
    );
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => setDark(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return dark;
}

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

/** Standard **light** plot chrome for the demo (readable ticks on white / off-white). */
const demoStandardLightEngine: TickUpChartEngine = {
    id: 'demo-standard-light',
    getChartOptionsPatch: () => ({
        base: {
            engine: 'standard',
            theme: 'light',
            style: {
                backgroundColor: '#ffffff',
                showGrid: true,
                grid: {
                    lineColor: 'rgba(15, 23, 42, 0.09)',
                    lineWidth: 1,
                    gridSpacing: 56,
                    lineDash: [],
                    color: 'rgba(15, 23, 42, 0.09)',
                },
                axes: {
                    textColor: '#1e293b',
                    lineColor: 'rgba(15, 23, 42, 0.14)',
                    font: '12px Inter, system-ui, sans-serif',
                },
                candles: {
                    bullColor: '#059669',
                    bearColor: '#dc2626',
                    upColor: '#059669',
                    downColor: '#dc2626',
                    borderColor: 'rgba(15, 23, 42, 0.22)',
                    borderWidth: 1,
                    bodyWidthFactor: 0.62,
                    spacingFactor: 0.18,
                },
                histogram: {
                    bullColor: 'rgba(5, 150, 105, 0.45)',
                    bearColor: 'rgba(220, 38, 38, 0.45)',
                    opacity: 0.55,
                    heightRatio: 0.24,
                },
                bar: {
                    bullColor: '#059669',
                    bearColor: '#dc2626',
                    opacity: 0.88,
                },
                line: { color: '#2563eb', lineWidth: 2 },
                area: {
                    fillColor: 'rgba(37, 99, 235, 0.12)',
                    strokeColor: '#2563eb',
                    lineWidth: 2,
                },
            },
        },
    }),
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
                line: { color: '#60a5fa', lineWidth: 2 },
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

export default function TickUpDemo({ onOpenCompare }: TickUpDemoProps) {
    const chartRef = useRef<TickUpHostHandle | null>(null);
    /** Follow OS vs forced appearance; resolved into `shellTheme` below. */
    const [themePreference, setThemePreference] = useState<ThemePreference>('system');
    const systemPrefersDark = usePrefersColorSchemeDark();
    const shellTheme = useMemo<'light' | 'dark'>(() => {
        if (themePreference === 'system') {
            return systemPrefersDark ? 'dark' : 'light';
        }
        return themePreference;
    }, [themePreference, systemPrefersDark]);
    const [timeframe, setTimeframe] = useState<TimeframeKey>('5m');
    const [chartKind, setChartKind] = useState<ChartKind>('candle');
    const [primeMode, setPrimeMode] = useState(false);
    const [symbol, setSymbol] = useState('TICKUP');
    const [symbolDraft, setSymbolDraft] = useState('TICKUP');
    const [emaOn, setEmaOn] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<'cursor' | 'line' | 'ray' | 'fib' | 'pencil'>('cursor');
    const [liveTrading, setLiveTrading] = useState(true);
    const liveTickRef = useRef<LiveTickCounter>({ current: 0 });

    const barCount = primeMode ? 100_000 : 4_000;
    const intervalSec = TF_SECONDS[timeframe];
    const layoutResetKey = `${timeframe}-${primeMode}-${barCount}-${chartKind}`;
    const hostKey = layoutResetKey;
    const lastLayoutKeyRef = useRef<string | null>(null);

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
        liveTickRef.current = { current: 0 };
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
            return { start: 0, end: 1 };
        }
        const last = displayIntervals[displayIntervals.length - 1];
        return { start: displayIntervals[0].t, end: last.t + intervalSec };
    }, [displayIntervals, intervalSec]);

    const overlayKinds = useMemo(() => {
        type EmaOverlay = { kind: OverlayKind.ema; period: number };
        const list: EmaOverlay[] = [];
        if (emaOn) {
            list.push({ kind: OverlayKind.ema, period: 21 });
        }
        return list;
    }, [emaOn]);

    /**
     * Keep props in lockstep with {@link useLayoutEffect} `setEngine` so grid/candles/theme never disagree
     * (avoids light grid on dark plots when `chartOptions` merges before the engine patch applies).
     */
    const chartOptions = useMemo(() => {
        const primePatch = TickUpPrime.getChartOptionsPatch();
        const patch = primeMode
            ? {
                ...primePatch,
                base: {
                    ...primePatch.base,
                    // In light mode, override Prime's default dark colours so the
                    // toolbar chrome, grid, and axis text all read correctly.
                    theme: shellTheme,
                    style: {
                        ...primePatch.base?.style,
                        ...(shellTheme === 'light' ? {
                            backgroundColor: '#ffffff',
                            grid: {
                                lineColor: 'rgba(15, 23, 42, 0.09)',
                                lineWidth: 1,
                                gridSpacing: 56,
                                lineDash: [],
                                color: 'rgba(15, 23, 42, 0.09)',
                            },
                            axes: {
                                ...primePatch.base?.style?.axes,
                                textColor: '#1e293b',
                                lineColor: 'rgba(15, 23, 42, 0.14)',
                            },
                        } : {}),
                    },
                },
              }
            : (shellTheme === 'dark' ? demoStandardDarkEngine : demoStandardLightEngine).getChartOptionsPatch();
        const b = patch.base ?? {};
        const st = b.style ?? {};
        const ax = st.axes ?? {};
        return {
            base: {
                ...b,
                engine: primeMode ? ('prime' as const) : ('standard' as const),
                chartType: CHART_KIND_TO_TYPE[chartKind],
                showHistogram: true,
                showOverlayLine: overlayKinds.length > 0,
                overlayKinds,
                showCrosshair: true,
                showCrosshairValues: true,
                showCandleTooltip: true,
                style: {
                    ...st,
                    axes: {
                        ...ax,
                        timezone: 'UTC' as const,
                        locale: 'en-US',
                        language: 'en',
                    },
                },
            },
            axes: {
                yAxisPosition: AxesPosition.right,
                numberOfYTicks: 8,
            },
        };
    }, [overlayKinds, chartKind, shellTheme, primeMode]);

    useLayoutEffect(() => {
        let raf = 0;
        raf = requestAnimationFrame(() => {
            const r = chartRef.current;
            if (!r?.setEngine) {
                return;
            }
            if (primeMode) {
                r.setEngine(TickUpPrime);
            } else if (shellTheme === 'dark') {
                r.setEngine(demoStandardDarkEngine);
            } else {
                r.setEngine(demoStandardLightEngine);
            }
        });
        return () => cancelAnimationFrame(raf);
    }, [primeMode, hostKey, shellTheme]);

    /** Full fit when dataset / layout changes; gentle pan on live ticks only when the last bar leaves the window. */
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            const ref = chartRef.current;
            if (!ref) return;
            if (lastLayoutKeyRef.current !== layoutResetKey) {
                lastLayoutKeyRef.current = layoutResetKey;
                ref.fitVisibleRangeToData?.();
                return;
            }
            if (!liveTrading) return;
            ref.nudgeVisibleTimeRangeToLatest?.({
                trailingPaddingSec: Math.max(intervalSec * 2, 120),
            });
        });
        return () => cancelAnimationFrame(id);
    }, [baseIntervals, layoutResetKey, liveTrading, intervalSec]);

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

    const chartTypeButtons: { key: ChartKind; label: string; Icon: typeof CandlestickChart }[] = [
        { key: 'candle', label: 'Candle', Icon: CandlestickChart },
        { key: 'area', label: 'Area', Icon: AreaChart },
        { key: 'line', label: 'Line', Icon: LineChart },
        { key: 'heikin', label: 'Heikin', Icon: Flame },
    ];

    const isPageDark = shellTheme === 'dark';
    const panelGlass = isPageDark ? 'glass-panel' : 'glass-panel-light';
    // On a dark header background we need the LIGHT-coloured wordmark, and vice-versa.
    const headerLogoSrc = isPageDark ? logoWordmarkLightSurfacesUrl : logoWordmarkDarkSurfacesUrl;
    const chartDecorationIconSrc = isPageDark ? iconForDarkPlotUrl : iconForLightPlotUrl;
    const themeAfterQuickClick: 'light' | 'dark' = shellTheme === 'light' ? 'dark' : 'light';

    return (
        <div
            className={`min-h-screen overflow-y-auto font-sans ${isPageDark ? 'bg-[#0B0E14] text-[#E7EBFF]' : 'bg-[#f1f5f9] text-slate-800'
                }`}
            style={{ colorScheme: isPageDark ? 'dark' : 'light' }}
        >
            <header
                className={`sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b px-4 backdrop-blur-md md:px-6 ${isPageDark
                    ? 'border-white/10 bg-[#0B0E14]/92'
                    : 'border-slate-200/90 bg-[#f8fafc]/95'
                    }`}
            >
                <a href={DOCS_TREE_URL} className="flex min-w-0 items-center gap-2" target="_blank" rel="noreferrer">
                    <img
                        src={headerLogoSrc}
                        alt="TickUp Charts"
                        className="h-10 w-auto object-contain object-left md:h-12"
                    />
                </a>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <div
                        className={`flex rounded-lg border p-0.5 text-[10px] font-semibold uppercase tracking-wide ${isPageDark ? 'border-white/15 bg-black/30' : 'border-slate-300 bg-white/90'
                            }`}
                        role="group"
                        aria-label="Page and chart theme"
                    >
                        {(['system', 'light', 'dark'] as const).map((pref) => (
                            <button
                                key={pref}
                                type="button"
                                aria-pressed={themePreference === pref}
                                onClick={() => setThemePreference(pref)}
                                className={`rounded-md px-2 py-1 transition-colors ${themePreference === pref
                                    ? isPageDark
                                        ? 'bg-white/18 text-white shadow-sm'
                                        : 'bg-slate-200 text-slate-900 shadow-sm'
                                    : isPageDark
                                        ? 'text-slate-400 hover:text-slate-200'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {pref === 'system' ? 'System' : pref === 'light' ? 'Light' : 'Dark'}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        title={`After click: ${themeAfterQuickClick} theme`}
                        aria-label={`Switch to ${themeAfterQuickClick} theme`}
                        onClick={() => setThemePreference(themeAfterQuickClick)}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${isPageDark
                            ? 'border-white/15 text-slate-200 hover:border-[#3EC5FF]/40 hover:text-white'
                            : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900'
                            }`}
                    >
                        {shellTheme === 'light' ? (
                            <Sun className="h-4 w-4" aria-hidden />
                        ) : (
                            <Moon className="h-4 w-4" aria-hidden />
                        )}
                    </button>
                    <a
                        href={DOCS_TREE_URL}
                        target="_blank"
                        rel="noreferrer"
                        className={`hidden items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors sm:inline-flex ${isPageDark
                            ? 'border-white/10 text-slate-200 hover:border-[#3EC5FF]/45'
                            : 'border-slate-300 text-slate-700 hover:border-[#3EC5FF]/50'
                            }`}
                    >
                        <BookOpen className="h-3.5 w-3.5 text-[#3EC5FF]" />
                        Docs
                    </a>
                    <button
                        type="button"
                        onClick={() => setPrimeMode((p) => !p)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all md:text-xs ${primeMode
                            ? 'border-[#3EC5FF] bg-[#5A48DE] text-white'
                            : isPageDark
                                ? 'border-white/15 text-slate-300 hover:border-white/25'
                                : 'border-slate-300 text-slate-700 hover:border-slate-400'
                            }`}
                    >
                        <Zap className="h-3.5 w-3.5" fill={primeMode ? 'currentColor' : 'none'} />
                        Prime
                    </button>
                </div>
            </header>

            <section
                className={`mx-auto max-w-3xl space-y-4 border-b px-4 py-8 text-sm leading-relaxed md:px-8 md:text-[15px] md:leading-7 ${isPageDark
                    ? 'border-white/5 text-slate-400'
                    : 'border-slate-200 text-slate-600'
                    }`}
                aria-labelledby="tickup-playground-about"
            >
                <h1
                    id="tickup-playground-about"
                    className={`text-lg font-semibold tracking-tight md:text-xl ${isPageDark ? 'text-white' : 'text-slate-900'
                        }`}
                >
                    Canvas-built charts for serious market analysis
                </h1>
                <p>
                    <strong className={isPageDark ? 'font-medium text-slate-200' : 'font-medium text-slate-800'}>
                        TickUp Charts
                    </strong>{' '}
                    ships two entry points so you only pull what you need: the default{' '}
                    <code className={isPageDark ? 'text-slate-300' : 'rounded bg-slate-200/80 px-1 text-slate-800'}>
                        tickup
                    </code>{' '}
                    package for the stage, types, and live-data utilities, and{' '}
                    <code className={isPageDark ? 'text-slate-300' : 'rounded bg-slate-200/80 px-1 text-slate-800'}>
                        tickup/full
                    </code>{' '}
                    when you want Pulse, Flow, Command, Desk, drawing tools, settings, CSV/PNG export, and product-ready
                    chrome.
                </p>
                <p>
                    The renderer is{' '}
                    <strong className={isPageDark ? 'font-medium text-slate-200' : 'font-medium text-slate-800'}>
                        HTML5 Canvas 2D
                    </strong>{' '}
                    end-to-end for pan, zoom, and streaming OHLCV — with merge-by-time helpers so ticks update the forming
                    bar without rebuilding the series. Host props include{' '}
                    <code className={isPageDark ? 'text-slate-300' : 'rounded bg-slate-200/80 px-1 text-slate-800'}>
                        defaultThemeVariant
                    </code>{' '}
                    and{' '}
                    <code className={isPageDark ? 'text-slate-300' : 'rounded bg-slate-200/80 px-1 text-slate-800'}>
                        themeVariant
                    </code>{' '}
                    for initial and controlled shell light/dark, not only the in-app toolbar toggle.
                </p>
                <p>
                    Toggle <strong className={isPageDark ? 'font-medium text-slate-200' : 'font-medium text-slate-800'}>
                        Prime
                    </strong>{' '}
                    to compare the neon engine and glass toolbars. This page defaults to{' '}
                    <strong className={isPageDark ? 'font-medium text-slate-200' : 'font-medium text-slate-800'}>
                        light
                    </strong>{' '}
                    for crisp axes and symbol labels; use the sun/moon control for dark mode.
                </p>
            </section>

            <div
                className={`flex flex-col border-t lg:min-h-[min(88vh,56rem)] lg:flex-row ${isPageDark ? 'border-white/10' : 'border-slate-200'
                    }`}
            >
                <aside
                    className={`${panelGlass} flex w-full shrink-0 flex-row items-center justify-center gap-1 border-b py-2 lg:w-14 lg:flex-col lg:justify-start lg:border-b-0 lg:border-r lg:py-6 lg:pl-1 lg:pr-0 ${isPageDark ? 'border-white/10' : 'border-slate-200'
                        }`}
                >
                    <ToolRailBtn isDark={isPageDark} active={activeTool === 'pencil'} label="Trend line (pencil)" onClick={onToolPencil}>
                        <Pencil className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn isDark={isPageDark} active={activeTool === 'cursor'} label="Select" onClick={onToolCursor}>
                        <MousePointer2 className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn isDark={isPageDark} active={activeTool === 'line'} label="Trend line" onClick={onToolLine}>
                        <TrendingUp className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn isDark={isPageDark} active={activeTool === 'fib'} label="Fibonacci" onClick={onToolFib}>
                        <GitBranch className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn isDark={isPageDark} active={activeTool === 'ray'} label="Ray (line tool)" onClick={onToolRay}>
                        <Layers className="h-5 w-5" />
                    </ToolRailBtn>
                    <ToolRailBtn isDark={isPageDark} active={false} label="Eraser" onClick={onToolEraser}>
                        <Eraser className="h-5 w-5" />
                    </ToolRailBtn>
                </aside>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <div
                        className={`flex flex-col gap-2 border-b px-3 py-2 sm:flex-row sm:items-center sm:justify-between md:px-4 ${isPageDark ? 'border-white/10' : 'border-slate-200'
                            }`}
                    >
                        <div
                            className={`flex flex-wrap gap-1 rounded-lg border p-1 ${isPageDark
                                ? 'border-white/10 bg-white/[0.03]'
                                : 'border-slate-200 bg-white/80'
                                }`}
                        >
                            {chartTypeButtons.map(({ key, label, Icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setChartKind(key)}
                                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold capitalize md:px-3 md:text-xs ${chartKind === key
                                        ? 'bg-[#3EC5FF] text-black'
                                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon className="h-3.5 w-3.5 opacity-80" />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <nav className="flex flex-wrap gap-1" aria-label="Timeframe">
                            {(Object.keys(TF_SECONDS) as TimeframeKey[]).map((tf) => (
                                <button
                                    key={tf}
                                    type="button"
                                    onClick={() => setTimeframe(tf)}
                                    className={`rounded-md px-2 py-1 font-mono text-[10px] font-medium md:text-xs ${timeframe === tf
                                        ? 'bg-[#5A48DE]/40 text-violet-200 ring-1 ring-[#3EC5FF]/35'
                                        : 'text-slate-500 hover:bg-white/10 hover:text-slate-300'
                                        }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                        <main className="relative min-h-[min(70vh,40rem)] w-full min-w-0 flex-1 p-2 md:min-h-[min(75vh,44rem)] md:p-3">
                            <div
                                className={`relative h-[min(75vh,48rem)] min-h-[22rem] w-full overflow-hidden rounded-xl border ${isPageDark
                                    ? 'border-white/10 bg-[#06080d]'
                                    : 'border-slate-200 bg-white'
                                    }`}
                            >
                                <TickUpHost
                                    key={hostKey}
                                    ref={chartRef}
                                    themeVariant={shellTheme}
                                    onThemeVariantChange={setThemePreference}
                                    intervalsArray={displayIntervals}
                                    chartOptions={chartOptions}
                                    showSidebar={false}
                                    showTopBar={false}
                                    showSettingsBar
                                    showAttribution={false}
                                    symbol={symbol}
                                    onSymbolChange={setSymbol}
                                    initialTimeDetailLevel={TimeDetailLevel.Medium}
                                    initialNumberOfYTicks={8}
                                    initialVisibleTimeRange={initialVisibleTimeRange}
                                />
                                <img
                                    src={chartDecorationIconSrc}
                                    alt=""
                                    className={`pointer-events-none absolute bottom-3 right-3 z-10 h-16 w-auto object-contain md:h-20 ${isPageDark ? 'opacity-[0.36]' : 'opacity-[0.22]'
                                        }`}
                                    aria-hidden
                                />
                            </div>

                            <div className="pointer-events-none absolute bottom-5 left-4 z-20 md:bottom-6 md:left-5">
                                <ChartHud isDark={isPageDark} primeMode={primeMode} barCount={displayIntervals.length} />
                            </div>
                        </main>

                        <aside
                            className={`${panelGlass} w-full shrink-0 border-t p-4 lg:w-[280px] lg:border-l lg:border-t-0 ${isPageDark ? 'border-white/10' : 'border-slate-200'
                                }`}
                        >
                            <h2 className={`mb-3 text-sm font-semibold ${isPageDark ? 'text-white' : 'text-slate-900'}`}>
                                Market data
                            </h2>
                            <div
                                className={`mb-4 flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${isPageDark
                                    ? 'border-white/10 bg-black/20'
                                    : 'border-slate-200 bg-white/90'
                                    }`}
                            >
                                <span className={`text-xs ${isPageDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Live trading
                                </span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={liveTrading}
                                    onClick={() => setLiveTrading((v) => !v)}
                                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${liveTrading ? 'bg-[#34d399]/40' : 'bg-white/10'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${liveTrading ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                            <label
                                className={`mb-4 block text-xs ${isPageDark ? 'text-slate-400' : 'text-slate-600'}`}
                            >
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
                                        className={`w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none ring-[#3EC5FF]/40 focus:ring-2 ${isPageDark
                                            ? 'border-white/10 bg-black/30 text-white'
                                            : 'border-slate-300 bg-white text-slate-900'
                                            }`}
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

                            <h3
                                className={`mb-2 text-xs font-semibold uppercase tracking-wider ${isPageDark ? 'text-slate-500' : 'text-slate-500'
                                    }`}
                            >
                                Indicators
                            </h3>
                            <ul className="space-y-2">
                                <IndicatorRow
                                    isDark={isPageDark}
                                    label="EMA (21)"
                                    active={emaOn}
                                    onAdd={() => setEmaOn(true)}
                                    onRemove={() => setEmaOn(false)}
                                    supported
                                />
                                <IndicatorRow
                                    isDark={isPageDark}
                                    label="RSI"
                                    active={false}
                                    onAdd={() => undefined}
                                    onRemove={() => undefined}
                                    supported={false}
                                />
                                <IndicatorRow
                                    isDark={isPageDark}
                                    label="MACD"
                                    active={false}
                                    onAdd={() => undefined}
                                    onRemove={() => undefined}
                                    supported={false}
                                />
                                <IndicatorRow
                                    isDark={isPageDark}
                                    label="Volume Profile"
                                    active={false}
                                    onAdd={() => undefined}
                                    onRemove={() => undefined}
                                    supported={false}
                                />
                            </ul>

                            <div
                                className={`mt-6 border-t pt-4 text-xs ${isPageDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-600'
                                    }`}
                            >
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

/** HUD updates FPS in isolation so live OHLC ticks do not re-render this counter via the parent. */
function ChartHud({ isDark, primeMode, barCount }: { isDark: boolean; primeMode: boolean; barCount: number }) {
    const [fps, setFps] = useState(60);
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
    return (
        <div
            className={`pointer-events-auto rounded-xl border px-3 py-2 font-mono text-[11px] leading-relaxed md:text-xs ${isDark
                ? 'glass-panel border-white/10 text-[#E7EBFF]'
                : 'glass-panel-light border-slate-200 text-slate-800'
                }`}
        >
            <div>
                <span className="text-slate-500">FPS </span>
                <span className="text-[#3EC5FF]">{fps}</span>
            </div>
            <div>
                <span className="text-slate-500">Engine </span>
                <span className="text-[#5A48DE]">{primeMode ? 'Prime' : 'Standard'}</span>
            </div>
            <div>
                <span className="text-slate-500">Bars </span>
                <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>
                    {barCount.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

function ToolRailBtn({
    children,
    active,
    label,
    onClick,
    isDark = true,
}: {
    children: ReactNode;
    active: boolean;
    label: string;
    onClick: () => void;
    isDark?: boolean;
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 ${active
                ? 'border-[#3EC5FF]/50 bg-[#3EC5FF]/15 text-[#3EC5FF]'
                : isDark
                    ? 'border-transparent text-gray-500 hover:border-white/10 hover:text-[#3EC5FF]'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-[#3EC5FF]'
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
    isDark = true,
}: {
    label: string;
    active: boolean;
    supported: boolean;
    onAdd: () => void;
    onRemove: () => void;
    isDark?: boolean;
}) {
    return (
        <li
            className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${isDark ? 'border-white/5 bg-black/20' : 'border-slate-200 bg-white/80'
                }`}
        >
            <span className={`font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
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
                        className={`rounded-md border px-2 py-1 text-[11px] disabled:opacity-40 ${isDark
                            ? 'border-white/10 text-slate-300 enabled:hover:bg-white/10'
                            : 'border-slate-300 text-slate-700 enabled:hover:bg-slate-100'
                            }`}
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={!active}
                        className={`rounded-md border px-2 py-1 text-[11px] disabled:opacity-40 ${isDark
                            ? 'border-white/10 text-slate-300 enabled:hover:bg-red-500/20 enabled:hover:text-red-200'
                            : 'border-slate-300 text-slate-700 enabled:hover:bg-red-50 enabled:hover:text-red-700'
                            }`}
                    >
                        Remove
                    </button>
                </div>
            )}
        </li>
    );
}
