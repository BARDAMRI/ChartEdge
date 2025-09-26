import React from 'react';

/**
 * IconBase — a clean, scalable SVG wrapper that fills its container
 * - No hardcoded pixels; uses 100%/100% so the parent controls size
 * - preserveAspectRatio keeps shapes undistorted
 * - vector-effect keeps stroke widths readable across scales
 */
export const IconBase: React.FC<{ active?: boolean; name: string; children: React.ReactNode }> = ({
                                                                                                      active,
                                                                                                      name,
                                                                                                      children
                                                                                                  }) => {
    const gradId = React.useId();
    const glowId = React.useId();
    return (
        <svg
            className={`icon-${name}`}
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={active ? '#3EC5FF' : '#2979FF'}/>
                    <stop offset="60%" stopColor={active ? '#6A5ACD' : '#4B32C3'}/>
                    <stop offset="100%" stopColor={active ? '#8A2BE2' : '#5B3FFF'}/>
                </linearGradient>
                <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#6A5ACD"
                                  floodOpacity={active ? '0.65' : '0'}/>
                </filter>
            </defs>

            {/* Foreground strokes, with inner padding so paths don't hug the edges */}
            <g stroke={`url(#${gradId})`} filter={`url(#${glowId})`} transform="translate(2,2) scale(0.8333)">
                {/* Keep strokes readable on small sizes */}
                <style>{`*{vector-effect:non-scaling-stroke}`}</style>
                {children}
            </g>
        </svg>
    );
};

// Stroke endTime tokens for consistency
const SW = {
    thick: 1.8,
    medium: 1.3,
    thin: 1.0,
} as const;

/* =========================
 *  SHAPE / DRAWING ICONS
 * ========================= */

export const IconLine: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="line">
        <path d="M4 16.5 L14.5 9.5 L20 6" strokeWidth={SW.thick}/>
        <circle cx="4" cy="16.5" r="1.2" fill="currentColor"/>
        <circle cx="14.5" cy="9.5" r="1.2" fill="currentColor"/>
        <circle cx="20" cy="6" r="1.2" fill="currentColor"/>
    </IconBase>
);

export const IconRect: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="rectangle">
        <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" strokeWidth={SW.thick}/>
        <line x1="8" y1="9.5" x2="16" y2="9.5" strokeWidth={SW.thin} opacity={0.8}/>
        <line x1="8" y1="14.5" x2="16" y2="14.5" strokeWidth={SW.thin} opacity={0.8}/>
    </IconBase>
);

export const IconCircle: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="circle">
        <circle cx="12" cy="12" r="7" strokeWidth={SW.thick}/>
        <polyline points="12,5 12,12 16.5,12" strokeWidth={SW.medium} opacity={0.9}/>
    </IconBase>
);

export const IconTriangle: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="triangle">
        <polygon points="12,4.5 19,18 5,18" fill="none" strokeWidth={SW.medium}/>
        <polygon points="12,9.5 15,15 9,15" fill="none" strokeWidth={SW.thin} opacity={0.85}/>
    </IconBase>
);

export const IconAngle: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="angle">
        <polyline points="5,18 12,6 19,18" strokeWidth={SW.thick}/>
        <path d="M12 6 A6.5 6.5 0 0 1 18 12.5" strokeWidth={SW.thin} opacity={0.9}/>
    </IconBase>
);

export const IconSelect: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="select">
        <polygon points="7,4 17,12 12,13 11,18" fill="none" strokeWidth={SW.thick}/>
        <line x1="12.2" y1="13" x2="16.5" y2="17.3" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconPencil: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="pencil">
        <polygon points="4,16.8 7.2,20 20,7.2 16.8,4" fill="none" strokeWidth={SW.thick}/>
        <line x1="14.2" y1="6.6" x2="17.4" y2="9.8" strokeWidth={SW.medium}/>
    </IconBase>
);

/* =========================
 *  SETTINGS / UTILITY ICONS
 * ========================= */

export const IconGear: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="gear">
        {/* gear ring */}
        <circle cx="12" cy="12" r="5.3" strokeWidth={SW.thick}/>
        {/* spokes */}
        <line x1="12" y1="5.5" x2="12" y2="7.2" strokeWidth={SW.medium}/>
        <line x1="12" y1="16.8" x2="12" y2="18.5" strokeWidth={SW.medium}/>
        <line x1="5.5" y1="12" x2="7.2" y2="12" strokeWidth={SW.medium}/>
        <line x1="16.8" y1="12" x2="18.5" y2="12" strokeWidth={SW.medium}/>
        <line x1="7.7" y1="7.7" x2="9.0" y2="9.0" strokeWidth={SW.medium}/>
        <line x1="15.0" y1="15.0" x2="16.3" y2="16.3" strokeWidth={SW.medium}/>
        <line x1="15.0" y1="9.0" x2="16.3" y2="7.7" strokeWidth={SW.medium}/>
        <line x1="7.7" y1="16.3" x2="9.0" y2="15.0" strokeWidth={SW.medium}/>
        {/* hub */}
        <circle cx="12" cy="12" r="2.0" strokeWidth={SW.thin}/>
    </IconBase>
);

