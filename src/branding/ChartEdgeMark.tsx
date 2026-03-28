import React from 'react';

export type ChartEdgeThemeVariant = 'light' | 'dark';

type ChartEdgeMarkProps = {
    variant: ChartEdgeThemeVariant;
    /** Total height in px */
    height?: number;
    className?: string;
    'aria-hidden'?: boolean;
};

/**
 * Optional DOM wordmark (e.g. marketing). Default charts use the bundled SVG marks in the canvas watermark instead.
 */
export function ChartEdgeMark({variant, height = 20, className, 'aria-hidden': ariaHidden = true}: ChartEdgeMarkProps) {
    const isDarkBg = variant === 'dark';
    const ink = isDarkBg ? '#e6edf3' : '#1f2328';
    const accent = isDarkBg ? '#58a6ff' : '#0969da';
    const muted = isDarkBg ? '#8b949e' : '#656d76';
    const w = Math.round(height * 5.4);

    return (
        <svg
            className={className}
            width={w}
            height={height}
            viewBox="0 0 200 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden={ariaHidden}
            role="img"
        >
            <title>ChartEdge</title>
            {/* Spark / edge glyph */}
            <path
                d="M2 16V6h2.2l3.3 5.5L11 6h2.2v10h-2v-6.2L8.2 15h-1.2L4.1 9.8V16H2z"
                fill={accent}
            />
            <path d="M14 6h2v10h-2V6z" fill={accent} opacity={0.85} />
            <text
                x="20"
                y="16"
                fill={ink}
                style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
                }}
            >
                ChartEdge
            </text>
            <text
                x="20"
                y="21"
                fill={muted}
                style={{
                    fontSize: '5.5px',
                    fontWeight: 500,
                    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
                    letterSpacing: '0.04em',
                }}
            >
                © {new Date().getFullYear()}
            </text>
        </svg>
    );
}
