import React from 'react';
import {Mode, useMode} from '../contexts/ModeContext';
import '../styles/Toolbar.scss';

export const Toolbar: React.FC = () => {
    const {mode, setMode} = useMode();

    return (
        <div className={'toolbar-container'}>
            <div className={'toolbar'}>
                <button
                    className={mode === Mode.drawLine ? 'selected' : ''}
                    onClick={() => setMode(Mode.drawLine)}
                >
                    D Line
                </button>
                <button className={mode === Mode.drawRectangle ? 'selected' : ''} onClick={() => setMode(Mode.drawRectangle)}>D Rect</button>
                <button className={mode === Mode.drawCircle ? 'selected' : ''} onClick={() => setMode(Mode.drawCircle)}>D Cir</button>
                <button className={mode === Mode.drawTriangle ? 'selected' : ''} onClick={() => setMode(Mode.drawTriangle)}>D Triangle</button>
                <button className={mode === Mode.drawAngle ? 'selected' : ''} onClick={() => setMode(Mode.drawAngle)}>D Angle</button>
                <button className={mode === Mode.select ? 'selected' : ''} onClick={() => setMode(Mode.select)}>Select</button>
                <button className={mode === Mode.editShape ? 'selected' : ''} onClick={() => setMode(Mode.editShape)}>Edit</button>
            </div>
        </div>
    );
};