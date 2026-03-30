import styled, {css} from 'styled-components';

interface PrimeGlassProps {
    $primeGlass?: boolean;
    /** When true with `$primeGlass`, use frosted **light** glass for `base.theme === 'light'` Prime plots. */
    $primeGlassLight?: boolean;
}

export const ToolbarContainer = styled.div.attrs({className: 'toolbar-container'})<PrimeGlassProps>`
    box-sizing: border-box;
    width: clamp(24px, 5vmin, 40px); 
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    max-height: 100%;

    /* Transparent surface with subtle frame and depth */
    background: transparent;
    border-radius: 14px;
    position: relative;

    /* soft frame */
    border: 1px solid rgba(128, 140, 255, 0.18);
    box-shadow: 0 10px 28px rgba(17, 19, 39, 0.20),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);

    ${({$primeGlass, $primeGlassLight}) =>
        $primeGlass &&
        $primeGlassLight &&
        css`
            background: rgba(255, 255, 255, 0.82);
            border: 1px solid rgba(90, 72, 222, 0.22);
            box-shadow:
                0 10px 28px rgba(15, 23, 42, 0.08),
                inset 0 0 0 1px rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);

            & .vertical-toolbar-button {
                border: 1px solid rgba(90, 72, 222, 0.28);
                background-color: rgba(255, 255, 255, 0.55);

                &::after {
                    background: radial-gradient(
                        120% 120% at 30% 0%,
                        rgba(255, 255, 255, 0.95) 0%,
                        rgba(62, 197, 255, 0.12) 52%,
                        rgba(90, 72, 222, 0.08) 100%
                    );
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
                }

                &:hover {
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
                    background-color: rgba(255, 255, 255, 0.78);
                    background-image: linear-gradient(
                        180deg,
                        rgba(62, 197, 255, 0.4),
                        rgba(90, 72, 222, 0.38)
                    );
                }

                &:hover svg {
                    fill: rgba(90, 72, 222, 0.35);
                    stroke: rgba(2, 132, 199, 0.65);
                }
            }
        `}

    ${({$primeGlass, $primeGlassLight}) =>
        $primeGlass &&
        !$primeGlassLight &&
        css`
            background: rgba(15, 18, 25, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        `}
`;

export const ToolbarContent = styled.div.attrs({className: 'toolbar-content'})`
    box-sizing: border-box;
    width: 100%;
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    overflow-y: auto;
    min-height: 0;
    gap: 2px;
    padding: 1px;
    
    /* Hide scrollbars but allow scrolling */
    /* Hide scrollbars but allow scrolling */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
    }

    & > * {
        flex-shrink: 0;
    }

    & .tooltip-wrapper {
        width: 100%;
    }
`;

interface ToolbarButtonProps {
    $selected?: boolean;
}

export const ToolbarVerticalButton = styled.button.attrs({className: 'vertical-toolbar-button'})<ToolbarButtonProps>`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1 / 1;
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

    ${({$selected}) => $selected && `
        box-shadow: 0 10px 28px rgba(80, 90, 220, 0.35), 0 0 0 3px rgba(120, 130, 255, 0.28);
        &::after { opacity: 1; }
    `}
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

    &:hover svg {
        fill: rgba(180, 200, 255, 0.30);
        stroke: rgba(120, 100, 255, 0.60);
    }
`;
