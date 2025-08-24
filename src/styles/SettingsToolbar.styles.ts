import styled from 'styled-components';

export const SettingsToolbarContainer = styled.div.attrs({className: 'settings-toolbar-container'})`
    box-sizing: border-box;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 2px;
    /* Transparent surface with subtle frame and depth (matches Toolbar) */
    background: transparent;
    border-radius: 12px;
    border: 1px solid rgba(128, 140, 255, 0.18);
    box-shadow: 0 10px 28px rgba(17, 19, 39, 0.10),
    inset 0 0 0 1px rgba(255, 255, 255, 0.10);
`;

const Control = styled.div`
    height: 36px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.06) padding-box,
    linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65)) border-box;
    background-clip: padding-box, border-box;
    color: #e7ebff;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
    outline: none;
    transition: box-shadow 160ms ease, background 160ms ease, transform 120ms ease, border-color 160ms ease;

    &:hover {
        background: rgba(255, 255, 255, 0.09) padding-box,
        linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65)) border-box;
    }

    &:focus-within, &:focus {
        box-shadow: 0 0 0 3px rgba(120, 130, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }
`;

export const SymbolField = styled.div.attrs({className: 'settings-symbol-field'})`
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 1 260px;
`;

export const LeadingIcon = styled.div`
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    pointer-events: none;

    svg {
        width: 16px;
        height: 16px;
        opacity: 0.85;
    }
`;

export const ClearButton = styled.button`
    position: absolute;
    right: 6px;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    border: none;
    background: transparent;
    color: rgba(30, 40, 80, 0.55);
    cursor: pointer;

    &:hover {
        color: rgba(30, 40, 80, 0.85);
    }
`;

export const Segmented = styled.div.attrs({className: 'settings-segmented'})`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.06) padding-box,
    linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65)) border-box;
    background-clip: padding-box, border-box;
`;

export const SegBtn = styled.button<{ $active?: boolean }>`
    height: 30px;
    min-width: 38px;
    padding: 0 10px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: ${({$active}) => $active
            ? 'linear-gradient(180deg, rgba(110,175,255,0.35), rgba(140,125,255,0.35))'
            : 'transparent'};
    color: #26304f;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 160ms ease, box-shadow 160ms ease, transform 120ms ease;

    &:hover {
        background: ${({$active}) => $active ? 'linear-gradient(180deg, rgba(110,175,255,0.45), rgba(140,125,255,0.45))' : 'rgba(255,255,255,0.10)'};
    }
`;

export const SymbolInput = styled(Control).attrs({as: 'input', type: 'text'})`
    flex: 0 1 150px;
    padding: 0 12px 0 34px; /* room for clear button (right) and icon (left) */
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;

    &::placeholder {
        color: rgba(50, 60, 90, 0.70);
    }
`;

export const ChartTypeSelect = styled(Control).attrs({className: 'settings-charttype-select', as: 'select'})`
    flex: 0 0 150px;
    padding: 0 5px;
    font-size: 13px;
    appearance: none;
    background-image: linear-gradient(180deg, rgba(62, 197, 255, 0.65), rgba(90, 72, 222, 0.65)),
    linear-gradient(45deg, transparent 50%, rgba(231, 235, 255, 0.85) 50%),
    linear-gradient(135deg, rgba(231, 235, 255, 0.85) 50%, transparent 50%);
    background-origin: border-box, content-box, content-box;
    background-clip: border-box, content-box, content-box;
    background-position: right 12px center, right 6px center, right 6px center;
    background-size: auto, 6px 6px, 6px 6px;
    background-repeat: no-repeat;
`;


export const ToolbarHorizontalButtons = styled.button.attrs({className: 'toolbar-button'})`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    aspect-ratio: 1 / 1;
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

    /* Make inner SVG breathe inside the square */

    svg {
        width: 70%;
        height: 70%;
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
