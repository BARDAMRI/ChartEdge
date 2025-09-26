import styled from 'styled-components';

export const SettingsToolbarContainer = styled.div.attrs({className: 'settings-toolbar-container'})`
    display: flex;
    flex-direction: row;
    width: 100%;
    background: transparent;
    border-radius: 14px;
    position: relative;
    height: clamp(30px, 6vh, 40px);
    border: 1px solid rgba(128, 140, 255, 0.18);
    box-shadow: 0 10px 28px rgba(17, 19, 39, 0.20),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
    overflow: hidden;
    flex: 0 0 auto;

`;

const Control = styled.div`
    height: 36px;
    border-radius: 10px;
    border: 1px solid transparent;
    background-color: rgba(255, 255, 255, 0.06);
    background-image: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65));
    background-origin: border-box;
    background-clip: padding-box, border-box;
    color: #e7ebff;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
    outline: none;
    transition: box-shadow 160ms ease, background 160ms ease, transform 120ms ease, border-color 160ms ease;

    &:hover {
        background-color: rgba(255, 255, 255, 0.09);
        background-image: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65));
    }

    &:focus-within, &:focus {
        box-shadow: 0 0 0 3px rgba(120, 130, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }
`;
export const SettingToolbarContent = styled.div.attrs({className: 'setting-toolbar-content'})`
    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-start;
    overflow: hidden;
    gap: 2px;
    padding: 1px;
`;

export const SymbolInput = styled(Control).attrs({as: 'input', type: 'text'})`
    width: 70px;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;
    background-color: white;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px 0 16px;

    &::placeholder {
        color: rgba(50, 60, 90, 0.70);
    }
`;


export const ToolbarHorizontalButtons = styled.button.attrs({className: 'toolbar-button'})`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    aspect-ratio: 1 / 1;
    box-sizing: border-box;
    flex: 0 0 auto;
    padding: 0;
    margin: 0;
    overflow: hidden;
    text-align: center;
    font-size: 18px;
    cursor: pointer;
    outline: none;
    border-radius: 12px;
    border: 1px solid rgba(120, 100, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.06);
    background-clip: border-box, padding-box;
    flex: 0 0 auto;
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
        background-color: rgba(255, 255, 255, 0.09);
        background-image: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65));
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 3px 10px rgba(25, 30, 60, 0.22), inset 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    /* Make inner SVG breathe inside the square */

    svg {
        width: 100%;
        height: 100%;
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
