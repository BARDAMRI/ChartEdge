import styled, { createGlobalStyle } from 'styled-components';

/**
 * Global styles applied to html, body and root element
 */
export const GlobalStyle = createGlobalStyle`
    html, body, #root {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        min-height: 0;
        min-width: 0;
        box-sizing: border-box;
        background-color: white;
    }
`;

export const MainAppWindow = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
`;

export const LowerContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  height: calc(100% - 40px);
  width: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
`;

export const ToolbarArea = styled.div`
  flex: 0 0 auto;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

export const ChartStageArea = styled.div`
    flex: 1 1 auto;
    padding:  10px 20px;
    height: 100%;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

export const SettingsArea = styled.div`
  display: flex;
  flex-direction: row;
  height: 40px;
  width: 100%;
`;