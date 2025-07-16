import React from 'react';
import '../../styles/SettingsToolbar.scss';

export const SettingsToolbar: React.FC = () => {
    const handleDownload = () => {
        const canvas = document.querySelector('canvas'); // Ensure the tag name is lowercase
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
        // This function should open the settings menu.
        // You can implement this based on your application's requirements.
        console.log('Opening settings menu...');
    }

    // add the styles using daisy-ui to all elements.
    //style all options in the select elements and all buttons with daisy ui styles.
    // I want this to look like a modern trading platform toolbar with a light theme.
    return (
        <div className={'settings-toolbar'}>
            <input type="text" placeholder="Symbol"/>
            <select>
                <option value="1m">1 Min</option>
                <option value="5m">5 Min</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
            </select>
            <select>
                <option value="50">50 Bars</option>
                <option value="100">100 Bars</option>
                <option value="200">200 Bars</option>
            </select>
            <select>
                <option value="candlestick">Candlestick</option>
                <option value="line">Line</option>
            </select>
            <button onClick={handleDownload}>📸 Snapshot</button>
            <button>⚙️ Settings</button>
        </div>
    );
};