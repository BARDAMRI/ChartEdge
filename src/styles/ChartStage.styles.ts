import styled from 'styled-components';

export const ChartStageContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
`;

export const CanvasAxisContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
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
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  box-sizing: border-box;
`;

export const CanvasContainer = styled.div`
  flex: 1 1 auto;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
`;