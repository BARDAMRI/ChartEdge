import React from 'react';
import {Mode} from '../../contexts/ModeContext';
import {ToolbarButton} from '../../styles/Toolbar.styles';

interface ModeButtonProps {
    mode: Mode;
    currentMode: Mode;
    onClickHandler: any;
    label: string;
    title: string;
}

const ModeButton: React.FC<ModeButtonProps> = ({mode, currentMode, onClickHandler, label, title}) => {
    const selected = mode === currentMode;

    return (
        <div style={{cursor:'pointer'}} title={title}>
            <ToolbarButton $selected={selected} title={title} onClick={onClickHandler(mode)}>
                {label}
            </ToolbarButton>
        </div>
    );
};

export default ModeButton;