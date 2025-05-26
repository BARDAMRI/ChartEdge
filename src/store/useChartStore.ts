import {create} from 'zustand';

interface ChartState {
    numberOfXTicks: number;
    numberOfYTicks: number;
    timeFormat: string;
    visibleRange: { start: number; end: number };
    setNumberOfXTicks: (n: number) => void;
    setNumberOfYTicks: (n: number) => void;
    setTimeFormat: (format: string) => void;
    setVisibleRange: (range: { start: number; end: number }) => void;

    // Drawing state
    drawings: any[]; // אפשר להחליף לסוג מדויק יותר
    setDrawings: (drawings: any[] | ((prev: any[]) => any[])) => void;
    selectedIndex: number | null;
    setSelectedIndex: (index: number | null) => void;

    // Mode
    mode: string;
    setMode: (mode: string) => void;

    // Is Drawing
    isDrawing: boolean;
    setIsDrawing: (val: boolean) => void;

    // Points
    startPoint: { x: number; y: number } | null;
    setStartPoint: (point: { x: number; y: number } | null) => void;
    currentPoint: { x: number; y: number } | null;
    setCurrentPoint: (point: { x: number; y: number } | null) => void;

    stepX: number;
    stepY: number;
    strokeStyle: string;
    padding: number;
    width: number;
    height: number;

    setStepX: (value: number) => void;
    setStepY: (value: number) => void;
    setStrokeStyle: (value: string) => void;
    setPadding: (value: number) => void;
    setWidth: (value: number) => void;
    setHeight: (value: number) => void;

    minPrice: number;
    maxPrice: number;
    setMinPrice: (value: number) => void;
    setMaxPrice: (value: number) => void;

    yAxisPosition: 'left' | 'right';
    setYAxisPosition: (position: 'left' | 'right') => void;

    priceDecimalPlaces: number;
    setPriceDecimalPlaces: (value: number) => void;

    decimalSeparator: string;
    setDecimalSeparator: (value: string) => void;

    thousandSeparator: string;
    setThousandSeparator: (value: string) => void;

    currencySymbol: string;
    setCurrencySymbol: (value: string) => void;

    currencySymbolPosition: 'before' | 'after';
    setCurrencySymbolPosition: (value: 'before' | 'after') => void;
}

export const useChartStore = create<ChartState>((set) => ({
    numberOfXTicks: 5,
    numberOfYTicks: 5,
    timeFormat: 'YYYY/MM/DD',
    visibleRange: {start: Date.now() - 365 * 24 * 60 * 60 * 1000, end: Date.now()},
    setNumberOfXTicks: (n) => set({numberOfXTicks: n}),
    setNumberOfYTicks: (n) => set({numberOfYTicks: n}),
    setTimeFormat: (format) => set({timeFormat: format}),
    setVisibleRange: (range) => set({visibleRange: range}),

    drawings: [],
    setDrawings: (update) => set(state => ({
        drawings: typeof update === 'function' ? update(state.drawings) : update
    })),
    selectedIndex: null,
    setSelectedIndex: (index) => set({selectedIndex: index}),

    mode: 'none',
    setMode: (mode) => set({mode}),

    isDrawing: false,
    setIsDrawing: (val) => set({isDrawing: val}),

    startPoint: null,
    setStartPoint: (point) => set({startPoint: point}),

    currentPoint: null,
    setCurrentPoint: (point) => set({currentPoint: point}),

    stepX: 50,
    stepY: 50,
    strokeStyle: '#eee',
    padding: 20,
    width: 800,
    height: 600,

    setStepX: (value) => set({stepX: value}),
    setStepY: (value) => set({stepY: value}),
    setStrokeStyle: (value) => set({strokeStyle: value}),
    setPadding: (value) => set({padding: value}),
    setWidth: (value) => set({width: value}),
    setHeight: (value) => set({height: value}),

    minPrice: 0,
    maxPrice: 100,
    setMinPrice: (value) => set({minPrice: value}),
    setMaxPrice: (value) => set({maxPrice: value}),

    yAxisPosition: 'left',
    setYAxisPosition: (position) => set({yAxisPosition: position}),

    priceDecimalPlaces: 2,
    setPriceDecimalPlaces: (value) => set({ priceDecimalPlaces: value }),

    decimalSeparator: '.',
    setDecimalSeparator: (value) => set({ decimalSeparator: value }),

    thousandSeparator: ',',
    setThousandSeparator: (value) => set({ thousandSeparator: value }),

    currencySymbol: '$',
    setCurrencySymbol: (value) => set({ currencySymbol: value }),

    currencySymbolPosition: 'before',
    setCurrencySymbolPosition: (value) => set({ currencySymbolPosition: value }),
}));