import styled from 'styled-components';

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

export const ChartView = styled.div`
    display: grid;
    grid-template-columns: var(--yAxisWidth, 50px) 1fr;
    grid-template-rows: 1fr;
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
`;
export const CanvasAxisContainer = styled.div`
    display: grid;
    grid-template-rows: 1fr var(--xAxisHeight, 40px);
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
`;

export const RightYAxisContainer = styled.div`
    flex: 0 0 auto;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
`;

export const XAxisContainer = styled.div`
    grid-row: 2;
    grid-column: 1;
    height: var(--xAxisHeight, 40px);
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