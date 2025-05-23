import React from 'react';
import ReactDOM from 'react-dom/client';
import {App} from './components/App';
import {ModeProvider} from './contexts/ModeContext';

const root = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <ModeProvider>
            <App/>
        </ModeProvider>
    </React.StrictMode>
);