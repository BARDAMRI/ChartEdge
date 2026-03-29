import React from 'react';
import styled from 'styled-components';
import {TickUpMark, type TickUpThemeVariant} from './TickUpMark';

const Bar = styled.div<{$variant: TickUpThemeVariant}>`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 8px;
    padding: 4px 8px 6px;
    min-height: 0;
    border-top: 1px solid
        ${({$variant}) =>
            $variant === 'dark'
                ? 'rgba(240, 246, 252, 0.12)'
                : $variant === 'grey'
                  ? 'rgba(110, 118, 129, 0.4)'
                  : 'rgba(31, 35, 38, 0.12)'};
    background: ${({$variant}) =>
        $variant === 'dark'
            ? 'rgba(1, 4, 9, 0.35)'
            : $variant === 'grey'
              ? 'rgba(34, 39, 46, 0.55)'
              : 'rgba(255, 255, 255, 0.65)'};
    backdrop-filter: blur(6px);
    box-sizing: border-box;
`;

const Meta = styled.span<{$variant: TickUpThemeVariant}>`
    font-size: 10px;
    line-height: 1.2;
    color: ${({$variant}) =>
        $variant === 'dark' || $variant === 'grey' ? '#8b949e' : '#656d76'};
    font-family: system-ui, -apple-system, Segoe UI, sans-serif;
    max-width: 200px;
    text-align: right;
`;

export type TickUpAttributionProps = {
    themeVariant: TickUpThemeVariant;
    /** e.g. product label shown next to the mark */
    productLabel?: string;
    className?: string;
};

/**
 * Footer attribution for embedded charts (copyright + brand mark). Theme-aware.
 */
export function TickUpAttribution({themeVariant, productLabel, className}: TickUpAttributionProps) {
    return (
        <Bar $variant={themeVariant} className={className} data-tickup-attribution>
            {productLabel ? <Meta $variant={themeVariant}>{productLabel}</Meta> : null}
            <TickUpMark variant={themeVariant} height={22} aria-hidden />
        </Bar>
    );
}
