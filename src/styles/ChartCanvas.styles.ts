import styled from 'styled-components';

interface CanvasContainerProps {
    $heightPrecent: number;
    $zIndex?: number;
}

export const StyledCanvasNonResponsive = styled.canvas<CanvasContainerProps>`
    display: flex;
    width: 100% !important;
    height: ${({$heightPrecent}) => `${$heightPrecent}%`} !important;
    padding: 0;
    margin: 0;
    bottom: 0;
    background-color: transparent;
    border: none;
    touch-action: none;
    overscroll-behavior: none;
    font-size: 12px;
    position: absolute;
    z-index: ${({$zIndex}) => ($zIndex !== undefined ? $zIndex : 0)};
    pointer-events: none;
`;

export const StyledCanvasResponsive = styled.canvas<CanvasContainerProps>`
    display: flex;
    width: 100% !important;
    height: ${({$heightPrecent}) => `${$heightPrecent}%`} !important;
    padding: 0;
    margin: 0;
    bottom: 0;
    background-color: transparent;
    border: none;
    touch-action: none;
    overscroll-behavior: none;
    font-size: 12px;
    position: absolute;
    z-index: ${({$zIndex}) => ($zIndex !== undefined ? $zIndex : 0)};
    pointer-events: auto;
`;


interface InnerCanvasContainerProps {
    $xAxisHeight: number;
}

export const InnerCanvasContainer = styled.div<InnerCanvasContainerProps>`
    position: relative;
    width: 100%;
    height: 100%;
`;
export const ChartingContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

interface HoverTooltipProps {
    $isPositive: boolean;
}

export const HoverTooltip = styled.div<HoverTooltipProps>`
    position: absolute;
    bottom: 5px;
    right: 10px;
    opacity: 0.8;
    background-color: rgba(255, 255, 255, 0.4);
    padding: 6px 10px;
    color: ${({$isPositive}) => ($isPositive ? 'rgba(0,128,0,0.8)' : 'rgba(204,0,0,0.8)')};
    border: 1px solid ${({$isPositive}) => ($isPositive ? 'rgba(0,128,0,0.8)' : 'rgba(204,0,0,0.8)')};
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    gap: 10px;
    z-index: 50;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    pointer-events: none;
`;
