import styled, { createGlobalStyle } from 'styled-components';

/**
 * Global styles applied to html, body and root element
 */
export const GlobalStyle = createGlobalStyle<{ $pageBackground?: string }>`
    /* Global styles intentionally relaxed to prevent hijacking the host application's body/scrolling. 
       Host applications should configure html/body sizing themselves if they desire a full-screen layout. */
`;

export const MainAppWindow = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden;
`;

export const LowerContainer = styled.div`
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    box-sizing: border-box;
`;

export const ToolbarArea = styled.div`
    height: 100%;
    width: fit-content;
    box-sizing: border-box;
    min-width: 0;
    min-height: 0;
`;

export const ChartStageArea = styled.div`
    flex: 1 1 auto;
    padding: 5px;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
`;

export const SettingsArea = styled.div`
  display: flex;
  flex-direction: row;
  height: fit-content;
  width: 100%;
  min-width: 0;
  min-height: 0;
`;