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

/* Minimum toolbar width (px) below which the gear/settings icon is hidden */
const MIN_WIDTH_FOR_SETTINGS_ICON = 260;

interface SettingToolbarProps {
    handleChartTypeChange: (type: ChartType) => void;
    selectedChartType?: ChartType;
    openSettingsMenu: () => void;
    /** When false the entire toolbar renders nothing */
    showSettingsBar?: boolean;
}

export const SettingsToolbar = ({
    handleChartTypeChange,
    selectedChartType,
    openSettingsMenu,
    showSettingsBar = true,
}: SettingToolbarProps) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const [toolbarWidth, setToolbarWidth] = useState<number>(Infinity);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect?.width ?? Infinity;
            setToolbarWidth(w);
        });
        ro.observe(el);
        // Fire once immediately
        setToolbarWidth(el.getBoundingClientRect().width);
        return () => ro.disconnect();
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
        <SettingsToolbarContainer className="settings-toolbar-container" ref={containerRef}>
            <SettingToolbarContent className="settings-toolbar-content">
                <SymbolInput className="settings-symbol-input" name="symbol-input" placeholder="Symbol" />
                <ChartTypeSelectDropdown
                    className="settings-chart-type-dropdown"
                    value={selectedChartType || ChartType.Candlestick}
                    onChange={handleChartTypeChange}
                />
                {showGear && (
                    <Tooltip content="Settings" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                        axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-gear">
                        <Button className="settings-gear-button" onClickHandler={openSettingsMenu}>
                            <IconGear />
                        </Button>
                    </Tooltip>
                )}
                <Tooltip content="Download" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-camera">
                    <Button className="settings-camera-button" onClickHandler={handleDownload}>
                        <IconCamera />
                    </Button>
                </Tooltip>
                <Tooltip content="Search" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-search">
                    <Button className="settings-search-button" onClickHandler={() => {}}>
                        <IconSearch />
                    </Button>
                </Tooltip>
                <Tooltip content="Range" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-range">
                    <Button className="settings-range-button" onClickHandler={() => {}}>
                        <IconRange />
                    </Button>
                </Tooltip>
                <Tooltip content="Export" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-download">
                    <Button className="settings-download-button" onClickHandler={() => {}}>
                        <IconDownload />
                    </Button>
                </Tooltip>
                <Tooltip content="Refresh" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-refresh">
                    <Button className="settings-refresh-button" onClickHandler={() => {}}>
                        <IconRefresh />
                    </Button>
                </Tooltip>
                <Tooltip content="Toggle Theme" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                    axis={TooltipAxis.vertical} align={TooltipAlign.center} className="settings-tooltip-theme">
                    <Button className="settings-theme-button" onClickHandler={() => {}}>
                        <IconTheme />
                    </Button>
                </Tooltip>
                <Spacer className="settings-toolbar-spacer" />
            </SettingToolbarContent>
        </SettingsToolbarContainer>
    );
};