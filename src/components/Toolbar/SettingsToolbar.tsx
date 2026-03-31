import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    SettingsToolbarContainer, SettingToolbarContent, Spacer,
    SymbolInput,
    SymbolToolbarCluster,
    IntervalToolbarCluster
} from '../../styles/SettingsToolbar.styles';

import { Button } from './Buttons';
import {
    IconCamera,
    IconDownload,
    IconGear,
    IconRange,
    IconRefresh,
    IconSearch,
    IconSun,
    IconTheme,
} from './icons';
import { ChartType } from "../../types/chartOptions";
import { ChartTheme } from '../../types/types';
import { Placement, TooltipAlign, TooltipAxis } from "../../types/buttons";
import { Tooltip } from "../Tooltip";
import { ChartTypeSelectDropdown } from "./ChartTypeSelectDropdown";
import { translate, getLocaleDefaults } from '../../utils/i18n';
import { captureChartRegionToPngDataUrl } from '../../utils/captureChartRegion';
import { IntervalSelect } from './IntervalSelect';
import { AlertModal } from '../Common/AlertModal';

/* Minimum toolbar width (px) below which the gear/settings icon is hidden */
const MIN_WIDTH_FOR_SETTINGS_ICON = 260;

function isSymbolSearchSuccess(v: void | boolean | undefined): boolean {
    return v !== false;
}

function isThenable(v: unknown): v is Promise<unknown> {
    return v != null && typeof (v as Promise<unknown>).then === 'function';
}

interface SettingToolbarProps {
    handleChartTypeChange: (type: ChartType) => void;
    selectedChartType?: ChartType;
    openSettingsMenu: () => void;
    /** When false the entire toolbar renders nothing */
    showSettingsBar?: boolean;
    language?: string;
    locale?: string;
    symbolInputRef?: React.RefObject<HTMLInputElement | null>;
    /** Controlled symbol text (optional). */
    symbol?: string;
    /** Initial symbol when uncontrolled. */
    defaultSymbol?: string;
    /** Fired when the symbol field changes. */
    onSymbolChange?: (symbol: string) => void;
    /**
     * When set, the search control and Enter in the symbol field call this with the trimmed symbol.
     * When unset, search focuses/selects the symbol field only.
     * Return **`false`** or a **rejected Promise** if the lookup failed — the field reverts to the last
     * successfully displayed symbol and `onSymbolChange` is called with that value so controlled hosts stay in sync.
     * Return **`true`** or **`undefined`** (void) for success.
     */
    onSymbolSearch?: (symbol: string) => void | boolean | Promise<void | boolean>;
    /** Optional extra handler when search is activated (e.g. focus-only); ignored if `onSymbolSearch` is set. */
    onSearch?: () => void;
    /** Fit the time axis to all loaded bars. */
    onFitVisibleRange?: () => void;
    /** Download OHLCV as CSV. */
    onExportDataCsv?: () => void;
    /** Raster snapshot of the main price canvas. */
    onSnapshotPng?: () => void;
    onRefresh?: () => void | Promise<void>;
    onToggleTheme?: () => void;
    /** shell light/dark (and grey) — drives sun vs moon on the theme control. */
    themeVariant?: ChartTheme;
    /** Current selected interval tag (e.g. '5m') */
    interval?: string;
    /** Fired when user selects a new interval. */
    onIntervalChange?: (interval: string) => void;
    /** Optional 'search' handler to replace data feed on interval change. */
    onIntervalSearch?: (tf: string) => void | boolean | Promise<void | boolean>;
    /** Prime engine: glass-style toolbar surface */
    primeGlass?: boolean;
    primeGlassLight?: boolean;
}

const DEFAULT_INTERVALS = ['1m', '5m', '15m', '1h', '1D', '1W'];

