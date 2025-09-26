import React from 'react';
import {
    SettingsToolbarContainer, SettingToolbarContent,
    SymbolInput,
} from '../../styles/SettingsToolbar.styles';

import {Button} from './Buttons';
import {
    IconCamera,
    IconDownload,
    IconGear,
    IconRange,
    IconRefresh,
    IconSearch,
    IconTheme,
} from './icons';
import {ChartType} from "../../types/chartOptions";
import {Placement, TooltipAlign, TooltipAxis} from "../../types/buttons";
import {Tooltip} from "../Tooltip";
import {ChartTypeSelectDropdown} from "./ChartTypeSelectDropdown";

interface SettingToolbarProps {
    handleChartTypeChange: (type: ChartType) => void;
    selectedChartType?: ChartType;
}

export const SettingsToolbar = ({handleChartTypeChange, selectedChartType}: SettingToolbarProps) => {
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

    const openSettingsMenu = () => {
        console.log('Opening settings menu...');
    };

    const openSearch = () => {
        console.log('Opening search...');
    };

    const openRange = () => {
        console.log('Opening range selection...');
    };

    const doDownload = () => {
        console.log('Downloading data...');
    };

    const doRefresh = () => {
        console.log('Refreshing data...');
    };

    const toggleTheme = () => {
        console.log('Toggling theme...');
    };

    return (
        <SettingsToolbarContainer className="settings-toolbar">
            <SettingToolbarContent>
                <SymbolInput className={'symbol-choose-icon'} name={'symbol-input'} placeholder="Symbol"/>
                <ChartTypeSelectDropdown
                    value={selectedChartType || ChartType.Candlestick}
                    onChange={handleChartTypeChange}
                />
                <Tooltip content="Settings" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={openSettingsMenu}>
                        <IconGear/>
                    </Button>
                </Tooltip>
                <Tooltip content="Download" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={handleDownload}>
                        <IconCamera/>
                    </Button>
                </Tooltip>
                <Tooltip content="Search" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={openSearch}>
                        <IconSearch/>
                    </Button>
                </Tooltip>
                <Tooltip content="Range" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={openRange}>
                        <IconRange/>
                    </Button>
                </Tooltip>
                <Tooltip content="Download" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={doDownload}>
                        <IconDownload/>
                    </Button>
                </Tooltip>
                <Tooltip content="Refresh" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={doRefresh}>
                        <IconRefresh/>
                    </Button>
                </Tooltip>
                <Tooltip content="Toggle Theme" tooltipAxis={TooltipAxis.horizontal} placement={Placement.bottom}
                         axis={TooltipAxis.vertical}
                         align={TooltipAlign.center}>
                    <Button onClickHandler={toggleTheme}>
                        <IconTheme/>
                    </Button>
                </Tooltip>
            </SettingToolbarContent>
        </SettingsToolbarContainer>
    );
};