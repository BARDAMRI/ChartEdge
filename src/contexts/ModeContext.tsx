import React, {createContext, useContext, useState} from 'react';

export enum Mode {
    none,
    drawLine,
    drawRectangle,
    drawCircle,
    drawTriangle,
    drawAngle,
    select,
    editShape
}

interface ModeContextProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextProps | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [mode, setModeState] = useState<Mode>(Mode.none);

    const setMode = (newMode: Mode) => {
        setModeState(prev => (prev === newMode ? Mode.none : newMode));
    };

    return (
        <ModeContext.Provider value={{mode, setMode}}>
            {children}
        </ModeContext.Provider>
    );
};

export const useMode = (): ModeContextProps => {
    const context = useContext(ModeContext);
    if (!context) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};