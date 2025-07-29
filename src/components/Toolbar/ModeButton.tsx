import React from 'react';
import { Mode } from '../../contexts/ModeContext';
import { ToolbarButton } from '../../styles/Toolbar.styles';

interface ModeButtonProps {
  mode: Mode;
  currentMode: Mode;
  onClick: (mode: Mode) => void;
  label: string;
}

const ModeButton: React.FC<ModeButtonProps> = ({ mode, currentMode, onClick, label }) => {
  const selected = mode === currentMode;

  return (
    <ToolbarButton $selected={selected} onClick={() => onClick(mode)}>
      {label}
    </ToolbarButton>
  );
};

export default ModeButton;