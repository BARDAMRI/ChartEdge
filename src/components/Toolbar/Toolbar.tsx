import React from 'react';
import { Mode, useMode } from '../../contexts/ModeContext';
import ModeButton from './ModeButton';
import '../../styles/Toolbar.scss';

export const Toolbar: React.FC = () => {
  const { mode, setMode } = useMode();

  return (
    <div className={'toolbar-container'}>
      <div className={'toolbar'}>
        <ModeButton mode={Mode.drawLine} currentMode={mode} onClick={setMode} label="D Line" />
        <ModeButton mode={Mode.drawRectangle} currentMode={mode} onClick={setMode} label="D Rect" />
        <ModeButton mode={Mode.drawCircle} currentMode={mode} onClick={setMode} label="D Cir" />
        <ModeButton mode={Mode.drawTriangle} currentMode={mode} onClick={setMode} label="D Triangle" />
        <ModeButton mode={Mode.drawAngle} currentMode={mode} onClick={setMode} label="D Angle" />
        <ModeButton mode={Mode.select} currentMode={mode} onClick={setMode} label="Select" />
        <ModeButton mode={Mode.editShape} currentMode={mode} onClick={setMode} label="Edit" />
      </div>
    </div>
  );
};