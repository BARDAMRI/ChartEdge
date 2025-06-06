import {create} from 'zustand';
import type {Candle} from '../types/Candle.ts';
import {} from '../types/Candle.ts'
import {TimeRange} from '../types/Graph.ts';
import {useState} from "react";


interface ChartState {
    numberOfXTicks: number;
    numberOfYTicks: number;
    timeFormat: string;
    timeFormat12h: boolean;
    xAxisHeight: number;
    yAxisWidth: number;
    setXAxisHeight: (height: number) => void;
    setYAxisWidth: (width: number) => void;
    setCanvasWidth: (width: number) => void;
    setCanvasHeight: (height: number) => void;
    setNumberOfXTicks: (n: number) => void;
    setNumberOfYTicks: (n: number) => void;
    setTimeFormat: (format: string) => void;
    setTimeFormat12h: (value: boolean) => void;
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
    margin: number;

    setStepX: (value: number) => void;
    setStepY: (value: number) => void;
    setStrokeStyle: (value: string) => void;
    setPadding: (value: number) => void;

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

    safeCandles: Candle[];
    visibleCandles: Candle[];
    candlesToUse: Candle[];
    visibleRange: TimeRange;

    setCandlesAndVisibleRange: (candles: Candle[], visibleRange: TimeRange) => void;

    timeDetailLevel: 'auto' | 'low' | 'medium' | 'high';
    setTimeDetailLevel: (level: 'auto' | 'low' | 'medium' | 'high') => void;
}

export const useChartStore = create<ChartState>((set) => ({
    numberOfXTicks: 5,
    numberOfYTicks: 5,
    timeFormat: 'YYYY/MM/DD',
    timeFormat12h: false, // false = 24 שעות, true = 12 שעות AM/PM
    xAxisHeight: 40,
    yAxisWidth: 40,
    setXAxisHeight: (height) => set({xAxisHeight: height}),
    setYAxisWidth: (width) => set({yAxisWidth: width}),
    stepX: 50,
    stepY: 50,
    strokeStyle: '#eee',
    padding: 15,
    setCandles: (candles) => set({candles}),
    candles: [],
    visibleRange: {start: Date.now() - 365 * 24 * 60 * 60 * 1000, end: Date.now()},
    setVisibleRange: (range) => set({visibleRange: range}),
    setCanvasWidth: (width) => set({canvasWidth: width}),
    setCanvasHeight: (height) => set({canvasHeight: height}),
    setNumberOfXTicks: (n) => set({numberOfXTicks: n}),
    setNumberOfYTicks: (n) => set({numberOfYTicks: n}),
    setTimeFormat: (format) => set({timeFormat: format}),
    setTimeFormat12h: (value) => set({timeFormat12h: value}),

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

    setStepX: (value) => set({stepX: value}),
    setStepY: (value) => set({stepY: value}),
    setStrokeStyle: (value) => set({strokeStyle: value}),
    setMargin: (value) => set({margin: value}),

    minPrice: 0,
    maxPrice: 100,
    setMinPrice: (value) => set({minPrice: value}),
    setMaxPrice: (value) => set({maxPrice: value}),

    yAxisPosition: 'left',
    setYAxisPosition: (position) => set({yAxisPosition: position}),

    priceDecimalPlaces: 2,
    setPriceDecimalPlaces: (value) => set({priceDecimalPlaces: value}),

    decimalSeparator: '.',
    setDecimalSeparator: (value) => set({decimalSeparator: value}),

    thousandSeparator: ',',
    setThousandSeparator: (value) => set({thousandSeparator: value}),

    currencySymbol: '$',
    setCurrencySymbol: (value) => set({currencySymbol: value}),

    currencySymbolPosition: 'before',
    setCurrencySymbolPosition: (value) => set({currencySymbolPosition: value}),

    safeCandles: [],
    visibleCandles: [],
    candlesToUse: [],
    setCandlesAndVisibleRange: (candles, visibleRange) => set(state => {
        const safeCandles = candles || [];
        const visibleCandles = safeCandles.filter(
            c => visibleRange && c.t >= visibleRange.start && c.t <= visibleRange.end
        );
        const candlesToUse = visibleCandles.length > 0 ? visibleCandles : safeCandles;
        const prices = candlesToUse.length > 0
            ? candlesToUse.flatMap(c => [c.h, c.l])
            : [];
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 1;
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        return {
            safeCandles,
            visibleRange,
            visibleCandles,
            candlesToUse,
            minPrice,
            maxPrice
        };
    }),

    timeDetailLevel: 'auto',
    setTimeDetailLevel: (level) => set({timeDetailLevel: level}),
}));