import React, { useRef, useState, useEffect } from 'react';
import {
    SettingsToolbarContainer, SettingToolbarContent, Spacer,
    SymbolInput,
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
}

export const SettingsToolbar = ({
    handleChartTypeChange,
    selectedChartType,
    openSettingsMenu,
    showSettingsBar = true,
    language = 'en',
    locale = 'en-US',
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

    const handleDownload = () => {
        const canvas = document.querySelector('canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error('Canvas element not found or invalid.');
            return;
        }
        const link = document.createElement('a');
        link.download = 'chart-snapshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <SettingsToolbarContainer className="settings-toolbar-container">
            <SettingToolbarContent className="settings-toolbar-content" ref={containerRef}>
                <SymbolInput 
                    className="settings-symbol-input" 
                    name="symbol-input" 
                    placeholder={translate('symbol_placeholder', language)} 
                    dir={direction}
                />
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
                    <Button className="settings-camera-button" onClickHandler={handleDownload}>
                        <IconCamera />
                    </Button>
                </Tooltip>
                <Tooltip content={translate('search', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-search" 
                    dir={direction}>
                    <Button className="settings-search-button" onClickHandler={() => {}}>
                        <IconSearch />
                    </Button>
                </Tooltip>
                <Tooltip content={translate('range', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-range" 
                    dir={direction}>
                    <Button className="settings-range-button" onClickHandler={() => {}}>
                        <IconRange />
                    </Button>
                </Tooltip>
                <Tooltip content={translate('export', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-download" 
                    dir={direction}>
                    <Button className="settings-download-button" onClickHandler={() => {}}>
                        <IconDownload />
                    </Button>
                </Tooltip>
                <Tooltip content={translate('refresh', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-refresh" 
                    dir={direction}>
                    <Button className="settings-refresh-button" onClickHandler={() => {}}>
                        <IconRefresh />
                    </Button>
                </Tooltip>
                <Tooltip content={translate('toggle_theme', language)} tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-theme" 
                    dir={direction}>
                    <Button className="settings-theme-button" onClickHandler={() => {}}>
                        <IconTheme />
                    </Button>
                </Tooltip>
                <Spacer className="settings-toolbar-spacer" />
            </SettingToolbarContent>
        </SettingsToolbarContainer>
    );
};