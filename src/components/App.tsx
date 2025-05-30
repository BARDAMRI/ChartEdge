import React from 'react';
import {ChartStage} from './Canvas/ChartStage.tsx';
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
                <ChartStage/>
                <Toolbar/>
            </div>
        </div>
    );
};