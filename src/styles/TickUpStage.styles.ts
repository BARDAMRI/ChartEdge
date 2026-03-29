import styled from 'styled-components';
import {AxesPosition} from "../types/types";

export const TickUpStageContainer = styled.div<{
    $showTopBar: boolean;
    $showLeftBar: boolean;
    $showSymbolStrip: boolean;
}>`
    display: grid;
    flex: 1 1 auto;
    height: 100%;
    width: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
    grid-template-rows: ${({$showTopBar, $showSymbolStrip}) =>
        $showTopBar || $showSymbolStrip ? 'auto minmax(0, 1fr)' : '0px minmax(0, 1fr)'};
    grid-template-columns: ${({$showLeftBar}) => ($showLeftBar ? 'auto minmax(0, 1fr)' : '0px minmax(0, 1fr)')};
`;

/** Read-only symbol label when the top toolbar is hidden (e.g. Pulse) but a symbol was provided. */
export const CompactSymbolStrip = styled.div`
    grid-row: 1;
    grid-column: 1 / span 2;
    flex-shrink: 0;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
    z-index: 2;
`;

export const TopBar = styled.div`
    grid-row: 1;
    grid-column: 1 / span 2;
    padding-bottom: 5px;
    min-height: 0;
    min-width: 0;
    overflow: visible;
    z-index: 2;
`;
export const LeftBar = styled.div`
    grid-row: 2;
    grid-column: 1;
    overflow: hidden;
    min-width: 0;
    min-height: 0;
`;

interface StageViewProps {
    $yAxisWidth: number;
    $xAxisHeight: number;
    $yAxisPosition: AxesPosition;
}

export const ChartView = styled.div<StageViewProps>`
    display: grid;
    grid-template-columns: ${({$yAxisPosition, $yAxisWidth}) => 
        $yAxisPosition === AxesPosition.left 
            ? `${$yAxisWidth}px minmax(0, 1fr)` 
            : `minmax(0, 1fr) ${$yAxisWidth}px`
    };
    grid-template-rows: minmax(0, 1fr) ${({$xAxisHeight}) => `${$xAxisHeight}px`};
    position: relative;
    grid-row: 2;
    grid-column: 2;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
`;

interface XAxisProps {
    xAxisHeight?: number;
    $yAxisPosition?: AxesPosition;
}

export const CanvasAxisContainer = styled.div<XAxisProps>`
    display: grid;
    grid-column: ${({$yAxisPosition}) => $yAxisPosition === AxesPosition.right ? 1 : 2};
    grid-row: 1 / span 2;
    grid-template-rows: 1fr ${({xAxisHeight}) => (xAxisHeight ? `${xAxisHeight}px` : '30px')};
    grid-template-columns: 1fr;
    height: 100%;
    min-width: 0;
    min-height: 0;
    position: relative;
    box-sizing: border-box;
`;

export const YAxisContainer = styled.div<{$yAxisPosition: AxesPosition}>`
    flex: 0 0 auto;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    grid-column: ${({$yAxisPosition}) => $yAxisPosition === AxesPosition.left ? 1 : 2};
    grid-row: 1 / span 1;
`;


export const XAxisContainer = styled.div<XAxisProps>`
    grid-row: 2;
    grid-column: 1;
    height: ${({xAxisHeight}) => (xAxisHeight ? `${xAxisHeight}px` : '40px')};
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
`;

export const CanvasContainer = styled.div`
    grid-row: 1;
    grid-column: 1;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    width: 100%;

`;

export const FloatingSettingsButton = styled.div<{ $yAxisPosition?: AxesPosition }>`
    position: absolute;
    top: 8px;
    ${({ $yAxisPosition }) => ($yAxisPosition === AxesPosition.left ? 'right: 8px;' : 'left: 8px;')}
    z-index: 100;
    cursor: pointer;
    background-color: var(--widget-bg-color, rgba(255, 255, 255, 0.8));
    border-radius: 4px;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    opacity: 0.6;
    transition: opacity 0.2s ease, background-color 0.2s ease;

    &:hover {
        opacity: 1;
        background-color: var(--widget-hover-bg-color, #f0f0f0);
    }
`;
