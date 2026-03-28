import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    SettingsToolbarContainer, SettingToolbarContent, Spacer,
    SymbolInput,
    SymbolToolbarCluster,
} from '../../styles/SettingsToolbar.styles';

import { Button } from './Buttons';
import {
    IconCamera,
    IconDownload,
    IconGear,
    IconRange,
    IconRefresh,
    IconSearch,
    IconTheme,
} from './icons';
import { ChartType } from "../../types/chartOptions";
import { Placement, TooltipAlign, TooltipAxis } from "../../types/buttons";
import { Tooltip } from "../Tooltip";
import { ChartTypeSelectDropdown } from "./ChartTypeSelectDropdown";
import { translate, getLocaleDefaults } from '../../utils/i18n';
import { captureChartRegionToPngDataUrl } from '../../utils/captureChartRegion';

/* Minimum toolbar width (px) below which the gear/settings icon is hidden */
const MIN_WIDTH_FOR_SETTINGS_ICON = 260;

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
     */
    onSymbolSearch?: (symbol: string) => void;
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
}

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
}: SettingToolbarProps) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const [toolbarWidth, setToolbarWidth] = useState<number>(Infinity);

    const direction = getLocaleDefaults(locale).direction;

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
        const root = document.querySelector('.chart-edge-chart-snapshot-root');
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
                console.error('[ChartEdge] Snapshot failed', e);
            }
            return;
        }
        const canvas = document.querySelector('canvas.chart-data-canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error('[ChartEdge] Snapshot: chart region and main canvas not found.');
            return;
        }
        try {
            const link = document.createElement('a');
            link.download = `chart-snapshot-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error('[ChartEdge] Snapshot failed', e);
        }
    };

    const triggerSymbolSearch = useCallback(() => {
        const el = symbolInputRef?.current;
        const raw =
            symbol !== undefined
                ? String(symbol ?? '').trim()
                : (el?.value?.trim() ?? '');
        if (onSymbolSearch) {
            onSymbolSearch(raw);
        } else if (onSearch) {
            onSearch();
        } else if (el) {
            el.focus();
            el.select();
            return;
        }
        el?.focus();
    }, [onSymbolSearch, onSearch, symbolInputRef, symbol]);

    const handleRange = () => onFitVisibleRange?.();

    const handleExport = () => onExportDataCsv?.();

    const handleRefreshClick = () => {
        const p = onRefresh?.();
        if (p && typeof (p as Promise<void>).then === 'function') {
            (p as Promise<void>).catch((e) => console.error('[ChartEdge] Refresh failed', e));
        }
    };

    const handleTheme = () => onToggleTheme?.();

    return (
        <SettingsToolbarContainer className="settings-toolbar-container">
            <SettingToolbarContent className="settings-toolbar-content" ref={containerRef} dir={direction}>
                <SymbolToolbarCluster className="settings-symbol-cluster" dir={direction}>
                    <SymbolInput
                        ref={symbolInputRef}
                        className="settings-symbol-input"
                        name="symbol-input"
                        placeholder={translate('symbol_placeholder', language)}
                        dir={direction}
                        aria-label={translate('symbol_placeholder', language)}
                        {...(symbol !== undefined
                            ? {
                                  value: symbol,
                                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                                      onSymbolChange?.(e.target.value),
                              }
                            : {
                                  defaultValue: defaultSymbol ?? '',
                                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                                      onSymbolChange?.(e.target.value),
                              })}
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
                <Tooltip content={translate('toggle_theme', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-theme" 
                    dir={direction}>
                    <Button className="settings-theme-button" onClickHandler={handleTheme}>
                        <IconTheme />
                    </Button>
                </Tooltip>
                <Spacer className="settings-toolbar-spacer" />
            </SettingToolbarContent>
        </SettingsToolbarContainer>
    );
};