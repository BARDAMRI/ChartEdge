import React from 'react';
import {Mode, useMode} from '../contexts/ModeContext';
import '../styles/Toolbar.scss';

export const Toolbar: React.FC = () => {
    const {setMode} = useMode();

    return (
        <div className={'toolbar'}>
        <button onClick={() => setMode(Mode.drawLine)}>D Line</button>
        <button onClick={() => setMode(Mode.drawRectangle)}>D Rect</button>
        <button onClick={() => setMode(Mode.drawCircle)}>D Cir</button>
        <button onClick={() => setMode(Mode.drawTriangle)}>D Triangle</button>
        <button onClick={() => setMode(Mode.drawAngle)}>D Angle</button>
        </div>
    );
};