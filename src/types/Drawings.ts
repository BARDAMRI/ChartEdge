export interface DrawingPoint {
    x: number;
    y: number;
}


export interface DrawingStyleOptions {
    lineColor: string;
    lineWidth: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    fillColor: string; // such as 'rgba(255, 0, 0, 0.2)'

    selected: {
        lineColor: string;
        lineWidthAdd?: number;
        lineStyle?: 'solid' | 'dashed' | 'dotted';
        fillColor?: string;
    }
}

export type FinalDrawingStyle = {
    lineColor: string;
    lineWidth: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    fillColor: string | 'transparent';
};
