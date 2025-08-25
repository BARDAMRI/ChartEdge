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


export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<NonNullable<T[K]>> : T[K];
};

export type DeepRequired<T> = {
    [K in keyof T]-?: T[K] extends object ? DeepRequired<NonNullable<T[K]>> : NonNullable<T[K]>;
};
