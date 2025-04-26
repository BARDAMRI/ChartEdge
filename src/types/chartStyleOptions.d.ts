// chartStyleOptions.ts

// Candles style
export interface CandleStyleOptions {
    upColor?: string;
    downColor?: string;
    borderColor?: string;
    borderWidth?: number;
    bodyWidthFactor?: number;
    spacingFactor?: number;
}

// Grid style
export interface GridStyleOptions {
    gridSpacing?: number;
    lineColor?: string;
    lineWidth?: number;
    lineDash?: number[];
}

// Axes style
export interface AxesStyleOptions {
    axisPosition?: AxesPosition;
    textColor?: string;
    font?: string;
    lineColor?: string;
    lineWidth?: number;
    numberLocale?: string;
    dateLocale?: string;
}

// Main Chart style options
export interface ChartStyleOptions {
    candles?: CandleStyleOptions;
    grid?: GridStyleOptions;
    axes?: AxesStyleOptions;
    // אפשר להוסיף פה עוד (למשל lineOverlay וכו')
}