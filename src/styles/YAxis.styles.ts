import styled from 'styled-components';
import {AxesPosition} from "../types/types";

interface StyledYAxisCanvasProps {
    $position: AxesPosition;
}

export const StyledYAxisCanvas = styled.canvas<StyledYAxisCanvasProps>`
    display: flex;
    width: 100%;
    height: 100% !important;
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
    padding: 0;
    margin: 0;
    background-color: transparent;
    border: none;
    pointer-events: none;
`;