

import React from 'react';
import { Mode } from '../../contexts/ModeContext';

interface ModeButtonProps {
  mode: Mode;
  currentMode: Mode;
  onClick: (mode: Mode) => void;
  label: string;
}

const ModeButton: React.FC<ModeButtonProps> = ({ mode, currentMode, onClick, label }) => {
  const selected = mode === currentMode;
  return (
    <button
      className={selected ? 'selected' : ''}
      onClick={() => onClick(mode)}
    >
      {label}
    </button>
  );
};

export default ModeButton;