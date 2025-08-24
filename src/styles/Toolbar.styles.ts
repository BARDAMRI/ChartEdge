import styled from 'styled-components';

export const ToolbarContainer = styled.div.attrs({className: 'toolbar-container'})`
    box-sizing: border-box;
    width: 40px;
    min-width: 40px;
    max-width: 40px;
    flex: 0 0 40px;
    display: flex;
    flex-direction: column;
    height: 100%;

    /* Transparent surface with subtle frame and depth */
    background: transparent;
    border-radius: 14px;
    position: relative;

    /* soft frame */
    border: 1px solid rgba(128, 140, 255, 0.18);
    box-shadow: 0 10px 28px rgba(17, 19, 39, 0.20),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
`;

export const ToolbarContent = styled.div.attrs({className: 'toolbar-content'})`
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    grid-template-columns: 1fr;
    grid-auto-rows: 1fr;
    gap: 2px;
    padding: 1px;
    align-content: start;
    justify-items: stretch;
    overflow: hidden;
`;

interface ToolbarButtonProps {
    $selected?: boolean;
}

export const ToolbarVerticalButton = styled.button.attrs({className: 'toolbar-button'})<ToolbarButtonProps>`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1 / 1;
    flex: 0 0 auto; /* keep height from aspect-ratio; don't grow vertically */
    padding: 0;
    margin: 0;
    overflow: hidden;
    text-align: center;
    font-size: 18px;
    cursor: pointer;
    outline: none;
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    transition: transform 140ms ease, box-shadow 200ms ease, background 200ms ease, opacity 200ms ease;

    /* Gradient border using mask */

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        padding: 1px; /* border thickness */
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65));
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
    }

    /* Inner glass */

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        background: radial-gradient(120% 120% at 30% 0%, rgba(255, 255, 255, 0.20) 0%, rgba(112, 124, 255, 0.08) 50%, rgba(32, 40, 78, 0.18) 100%);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
        opacity: 0.9;
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(25, 30, 60, 0.25);
        background: rgba(255, 255, 255, 0.09);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 3px 10px rgba(25, 30, 60, 0.22), inset 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    ${({$selected}) => $selected && `
        box-shadow: 0 10px 28px rgba(80, 90, 220, 0.35), 0 0 0 3px rgba(120, 130, 255, 0.28);
        &::after { opacity: 1; }
    `}
        /* Make inner SVG breathe inside the square */
    svg {
        width: calc(100% - 12px);
        height: calc(100% - 12px);
        display: block;
    }

    /* keep strokes readable on small sizes */

    svg * {
        vector-effect: non-scaling-stroke;
    }

    /* Icon background reacts on states */

    &:hover svg .icon-bg {
        fill: rgba(180, 200, 255, 0.30);
        stroke: rgba(120, 100, 255, 0.60);
    }
`;
