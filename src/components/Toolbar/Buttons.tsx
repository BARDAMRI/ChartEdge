import React from 'react';
import {ToolbarVerticalButton} from '../../styles/Toolbar.styles';
import {ButtonProps, ModeButtonProps} from "../../types/buttons";
import {ToolbarHorizontalButtons} from "../../styles/SettingsToolbar.styles";


export const ModeButton: React.FC<ModeButtonProps> = ({mode, currentMode, onClickHandler, children}) => {

    return (
        <ToolbarVerticalButton
            $selected={mode === currentMode}
            onClick={() => onClickHandler(mode)}
        >
            {children}
        </ToolbarVerticalButton>
    );
};

export const Button: React.FC<ButtonProps> = ({onClickHandler, children}) => {

    return (
        <ToolbarHorizontalButtons
            onClick={() => onClickHandler()}
        >
            {children}
        </ToolbarHorizontalButtons>
    );
};
