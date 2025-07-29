import React from 'react';
import {SettingsToolbarContainer} from '../../styles/SettingsToolbar.styles';

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

    return (
        <SettingsToolbarContainer className={'settings-toolbar'}>
            <input className={'symbol-name-input'} type="text" placeholder="Symbol"/>
            <select className={'symbol-interval-select'}>
                <option value="1m">1 Min</option>
                <option value="5m">5 Min</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
            </select>
            <select className={'symbol-range-select'}>
                <option value="50">50 Bars</option>
                <option value="100">100 Bars</option>
                <option value="200">200 Bars</option>
            </select>
            <select className={'symbol-chart-type-select'}>
                <option value="candlestick">Candlestick</option>
                <option value="line">Line</option>
            </select>
            <button className={'snapshot-button'} onClick={handleDownload}>📸 Snapshot</button>
            <button className={'more-settings-button'} onClick={openSettingsMenu}>⚙️ Settings</button>
        </SettingsToolbarContainer>
    );
};