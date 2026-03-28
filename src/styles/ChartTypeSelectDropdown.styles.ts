import styled from "styled-components";

export const ChartTypeSelectContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;
    width: 88px;
    flex-shrink: 0;
`;

export const ChartTypeTrigger = styled.div`
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 100%;
    min-height: 32px;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 0 8px;
    cursor: pointer;
    color: inherit;
    line-height: 0;
    overflow: visible;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }
`;

interface ChartTypeDropdownMenuProps {
    $top: number;
    $left: number;
    $minWidth: number;
}

/** Fixed to viewport so parent overflow (e.g. chart stage) does not clip the menu */
export const ChartTypeDropdown = styled.div<ChartTypeDropdownMenuProps>`
    position: fixed;
    top: ${(p) => p.$top}px;
    left: ${(p) => p.$left}px;
    min-width: ${(p) => p.$minWidth}px;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
    z-index: 100000;
    padding: 4px;
    box-sizing: border-box;
`;

export const ChartTypeOption = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    box-sizing: border-box;
    border: none;
    background: ${({$active}) => ($active ? 'rgba(120,130,255,0.15)' : 'transparent')};
    cursor: pointer;
    border-radius: 6px;

    &:hover {
        background: rgba(120, 130, 255, 0.25);
    }

    svg {
        width: 22px;
        height: 22px;
    }
`;