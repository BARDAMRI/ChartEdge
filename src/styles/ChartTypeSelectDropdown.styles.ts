import styled from "styled-components";

export const ChartTypeSelectContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;
    width: 80px;
`;

export const ChartTypeTrigger = styled.div`
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    aspect-ratio: auto;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 0 8px;
    cursor: pointer;
    color: inherit;
    line-height: 0;
    overflow: visible;

    svg {
        width: 20px;
        height: 20px;
    }
`;

export const ChartTypeDropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    z-index: 10;
`;

export const ChartTypeOption = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: none;
    background: ${({$active}) => $active ? "rgba(120,130,255,0.15)" : "transparent"};
    cursor: pointer;

    &:hover {
        background: rgba(120, 130, 255, 0.25);
    }

    svg {
        width: 70%;
        height: 70%;
    }
`;