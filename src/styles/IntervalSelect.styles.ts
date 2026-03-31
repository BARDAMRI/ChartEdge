import styled from 'styled-components';

export const IntervalSelectContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

export const IntervalTrigger = styled.div<{ $active?: boolean; $isDark?: boolean }>`
    display: flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid ${props => props.$isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
    background: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.$isDark ? '#e7f0ff' : '#1e1e1e'};
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
        background: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'};
        border-color: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'};
    }

    svg {
        width: 10px;
        height: 10px;
        opacity: 0.6;
    }
`;

export const IntervalDropdown = styled.div<{
    $top: number;
    $left: number;
    $width: number;
    $maxHeight: number;
    $isDark?: boolean;
}>`
    position: fixed;
    top: ${props => props.$top}px;
    left: ${props => props.$left}px;
    width: ${props => props.$width}px;
    max-width: min(440px, 95vw);
    max-height: ${props => props.$maxHeight}px;
    overflow-y: auto;
    z-index: 10000;
    background: ${props => props.$isDark ? 'rgba(26, 29, 35, 0.94)' : 'rgba(255, 255, 255, 0.98)'};
    backdrop-filter: blur(16px);
    border: 1px solid ${props => props.$isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)'};
    border-radius: 12px;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 10px 20px -10px rgba(0, 0, 0, 0.2);
    padding: 10px;
    animation: fadeIn 0.2s cubic-bezier(0, 0, 0.2, 1);

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }
    &::-webkit-scrollbar-thumb {
        background: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        border-radius: 10px;
    }
`;

export const IntervalSection = styled.div<{ $isDark?: boolean }>`
    margin: 12px 0;
    
    &:first-child { margin-top: 0; }
    
    display: grid;
    grid-template-columns: 92px 1fr;
    column-gap: 12px;
    align-items: start;
`;

export const IntervalSectionLabel = styled.div<{ $isDark?: boolean }>`
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 6px 4px 0;
    color: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'};
    white-space: nowrap;
`;

export const IntervalOptionsGrid = styled.div<{ $cols?: 1 | 2 | 3 | 4 }>`
    display: grid;
    grid-template-columns: repeat(${props => props.$cols ?? 4}, minmax(44px, 1fr));
    gap: 6px;
    align-content: start;
    justify-content: start;
`;

export const IntervalOption = styled.button<{ $active?: boolean; $isDark?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    min-width: 44px;
    height: 28px;
    border: 1px solid ${props => {
        if (props.$active) return props.$isDark ? 'rgba(62, 197, 255, 0.5)' : 'rgba(37, 99, 235, 0.5)';
        return 'transparent';
    }};
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    color: ${props => {
        if (props.$active) return props.$isDark ? '#3ec5ff' : '#2563eb';
        return props.$isDark ? '#94a3b8' : '#64748b';
    }};
    background: ${props => {
        if (props.$active) return props.$isDark ? 'rgba(62, 197, 255, 0.15)' : 'rgba(37, 99, 235, 0.1)';
        return props.$isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
    }};
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;

    &:hover {
        background: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)'};
        color: ${props => props.$isDark ? '#f8fafc' : '#1e293b'};
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
        background: ${props => props.$isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
    }
`;
