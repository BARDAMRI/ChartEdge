import React, {createContext, useContext, useState} from 'react';

export enum Mode {
    none,
    drawLine,
    drawRectangle,
    drawCircle,
    drawTriangle,
    drawAngle
}

interface ModeContextProps {
    mode: Mode;
    setMode: (mode: Mode) => void;
}

const ModeContext = createContext<ModeContextProps | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [mode, setMode] = useState<Mode>(Mode.none);

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