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
    height: ${({$xAxisHeight}) => `calc(100% - ${$xAxisHeight}px)`};
`;

interface HoverTooltipProps {
    $isPositive: boolean;
}

export const HoverTooltip = styled.div<HoverTooltipProps>`
    position: absolute;
    bottom: 5px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 6px 10px;
    color: ${({ $isPositive }) => ($isPositive ? '#008000' : '#cc0000')};
    border: 1px solid ${({ $isPositive }) => ($isPositive ? '#008000' : '#cc0000')};
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    gap: 10px;
    z-index: 10;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    pointer-events: none;
`;
