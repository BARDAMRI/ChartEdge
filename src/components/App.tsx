import React from 'react';
import {ChartCanvas} from './Canvas/ChartCanvas.tsx';
import {Toolbar} from './Toolbar/Toolbar.tsx';
import {SettingsToolbar} from './Toolbar/SettingsToolbar.tsx';
import '../styles/App.scss';

export const App: React.FC = () => {
    return (
        <div className={'main-app-window'}>
            <div className={'settings-area'}>
                <SettingsToolbar/>
            </div>
            <div className={'lower-container'}>
                <ChartCanvas/>
                <Toolbar/>
            </div>
        </div>
    );
};