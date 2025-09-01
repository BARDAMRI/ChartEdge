import styled from 'styled-components';

interface StyledXAxisCanvasProps {
    $height: number;
}

export const StyledXAxisCanvas = styled.canvas<StyledXAxisCanvasProps>`
    display: flex;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
    padding: 0;
    margin: 0;
    background-color: transparent;
    border: none;
    pointer-events: none;
`;