import styled, {css} from 'styled-components';
import {Placement} from '../types/buttons';

export const TooltipWrapper = styled.span.attrs({className: 'tooltip-wrapper'})`
    position: relative;
    display: inline-block;
`;

const bgGradLight =
    'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.96) 100%)';
const borderColorLight = 'rgba(123, 97, 255, 0.35)';
const textColorLight = '#1e2a44';
const shadowLight = '0 8px 24px rgba(17,19,39,0.18), inset 0 1px 0 rgba(255,255,255,0.45)';

export const TooltipBox = styled.span<{
    $left: number;
    $top: number;
    $transformCss: string;
    $bg: string;
    $border: string;
    $text: string;
    $shadow: string;
    $placement: Placement;
    $arrowSize?: number;
}>`
    position: fixed;
    z-index: 1000;
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    ${({$placement}) =>
            $placement === Placement.left && css`padding-left: 14px;`}
    ${({$placement}) =>
            $placement === Placement.right && css`padding-right: 14px;`}
    /* For top and bottom, keep original vertical padding only (6px), no extra logic */
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
    left: ${({$left}) => $left}px;
    top: ${({$top}) => $top}px;
    transform: ${({$transformCss}) => $transformCss};
`;


export const TooltipArrow = styled.span<{
    $placement: Placement;
    $size: number;
    $bg: string;
    $border: string;
    $shadow: string;
    $anchorX?: number;
    $anchorY?: number;
}>`
    position: absolute;
    width: ${({$size}) => $size}px;
    height: ${({$size}) => $size}px;
    background: ${({$bg}) => $bg || bgGradLight};
    box-shadow: ${({$shadow}) => $shadow || shadowLight};
    pointer-events: none;
    transform: rotate(45deg);

    ${({$placement, $size, $border, $anchorX, $anchorY}) => {
        const borderCss = $border || borderColorLight;
        const half = $size / 2;
        switch ($placement) {
            case Placement.bottom:
                return css`
                    top: -${half}px;
                    left: ${$anchorX == null ? '50%' : `${$anchorX}px`};
                    transform: translateX(-50%) rotate(45deg);
                    border-left: 1px solid ${borderCss};
                    border-top: 1px solid ${borderCss};
                `;
            case Placement.top:
                return css`
                    bottom: -${half}px;
                    left: ${$anchorX == null ? '50%' : `${$anchorX}px`};
                    transform: translateX(-50%) rotate(45deg);
                    border-right: 1px solid ${borderCss};
                    border-bottom: 1px solid ${borderCss};
                `;
            case Placement.left:
                return css`
                    right: -${half}px;
                    top: ${$anchorY == null ? '50%' : `${$anchorY}px`};
                    transform: translateY(-50%) rotate(45deg);
                    border-right: 1px solid ${borderCss};
                    border-top: 1px solid ${borderCss};
                `;
            case Placement.right:
                return css`
                    left: -${half}px;
                    top: ${$anchorY == null ? '50%' : `${$anchorY}px`};
                    transform: translateY(-50%) rotate(45deg);
                    border-left: 1px solid ${borderCss};
                    border-bottom: 1px solid ${borderCss};
                `;
            default:
                return css``;
        }
    }}
`;