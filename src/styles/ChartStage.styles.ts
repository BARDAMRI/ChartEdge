import styled from 'styled-components';
import {windowSpread} from "../types/types";
import XAxis from "../components/Canvas/Axes/XAxis";

export const ChartStageContainer = styled.div`
    display: grid;
    flex: 1 1 auto;
    height: 100%;
    width: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
`;

export const TopBar = styled.div`
    grid-row: 1;
`;
export const LeftBar = styled.div`
    grid-column: 1;
`;

interface StageViewProps {
    $yAxisWidth: number,
    $xAxisHeight: number
}

export const ChartView = styled.div<StageViewProps>`
    display: grid;
    grid-template-columns: ${({$yAxisWidth}) => `${$yAxisWidth}px`} 1fr;
    grid-template-rows: 1fr ${({$xAxisHeight}) => `${$xAxisHeight}px`};
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
`;

interface XAxisProps {
    xAxisHeight?: number;
}

export const CanvasAxisContainer = styled.div<XAxisProps>`
    display: grid;
    grid-column: 2;
    grid-row: 1 / span 2;
    grid-template-rows: 1fr ${({xAxisHeight}) => (xAxisHeight ? `${xAxisHeight}px` : '30px')};
    grid-template-columns: 1fr;
    height: 100%;
    min-width: 0;
    min-height: 0;
    position: relative;
    box-sizing: border-box;
`;

export const LeftYAxisContainer = styled.div`
    flex: 0 0 auto;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    grid-column: 1;
    grid-row: 1 / span 1;
`;

export const RightYAxisContainer = styled.div`
    flex: 0 0 auto;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    grid-column: 2;
    grid-row: 1
`;


export const XAxisContainer = styled.div<XAxisProps>`
    grid-row: 2;
    grid-column: 1;
    height: ${({xAxisHeight}) => (xAxisHeight ? `${xAxisHeight}px` : '40px')};
    box-sizing: border-box;
`;

export const CanvasContainer = styled.div`
    grid-row: 1;
    grid-column: 1;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
`;