export const IconCamera: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="camera">
        {/* body */}
        <rect x="3.5" y="6.5" width="17" height="11" rx="2.5" strokeWidth={SW.thick}/>
        {/* top hump */}
        <path d="M8 6.5 L10 4.5 H14 L16 6.5" strokeWidth={SW.medium}/>
        {/* lens */}
        <circle cx="12" cy="12" r="3.2" strokeWidth={SW.thick}/>
        <circle cx="12" cy="12" r="1.2" strokeWidth={SW.thin} opacity={0.9}/>
        {/* flash dot */}
        <circle cx="6.2" cy="9.2" r="0.7" strokeWidth={SW.thin}/>
    </IconBase>
);

export const IconSearch: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="search">
        <circle cx="10.5" cy="10.5" r="4.8" strokeWidth={SW.thick}/>
        <line x1="14.2" y1="14.2" x2="19" y2="19" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconRange: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="range">
        {/* brackets */}
        <path d="M6 7 L6 17 M18 7 L18 17" strokeWidth={SW.thick}/>
        {/* arrows up/down */}
        <polyline points="9.5,9.5 12,7.8 14.5,9.5" strokeWidth={SW.medium}/>
        <polyline points="9.5,14.5 12,16.2 14.5,14.5" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconDownload: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="download">
        <path d="M12 5 L12 14" strokeWidth={SW.thick}/>
        <polyline points="8.5,11.5 12,15 15.5,11.5" strokeWidth={SW.thick}/>
        <rect x="5" y="16" width="14" height="2" rx="1" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconRefresh: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="refresh">
        <path d="M7.5 8.5 A5.5 5.5 0 1 1 8 18" strokeWidth={SW.thick}/>
        <polyline points="7.5,5.5 7.5,8.8 4.5,8.8" strokeWidth={SW.medium}/>
    </IconBase>
);

export const IconTheme: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="theme">
        {/* crescent moon */}
        <path d="M14.8 6.2 A6.8 6.8 0 1 0 18 16.2 A5.0 5.0 0 1 1 14.8 6.2" strokeWidth={SW.thick}/>
        {/* tiny stars */}
        <circle cx="16.8" cy="7.2" r="0.6" strokeWidth={SW.thin}/>
        <circle cx="17.6" cy="9.4" r="0.5" strokeWidth={SW.thin}/>
    </IconBase>
);

/* =========================
 *  CHART TYPE ICONS
 * ========================= */

export const IconChartLine: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="chart-line">
        <polyline points="4,16 10,10 16,14 20,6" strokeWidth={SW.thick}/>
        <circle cx="4" cy="16" r="1" fill="currentColor"/>
        <circle cx="10" cy="10" r="1" fill="currentColor"/>
        <circle cx="16" cy="14" r="1" fill="currentColor"/>
        <circle cx="20" cy="6" r="1" fill="currentColor"/>
    </IconBase>
);

export const IconChartBar: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="chart-bar">
        <rect x="5" y="10" width="3" height="8" strokeWidth={SW.thick}/>
        <rect x="11" y="7" width="3" height="11" strokeWidth={SW.thick}/>
        <rect x="17" y="4" width="3" height="14" strokeWidth={SW.thick}/>
    </IconBase>
);

export const IconChartCandle: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="chart-candle">
        {/* Left candle */}
        <line x1="8" y1="5" x2="8" y2="19" strokeWidth={SW.thin}/>
        <rect x="6" y="9" width="4" height="6" strokeWidth={SW.thick}/>
        <line x1="8" y1="9" x2="8" y2="15" strokeWidth={SW.thin}/>
        {/* add center wick inside the rectangle */}
        <line x1="8" y1="9" x2="8" y2="15" strokeWidth={SW.thin}/>

        {/* Right candle */}
        <line x1="16" y1="5" x2="16" y2="19" strokeWidth={SW.thin}/>
        <rect x="14" y="7" width="4" height="10" strokeWidth={SW.thick}/>
        <line x1="16" y1="7" x2="16" y2="17" strokeWidth={SW.thin}/>
        {/* add center wick inside the rectangle */}
        <line x1="16" y1="7" x2="16" y2="17" strokeWidth={SW.thin}/>
    </IconBase>
);

export const IconChartArea: React.FC<{ active?: boolean }> = ({active}) => (
    <IconBase active={active} name="chart-area">
        <path d="M4,16 L8,10 L14,14 L20,8 L20,20 L4,20 Z"
              strokeWidth={SW.thick}
              fill="currentColor"
              fillOpacity={0.2}/>
        <polyline points="4,16 8,10 14,14 20,8" strokeWidth={SW.thick}/>
    </IconBase>
);


/* =========================
 *  DROPDOWN / ARROW ICONS
 * ========================= */

export const IconArrowDown: React.FC<{ active?: boolean }> = ({active}) => {
    const gradId = React.useId();
    return (
        <svg
            className="icon-arrow-down"
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={active ? '#3EC5FF' : '#2979FF'}/>
                    <stop offset="60%" stopColor={active ? '#6A5ACD' : '#4B32C3'}/>
                    <stop offset="100%" stopColor={active ? '#8A2BE2' : '#5B3FFF'}/>
                </linearGradient>
            </defs>
            <polyline points="6,9 12,15 18,9" stroke={`url(#${gradId})`} strokeWidth="2"/>
        </svg>
    );
};
