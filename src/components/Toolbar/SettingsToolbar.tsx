import React from 'react';
import {
    SettingsToolbarContainer,
    SymbolInput,
    ChartTypeSelect,
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
import {ChartType} from "../../types/chartStyleOptions";
import {Placement, TooltipAlign, TooltipAxis} from "../../types/buttons";
import {Tooltip} from "../Tooltip";

export const SettingsToolbar: React.FC = () => {
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

    const chartTypes = (Object.values(ChartType).filter(v => typeof v === 'string') as string[]);
    return (
        <SettingsToolbarContainer className="settings-toolbar">
            <SymbolInput className={'symbol-choose-icon'} placeholder="Symbol"/>
            <ChartTypeSelect className={'chart-type-select-container'} defaultValue="candlestick"
                             aria-label="Chart type">
                {/* iterate the chart types */}
                {chartTypes.map((type) => (
                    <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                ))}
            </ChartTypeSelect>

            <Tooltip content="Settings" placement={Placement.bottom} axis={TooltipAxis.vertical}
                     align={TooltipAlign.center}>
                <Button onClickHandler={openSettingsMenu}>
                    <IconGear/>
                </Button>
            </Tooltip>
            <Tooltip content="Settings" placement={Placement.bottom} axis={TooltipAxis.vertical}
                     align={TooltipAlign.center}>
                <Button onClickHandler={handleDownload}>
                    <IconCamera/>
                </Button>
            </Tooltip>
            <Tooltip content="Settings" placement={Placement.bottom} axis={TooltipAxis.vertical}
                     align={TooltipAlign.center}>
                <Button onClickHandler={openSearch}>
                    <IconSearch/>
                </Button>
            </Tooltip>
            <Tooltip content="Settings" placement={Placement.bottom} axis={TooltipAxis.vertical}
                     align={TooltipAlign.center}>
                <Button onClickHandler={openRange}>
                    <IconRange/>
                </Button>
            </Tooltip>
            <Tooltip content="Settings" placement={Placement.bottom} axis={TooltipAxis.vertical}
                     align={TooltipAlign.center}>
                <Button onClickHandler={doDownload}>
                    <IconDownload/>
                </Button>
            </Tooltip>
            <Tooltip content="Settings" placement={Placement.bottom} axis={TooltipAxis.vertical}
                     align={TooltipAlign.center}>
                <Button onClickHandler={doRefresh}>
                    <IconRefresh/>
                </Button>
            </Tooltip>
            <Tooltip content="Settings" placement={Placement.bottom} axis={TooltipAxis.vertical}
                     align={TooltipAlign.center}>
                <Button onClickHandler={toggleTheme}>
                    <IconTheme/>
                </Button>
            </Tooltip>
        </SettingsToolbarContainer>
    );
};