import React from 'react';
import {ChartCanvas} from './ChartCanvas';
import {Toolbar} from './Toolbar';
import {SettingsToolbar} from './SettingsToolbar';
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