export const SettingsToolbar = ({
    handleChartTypeChange,
    selectedChartType,
    openSettingsMenu,
    showSettingsBar = true,
    language = 'en',
    locale = 'en-US',
    symbolInputRef,
    symbol,
    defaultSymbol,
    onSymbolChange,
    onSymbolSearch,
    onSearch,
    onFitVisibleRange,
    onExportDataCsv,
    onSnapshotPng,
    onRefresh,
    onToggleTheme,
    themeVariant = ChartTheme.light,
    interval = '5m',
    onIntervalChange,
    onIntervalSearch,
    primeGlass = false,
    primeGlassLight = false,
}: SettingToolbarProps) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const [toolbarWidth, setToolbarWidth] = useState<number>(Infinity);
    const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: ''
    });

    const showAlert = (title: string, message: string) => {
        setAlert({ isOpen: true, title, message });
    };

    const closeAlert = () => setAlert(prev => ({ ...prev, isOpen: false }));

    const symbolFieldFocusedRef = useRef(false);
    const committedSymbolRef = useRef(
        symbol !== undefined ? String(symbol ?? '') : String(defaultSymbol ?? '')
    );
    const [fieldValue, setFieldValue] = useState(() =>
        symbol !== undefined ? String(symbol ?? '') : String(defaultSymbol ?? '')
    );

    const direction = getLocaleDefaults(locale).direction;

    const isControlled = symbol !== undefined;

    useEffect(() => {
        if (symbolFieldFocusedRef.current) {
            return;
        }
        if (isControlled) {
            const s = String(symbol ?? '');
            setFieldValue(s);
            committedSymbolRef.current = s;
        } else {
            const s = String(defaultSymbol ?? '');
            setFieldValue(s);
            committedSymbolRef.current = s;
        }
    }, [symbol, defaultSymbol, isControlled]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect?.width ?? Infinity;
            setToolbarWidth(w);
        });
        ro.observe(el);

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener('wheel', handleWheel, { passive: true });

        // Fire once immediately
        setToolbarWidth(el.getBoundingClientRect().width);
        return () => {
            ro.disconnect();
            el.removeEventListener('wheel', handleWheel);
        };
    }, []);

    if (!showSettingsBar) return null;

    const showGear = toolbarWidth > MIN_WIDTH_FOR_SETTINGS_ICON;

    const handleSnapshot = () => {
        if (onSnapshotPng) {
            onSnapshotPng();
            return;
        }
        const root = document.querySelector('.tickup-chart-snapshot-root');
        const bg =
            root instanceof HTMLElement
                ? getComputedStyle(root).backgroundColor || '#ffffff'
                : '#ffffff';
        const dataUrl =
            root instanceof HTMLElement
                ? captureChartRegionToPngDataUrl(root, bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' ? '#ffffff' : bg)
                : null;
        if (dataUrl) {
            try {
                const link = document.createElement('a');
                link.download = `chart-snapshot-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            } catch (e) {
                console.error('[TickUp] Snapshot failed', e);
            }
            return;
        }
        const canvas = document.querySelector('canvas.chart-data-canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error('[TickUp] Snapshot: chart region and main canvas not found.');
            return;
        }
        try {
            const link = document.createElement('a');
            link.download = `chart-snapshot-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error('[TickUp] Snapshot failed', e);
        }
    };

    const revertSymbolToLastCommitted = useCallback(() => {
        const prev = committedSymbolRef.current;
        setFieldValue(prev);
        onSymbolChange?.(prev);
    }, [onSymbolChange]);

    const applySearchSuccess = useCallback(
        (trimmed: string) => {
            committedSymbolRef.current = trimmed;
            setFieldValue(trimmed);
            onSymbolChange?.(trimmed);
        },
        [onSymbolChange]
    );

    const [committedInterval, setCommittedInterval] = useState(interval);
    useEffect(() => {
        setCommittedInterval(interval);
    }, [interval]);

    const handleIntervalSelect = useCallback((newTf: string) => {
        if (!onIntervalSearch) {
            showAlert(
                'No service connected',
                `Interval selection for "${newTf}" requires a data-feed handler. Wire "onIntervalSearch" to your chart to load data for this timeframe.`
            );
            onIntervalChange?.(newTf);
            return;
        }

        const outcome = onIntervalSearch(newTf);
        const applySuccess = () => {
            setCommittedInterval(newTf);
            onIntervalChange?.(newTf);
        };

        if (isThenable(outcome)) {
            outcome.then(
                (v) => { if (v !== false) applySuccess(); },
                (err) => { 
                    const msg = typeof err === 'string' ? err : (err?.message || 'The data feed failed to load the requested interval.');
                    showAlert('Interval retrieval failed', msg);
                }
            );
        } else if (outcome !== false) {
            applySuccess();
        }
    }, [onIntervalSearch, onIntervalChange]);

    const triggerSymbolSearch = useCallback(() => {
        const el = symbolInputRef?.current;
        const raw = fieldValue.trim();

        if (onSymbolSearch) {
            const outcome = onSymbolSearch(raw);
            if (isThenable(outcome)) {
                outcome.then(
                    (v) => {
                        if (!isSymbolSearchSuccess(v)) {
                            revertSymbolToLastCommitted();
                        } else {
                            applySearchSuccess(raw);
                        }
                    },
                    (err) => {
                        const msg = typeof err === 'string' ? err : (err?.message || 'Symbol search failed.');
                        showAlert('Symbol not found', msg);
                        revertSymbolToLastCommitted();
                    }
                );
            } else if (!isSymbolSearchSuccess(outcome)) {
                revertSymbolToLastCommitted();
            } else {
                applySearchSuccess(raw);
            }
            el?.focus();
            return;
        }

        if (onSearch) {
            onSearch();
        } else if (el) {
            showAlert(
                `Symbol search (demo): ${raw}`,
                'Wire "onSymbolSearch" to your chart to load data for this symbol.'
            );
            el.focus();
            el.select();
            return;
        }
        el?.focus();
    }, [applySearchSuccess, fieldValue, onSearch, onSymbolSearch, revertSymbolToLastCommitted, symbolInputRef]);

    const handleSymbolFieldChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            setFieldValue(v);
            onSymbolChange?.(v);
        },
        [onSymbolChange]
    );


    const handleRange = () => onFitVisibleRange?.();

    const handleExport = () => onExportDataCsv?.();

    const handleRefreshClick = () => {
        const p = onRefresh?.();
        if (p && typeof (p as Promise<void>).then === 'function') {
            (p as Promise<void>).catch((e) => console.error('[TickUp] Refresh failed', e));
        }
    };

    const handleTheme = () => onToggleTheme?.();

    return (
        <SettingsToolbarContainer
            $primeGlass={primeGlass}
            $primeGlassLight={primeGlassLight}
            className="settings-toolbar-container"
        >
            <SettingToolbarContent className="settings-toolbar-content" ref={containerRef} dir={direction}>
                <SymbolToolbarCluster className="settings-symbol-cluster" dir={direction}>
                    <SymbolInput
                        ref={symbolInputRef}
                        className="settings-symbol-input"
                        name="symbol-input"
                        placeholder={translate('symbol_placeholder', language)}
                        dir={direction}
                        aria-label={translate('symbol_placeholder', language)}
                        value={fieldValue}
                        onChange={handleSymbolFieldChange}
                        onFocus={() => {
                            symbolFieldFocusedRef.current = true;
                        }}
                        onBlur={() => {
                            symbolFieldFocusedRef.current = false;
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                triggerSymbolSearch();
                            }
                        }}
                    />
                    <Tooltip content={translate('search', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                        axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-search"
                        dir={direction}>
                        <Button className="settings-search-button" onClickHandler={triggerSymbolSearch}>
                            <IconSearch />
                        </Button>
                    </Tooltip>
                </SymbolToolbarCluster>

                <IntervalToolbarCluster className="settings-interval-cluster">
                    <IntervalSelect
                        value={committedInterval}
                        onChange={handleIntervalSelect}
                        themeVariant={themeVariant}
                    />
                </IntervalToolbarCluster>

                <ChartTypeSelectDropdown
                    className="settings-chart-type-dropdown"
                    value={selectedChartType || ChartType.Candlestick}
                    onChange={handleChartTypeChange}
                />
                {showGear && (
                    <Tooltip content={translate('settings', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                        axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-gear" 
                        dir={direction}>
                        <Button className="settings-gear-button" onClickHandler={openSettingsMenu}>
                            <IconGear />
                        </Button>
                    </Tooltip>
                )}
                <Tooltip content={translate('download', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-camera" 
                    dir={direction}>
                    <Button className="settings-camera-button" onClickHandler={handleSnapshot}>
                        <IconCamera />
                    </Button>
                </Tooltip>
                <Tooltip content={translate('range', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-range" 
                    dir={direction}>
                    <Button className="settings-range-button" onClickHandler={handleRange}>
                        <IconRange />
                    </Button>
                </Tooltip>
                <Tooltip content={translate('export', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-download" 
                    dir={direction}>
                    <Button className="settings-download-button" onClickHandler={handleExport}>
                        <IconDownload />
                    </Button>
                </Tooltip>
                <Tooltip content={translate('refresh', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-refresh" 
                    dir={direction}>
                    <Button className="settings-refresh-button" onClickHandler={handleRefreshClick}>
                        <IconRefresh />
                    </Button>
                </Tooltip>
                <Tooltip
                    content={translate('toggle_theme', language)}
                    tooltipAxis={TooltipAxis.horizontal}
                    placement={Placement.bottom}
                    axis={TooltipAxis.vertical}
                    align={TooltipAlign.center}
                    className="settings-tooltip-theme"
                    dir={direction}
                >
                    <Button className="settings-theme-button" onClickHandler={handleTheme}>
                        {themeVariant === ChartTheme.light ? <IconTheme /> : <IconSun />}
                    </Button>
                </Tooltip>
                <Spacer className="settings-toolbar-spacer" />
            </SettingToolbarContent>

            <AlertModal
                isOpen={alert.isOpen}
                onClose={closeAlert}
                title={alert.title}
                message={alert.message}
                themeVariant={themeVariant}
            />
        </SettingsToolbarContainer>
    );
};