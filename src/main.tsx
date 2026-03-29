import React from 'react';
import ReactDOM from 'react-dom/client';
import {TickUpCommand} from './components/TickUpProducts';

if (typeof document !== 'undefined') {
    document.title = 'TickUp Charts — Interactive charts';
}

const root = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <div style={{height: '100vh', width: '100vw'}}>
            <TickUpCommand />
        </div>
    </React.StrictMode>
);