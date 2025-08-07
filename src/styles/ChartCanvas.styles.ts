import styled from 'styled-components';

export const StyledCanvas = styled.canvas`
    display: flex;
    position: relative;
    width: 100% !important;
    height: 100% !important;
    padding: 0;
    margin: 0;
    background-color: white;
    border: none;
    pointer-events: auto;
`;

interface InnerCanvasContainerProps {
    $xAxisHeight: number;
}

export const InnerCanvasContainer = styled.div<InnerCanvasContainerProps>`
    position: relative;
    width: 100%;
    height: ${({ $xAxisHeight }) => `calc(100% - ${$xAxisHeight}px)`};
`;

export const HoverTooltip = styled.div`
    position: absolute;
    background-color: rgba(255, 255, 255, 0.9);
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 12px;
    color: #333;
    pointer-events: none;
    z-index: 10;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
`;

