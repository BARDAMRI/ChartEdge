import styled, {css} from 'styled-components';

interface CanvasContainerProps {
    $heightPrecent: number;
    $zIndex?: number;
}


interface CanvasContainerProps {
    $heightPrecent: number;
    $zIndex?: number;
}

export const StyledCanvasNonResponsive = styled.canvas<CanvasContainerProps>`
    display: block;
    width: 100% !important;
    padding: 0;
    margin: 0;
    background-color: transparent;
    border: none;
    touch-action: none;
    overscroll-behavior: none;
    font-size: 12px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: ${({$zIndex}) => ($zIndex !== undefined ? $zIndex : 0)};
    pointer-events: none;

    height: ${({$heightPrecent}) => ($heightPrecent ? `${$heightPrecent}%` : '100%')} !important;

    top: ${({$heightPrecent}) => ($heightPrecent === 100 ? '0' : 'auto')};
`;

export const StyledCanvasResponsive = styled.canvas<CanvasContainerProps>`
    display: block;
    width: 100% !important;
    padding: 0;
    margin: 0;
    background-color: transparent;
    border: none;
    touch-action: none;
    overscroll-behavior: none;
    font-size: 12px;
    position: absolute;
    z-index: ${({$zIndex}) => ($zIndex !== undefined ? $zIndex : 0)};
    pointer-events: auto;

    top: 0;
    left: 0;
    right: 0;

    height: 100% !important;
    bottom: 0;
`;

interface InnerCanvasContainerProps {
    $xAxisHeight: number;
}

export const InnerCanvasContainer = styled.div<InnerCanvasContainerProps>`
    position: relative;
    width: 100%;
    height: 100%;
`;
export const ChartingContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100%;
`;

interface HoverTooltipProps {
    $isPositive: boolean;
    $isRTL?: boolean;
    /** Candle tooltip panel: use dark panel + light text when chart theme is dark */
    $variant?: 'light' | 'dark';
    /** Tighter grid + wrap so OHLC fits on small chart areas */
    $compact?: boolean;
}

export const HoverTooltip = styled.div<HoverTooltipProps>`
    position: absolute;
    bottom: 5px;
    ${props => props.$isRTL ? 'left' : 'right'}: 10px;
    opacity: ${({$variant}) => ($variant === 'dark' ? 1 : 0.8)};
    background-color: ${({$variant}) =>
        $variant === 'dark' ? 'rgba(28, 30, 38, 0.96)' : 'rgba(255, 255, 255, 0.4)'};
    padding: 6px 10px;
    color: ${({$isPositive, $variant}) =>
        $variant === 'dark'
            ? '#e8eaef'
            : $isPositive
                ? 'rgba(0,128,0,0.85)'
                : 'rgba(204,0,0,0.85)'};
    border: 1px solid
        ${({$isPositive, $variant}) =>
            $variant === 'dark'
                ? 'rgba(255, 255, 255, 0.14)'
                : $isPositive
                    ? 'rgba(0,128,0,0.8)'
                    : 'rgba(204,0,0,0.8)'};
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 50;
    white-space: normal;
    word-break: break-word;
    box-shadow: ${({$variant}) =>
        $variant === 'dark'
            ? '0 6px 20px rgba(0, 0, 0, 0.45)'
            : '0 4px 12px rgba(0, 0, 0, 0.15)'};
    pointer-events: none;
    direction: ${props => props.$isRTL ? 'rtl' : 'ltr'};
    backdrop-filter: blur(4px);

    max-width: calc(100% - 20px);
    max-height: min(42vh, 220px);
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    /* Responsive font size */
    font-size: clamp(8px, 2vmin, 12px);
    padding: clamp(2px, 1vmin, 6px) clamp(4px, 1.5vmin, 10px);

    ${({$compact}) =>
        $compact &&
        css`
            gap: 2px;
            font-size: clamp(7px, 1.85vmin, 11px);
            padding: 4px 6px;
        `}
    
    @media (max-width: 400px), (max-height: 300px) {
        opacity: 0.95;
        background-color: ${({$variant}) =>
            $variant === 'dark' ? 'rgba(28, 30, 38, 0.98)' : 'rgba(255, 255, 255, 0.95)'};
    }
`;
