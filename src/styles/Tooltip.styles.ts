import styled, {css} from 'styled-components';
import {Placement} from '../types/buttons';

export const TooltipWrapper = styled.span.attrs({className: 'tooltip-wrapper'})`
    position: relative;
    display: contents;
`;

/** Light theme tokens (defaults) */
const bgGradLight =
    'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.96) 100%)';
const borderColorLight = 'rgba(123, 97, 255, 0.35)';
const textColorLight = '#1e2a44';
const shadowLight =
    '0 8px 24px rgba(17,19,39,0.18), inset 0 1px 0 rgba(255,255,255,0.45)';

/** Dark theme tokens */
const bgGradDark =
    'linear-gradient(180deg, rgba(22,24,36,0.92) 0%, rgba(16,18,30,0.94) 100%)';
const borderColorDark = 'rgba(160, 170, 255, 0.40)';
const textColorDark = 'rgba(235,240,255,0.92)';
const shadowDark =
    '0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)';

export const TooltipBox = styled.span<{
    left: number;
    top: number;
    $transformCss: string;
    $bg: string;
    $border: string;
    $text: string;
    $shadow: string;
}>`
    position: fixed;
    z-index: 1000;
    padding: 2px 3px;
    border-radius: 10px;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    color: ${({$text}) => $text || textColorLight};
    background: ${({$bg}) => $bg || bgGradLight};
    border: 1px solid ${({$border}) => $border || borderColorLight};
    box-shadow: ${({$shadow}) => $shadow || shadowLight};
    backdrop-filter: blur(6px);
    pointer-events: none;

    left: ${({left}) => left}px;
    top: ${({top}) => top}px;
    transform: ${({$transformCss}) => $transformCss};
`;


export const TooltipArrow = styled.span<{
    $placement: Placement;
    $size: number;
    $bg: string;
    $border: string;
    $shadow: string;
}>`
    position: absolute;
    width: ${({$size}) => $size}px;
    height: ${({$size}) => $size}px;
    background: ${({$bg}) => $bg || bgGradLight};
    box-shadow: ${({$shadow}) => $shadow || shadowLight};
    pointer-events: none;
    transform: rotate(45deg);

    ${({$placement, $size, $border}) => {
        const borderCss = $border || borderColorLight;
        const half = $size / 2;
        switch ($placement) {
            case Placement.bottom:
                return css`
                    top: -${half}px;
                    left: 50%;
                    transform: translateX(-50%) rotate(45deg);
                    border-left: 1px solid ${borderCss};
                    border-top: 1px solid ${borderCss};
                `;
            case Placement.top:
                return css`
                    bottom: -${half}px;
                    left: 50%;
                    transform: translateX(-50%) rotate(45deg);
                    border-right: 1px solid ${borderCss};
                    border-bottom: 1px solid ${borderCss};
                `;
            case Placement.left:
                return css`
                    right: -${half}px;
                    top: 50%;
                    transform: translateY(-50%) rotate(45deg);
                    border-right: 1px solid ${borderCss};
                    border-top: 1px solid ${borderCss};
                `;
            case Placement.right:
                return css`
                    left: -${half}px;
                    top: 50%;
                    transform: translateY(-50%) rotate(45deg);
                    border-left: 1px solid ${borderCss};
                    border-bottom: 1px solid ${borderCss};
                `;
        }
    }}
`;