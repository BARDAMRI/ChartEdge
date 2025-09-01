export enum AxesPosition {
    left,
    right,
}

export enum AlignOptions {
    left = 'left',
    center = 'center',
    right = 'right',
}

export type ChartTheme = 'light' | 'dark' | 'grey' | string;


export type AxesOptions = {
    yAxisPosition: AxesPosition;
    currency: string;
    numberOfYTicks: number;
}

export type CanvasSizes = {
    width: number;
    height: number;
}


export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<NonNullable<T[K]>> : T[K];
};

export type DeepRequired<T> = {
    [K in keyof T]-?: T[K] extends object ? DeepRequired<NonNullable<T[K]>> : NonNullable<T[K]>;
};


export type WindowSpreadOptions = {
    TOP_BAR_PX: number;
    LEFT_BAR_PX: number;
    INITIAL_X_AXIS_HEIGHT: number;
    INITIAL_Y_AXIS_WIDTH: number;
}
export const windowSpread: WindowSpreadOptions = {
    TOP_BAR_PX: 40,
    LEFT_BAR_PX: 40,
    INITIAL_X_AXIS_HEIGHT: 40,
    INITIAL_Y_AXIS_WIDTH: 50,
}
