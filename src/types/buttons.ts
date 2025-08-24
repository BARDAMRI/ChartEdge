import type {ReactNode} from 'react';
import {Mode} from "../contexts/ModeContext";

export interface ModeButtonProps {
    mode: Mode;
    currentMode: Mode;
    onClickHandler: any;
    children?: ReactNode;
}

export interface ButtonProps {
    onClickHandler: any;
    children?: ReactNode;
}


export enum Placement {
    top,
    right,
    bottom,
    left,
    auto
}

export enum TooltipAlign {
    start,
    center,
    end
}

export enum TooltipAxis {
    horizontal,
    vertical
}