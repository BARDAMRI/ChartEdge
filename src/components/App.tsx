import React from 'react';
import {ChartStage} from './Canvas/ChartStage.tsx';
import {Toolbar} from './Toolbar/Toolbar.tsx';
import {SettingsToolbar} from './Toolbar/SettingsToolbar.tsx';
import '../styles/App.scss';

export const App: React.FC = () => {
    return (
        <div className={'main-app-window flex flex-col h-full w-full p-0 m-0'}>
            <div className={'settings-area'}>
                <SettingsToolbar/>
            </div>
            <div className={'lower-container flex flex-1'}>
                <div className={'toolbar-area'}>
                    <Toolbar/>
                </div>
                <div className={'chart-stage-area flex-1 h-full'}>
                    <ChartStage/>
                </div>
            </div>
        </div>
    );
};