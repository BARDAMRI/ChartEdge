import styled, {css} from 'styled-components';

export const RangeSelectorContainer = styled.div<{ $isDark: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding: 4px 12px;
    gap: 8px;
    border-top: 1px solid ${props => props.$isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
    background: transparent;
    overflow-x: auto;
    flex-shrink: 0;
    grid-row: 3;
    grid-column: 1 / span 2;
    z-index: 2;

    &::-webkit-scrollbar {
        height: 0;
    }
`;

export const RangeButton = styled.button<{ $active?: boolean; $isDark: boolean }>`
    background: transparent;
    border: 1px solid transparent;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    color: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.55)'};
    transition: all 120ms ease;
    white-space: nowrap;

    &:hover {
        background: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        color: ${props => props.$isDark ? '#fff' : '#000'};
    }

    ${props => props.$active && css`
        color: #3ec5ff !important;
        background: rgba(62, 197, 255, 0.12) !important;
    `}
`;

export const RangeLabel = styled.span<{ $isDark: boolean }>`
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
    margin-right: 4px;
`;
