import React from 'react';
import ReactDOM from 'react-dom/client';
import {SimpleChartEdge} from './components/SimpleChartEdge';
import {ModeProvider} from './contexts/ModeContext';

const root = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <ModeProvider>
            <SimpleChartEdge/>
        </ModeProvider>
    </React.StrictMode>
);