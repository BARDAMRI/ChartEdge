export type LinesStyle = 'solid' | 'dashed' | 'dotted';

export interface OverlayOptions {
    lineColor: string;
    lineWidth: number;
    lineStyle: LinesStyle;
}

export interface OverlayWithCalc extends OverlayOptions {
    calc: OverlayCalcSpec;
    connectNulls?: boolean;
    useCenterX?: boolean;
}

/**
 * Represents a fully computed overlay series, ready to be drawn on the canvas.
 */
export interface OverlaySeries {
    id?: string;
    source: (number | null)[]; // The array of calculated values, aligned with allIntervals.
    options: OverlayOptions;   // Styling options for the line.
    connectNulls: boolean;     // If true, draw a line over gaps (null values).
    useCenterX: boolean;       // If true, plot points at the center of the candle interval.
}

export type OverlayPriceKey = 'close' | 'open' | 'high' | 'low';
export type OverlayKind =
    | 'sma'
    | 'ema'
    | 'wma'
    | 'vwap'
    | 'bbands_mid'
    | 'bbands_upper'
    | 'bbands_lower';

export type OverlayCalcSpec =
    | { kind: OverlayPriceKey }
    | { kind: 'sma' | 'ema' | 'wma'; period: number; price?: OverlayPriceKey }
    | { kind: 'vwap' }
    | { kind: 'bbands_mid'; period: number; price?: OverlayPriceKey }
    | { kind: 'bbands_upper'; period: number; stddev?: number; price?: OverlayPriceKey }
    | { kind: 'bbands_lower'; period: number; stddev?: number; price?: OverlayPriceKey }

