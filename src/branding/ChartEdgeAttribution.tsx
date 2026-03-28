import React from 'react';
import styled from 'styled-components';
import {ChartEdgeMark, type ChartEdgeThemeVariant} from './ChartEdgeMark';

const Bar = styled.div<{$variant: ChartEdgeThemeVariant}>`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 8px;
    padding: 4px 8px 6px;
    min-height: 0;
    border-top: 1px solid
        ${({$variant}) => ($variant === 'dark' ? 'rgba(240, 246, 252, 0.12)' : 'rgba(31, 35, 38, 0.12)')};
    background: ${({$variant}) => ($variant === 'dark' ? 'rgba(1, 4, 9, 0.35)' : 'rgba(255, 255, 255, 0.65)')};
    backdrop-filter: blur(6px);
    box-sizing: border-box;
`;

const Meta = styled.span<{$variant: ChartEdgeThemeVariant}>`
    font-size: 10px;
    line-height: 1.2;
    color: ${({$variant}) => ($variant === 'dark' ? '#8b949e' : '#656d76')};
    font-family: system-ui, -apple-system, Segoe UI, sans-serif;
    max-width: 200px;
    text-align: right;
`;

export type ChartEdgeAttributionProps = {
    themeVariant: ChartEdgeThemeVariant;
    /** e.g. product label shown next to the mark */
    productLabel?: string;
    className?: string;
};

/**
 * Footer attribution for embedded charts (copyright + brand mark). Theme-aware.
 */
export function ChartEdgeAttribution({themeVariant, productLabel, className}: ChartEdgeAttributionProps) {
    const markVariant = themeVariant === 'dark' ? 'dark' : 'light';
    return (
        <Bar $variant={markVariant} className={className} data-chartedge-attribution>
            {productLabel ? <Meta $variant={markVariant}>{productLabel}</Meta> : null}
            <ChartEdgeMark variant={markVariant} height={22} aria-hidden />
        </Bar>
    );
}
