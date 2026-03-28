import React from 'react';
import ReactDOM from 'react-dom/client';
import {ChartEdgeCommand} from './components/ChartEdgeProducts';

if (typeof document !== 'undefined') {
    document.title = 'ChartEdge — Interactive charts';
}

const root = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <div style={{height: '100vh', width: '100vw'}}>
            <ChartEdgeCommand />
        </div>
    </React.StrictMode>
);