import styled from 'styled-components';
import {AxesPosition} from "../types/types";

interface StyledYAxisCanvasProps {
    $position: AxesPosition;
}

export const StyledYAxisCanvas = styled.canvas<StyledYAxisCanvasProps>`
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    background-color: white;
    border: none;
    pointer-events: none;
    left: ${({$position}) => ($position === AxesPosition.left ? '0' : 'auto')};
    right: ${({$position}) => ($position === AxesPosition.right ? '0' : 'auto')};
    top: 0;
    bottom: 0;
`;