import React, {useEffect} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext';
import ModeButton from './ModeButton';
import {
  ToolbarContainer,
  ToolbarContent,
  ToolbarButton
} from '../../styles/Toolbar.styles';

export const Toolbar: React.FC = () => {
    const {mode, setMode} = useMode();

    useEffect(() => {
        console.log('Toolbar mode changed:', mode);
    },[mode]);
    return (
        <ToolbarContainer className={'toolbar-container'}>
            <ToolbarContent>
                <ModeButton mode={Mode.drawLine} currentMode={mode} onClickHandler={setMode} label="📏" title="Draw Line"/>
                <ModeButton mode={Mode.drawRectangle} currentMode={mode} onClickHandler={setMode} label="⬛" title="Draw Rectangle"/>
                <ModeButton mode={Mode.drawCircle} currentMode={mode} onClickHandler={setMode} label="⚪" title="Draw Circle"/>
                <ModeButton mode={Mode.drawTriangle} currentMode={mode} onClickHandler={setMode} label="🔺" title="Draw Triangle"/>
                <ModeButton mode={Mode.drawAngle} currentMode={mode} onClickHandler={setMode} label="📐" title="Draw Angle"/>
                <ModeButton mode={Mode.select} currentMode={mode} onClickHandler={setMode} label="🖱️" title="Select Mode"/>
                <ModeButton mode={Mode.editShape} currentMode={mode} onClickHandler={setMode} label="✏️" title="Edit Shape"/>
            </ToolbarContent>
        </ToolbarContainer>
    );
};