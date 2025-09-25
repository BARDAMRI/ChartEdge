import React, {useRef} from 'react';
import type {DrawingPoint, DrawingStyleOptions, Interval, RectangleShapeArgs} from 'chartedge';
import {
    ChartType,
    OverlayKind,
    SimpleChartEdge,
    TimeDetailLevel,
    OverlaySpecs,
    overlay,
    withOverlayStyle,
    OverlayPriceKey,
    RectangleShape,
    LineShape
} from 'chartedge';
import './App.css';

function simplePRNG(seed = 12345) {
    // Tiny LCG (deterministic)
    let s = seed >>> 0;
    const rand = () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
    return {rand};
}

/**
 * Generate simple OHLC bars with mild trend + volatility.
 * No regimes, no spikes/gaps (optional toggle below).
 */
function makeSimpleIntervals(params: {
    startTime: number;      // epoch seconds
    startPrice: number;     // e.g. 100
    intervalSec: number;    // e.g. 300 = 5m
    count: number;          // number of bars
    seed?: number;          // deterministic if provided
    driftPerBar?: number;   // small trend component, default 0.04
    vol?: number;           // noise amplitude, default 0.6
    addGapsEvery?: number;  // optional: add small gap every N bars (e.g., 40). Omit for none.
}): Interval[] {
    const {
        startTime,
        startPrice,
        intervalSec,
        count,
        seed = 12345,
        driftPerBar = 0.04,
        vol = 0.6,
        addGapsEvery
    } = params;

    const rng = simplePRNG(seed);
    const out: Interval[] = [];
    let t = startTime;
    let lastClose = startPrice;

    for (let i = 0; i < count; i++) {
        // Optional tiny gap every N bars (disabled if addGapsEvery is undefined)
        if (addGapsEvery && i > 0 && i % addGapsEvery === 0) {
            const gapPct = (rng.rand() - 0.5) * 0.01; // ~±1%
            lastClose = +(lastClose * (1 + gapPct)).toFixed(2);
        }

        const o = lastClose;

        // Simple random-walk close: drift + symmetric noise
        const noise = (rng.rand() - 0.5) * 2 * vol;
        const c = o + driftPerBar + noise;

        // High/Low add small intra-bar wiggle
        const wigUp = Math.abs((rng.rand() - 0.5) * 2) * (vol * 0.8 + 0.1);
        const wigDn = Math.abs((rng.rand() - 0.5) * 2) * (vol * 0.8 + 0.1);
        const h = Math.max(o, c) + wigUp;
        const l = Math.min(o, c) - wigDn;

        // Synthetic volume so VWAP overlays have data
        const baseVol = 1200; // arbitrary baseline
        const volJitter = (rng.rand() - 0.5) * 2 * 300; // ±300 variation
        const v = Math.max(1, Math.round(baseVol + volJitter));

        out.push({
            t,
            o: +o.toFixed(2),
            h: +h.toFixed(2),
            l: +l.toFixed(2),
            c: +c.toFixed(2),
            v,
        });

        lastClose = c;
        t += intervalSec;
    }

    return out;
}

// ---- Example: 200 bars of 5m starting at 1688000000 around price 100 ----
const INTERVAL_SEC = 300; // 5 minutes
const intervalsArray: Interval[] = makeSimpleIntervals({
    startTime: 1688000000,
    startPrice: 100,
    intervalSec: INTERVAL_SEC,
    count: 200,
    seed: 4242,
    driftPerBar: 0.03,
    vol: 0.7,
    // addGapsEvery: 40, // uncomment to add a small gap every 40 bars
});
const minPrice = Math.min(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());
const maxPrice = Math.max(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());
const lastCandleTime = intervalsArray[intervalsArray.length - 1].t;
const exampleVisibleRange = {
    start: intervalsArray[0].t,
    end: lastCandleTime + INTERVAL_SEC // Use the intervalSec value
};

// --- Demo overlays ---
const withBlue = withOverlayStyle({lineColor: '#2962ff', lineWidth: 2, lineStyle: 'solid'});
const sma20 = withBlue(OverlaySpecs.sma(20, OverlayPriceKey.close));

// Using the simple "kind" helper with explicit full style (DeepRequired<OverlayOptions>)
const emaDefault = overlay(OverlayKind.ema, {lineColor: '#26a69a', lineWidth: 2, lineStyle: 'solid'});
const vwapOv = overlay(OverlayKind.vwap, {lineColor: '#7e57c2', lineWidth: 1.5, lineStyle: 'solid'});

const demoOverlays = [sma20, emaDefault, vwapOv];

export default function App() {
    const chartRef = useRef<any>(null);

    // Example: add a random shape (rect or line) via API, within visible ranges
    function handleAddShape() {
        const view = chartRef.current?.getViewInfo();
        if (!view) {
            return;
        }

        function createRandomShape(view: any) {
            const {visibleRange, visiblePriceRange} = view;
            const {start, end} = visibleRange;
            const {min, max} = visiblePriceRange;

            const randTime = start + Math.random() * (end - start);
            const randPrice = min + Math.random() * (max - min);

            // Randomly choose shape type
            if (Math.random() < 0.5) {
                // RectangleShape
                const width = (end - start) * 0.05; // 5% of visible time range
                const height = (max - min) * 0.1;   // 10% of visible price range
                return new RectangleShape({
                    points: [
                        {time: randTime, price: randPrice},
                        {time: randTime + width, price: randPrice + height}
                    ]
                } as RectangleShapeArgs, {color: '#e53935'} as DrawingStyleOptions);
            } else {
                // LineShape with two points
                // Generate two points within visible ranges
                const time1 = start + Math.random() * (end - start);
                const price1 = min + Math.random() * (max - min);
                const time2 = start + Math.random() * (end - start);
                const price2 = min + Math.random() * (max - min);

                // Ensure LineShape constructor usage
                return new LineShape(
                    {points: [{time: time1, price: price1}, {time: time2, price: price2}]},
                    {color: '#2962ff', lineWidth: 2} as DrawingStyleOptions
                );
            }
        }

        const shape = createRandomShape(view);

        // Validate shape points are within visible ranges
        function isShapeInRange(shape: any, view: any) {
            const {visibleRange, visiblePriceRange} = view;
            const {start, end} = visibleRange;
            const {min, max} = visiblePriceRange;

            let points: DrawingPoint[] = [];

            if (shape instanceof RectangleShape) {
                points = shape.getPoints();
            } else if (shape instanceof LineShape) {
                points = shape.getPoints();
            } else {
                // Unknown shape type, assume out of range
                return false;
            }

            // Check all points within time and price ranges
            return points.every(p => p.time >= start && p.time <= end && p.price >= min && p.price <= max);
        }

        if (isShapeInRange(shape, view)) {
            chartRef.current?.addShape(shape);
        }
    }

    // Example: get info about the current view
    function handleGetInfo() {
        if (chartRef.current && chartRef.current.getViewInfo) {
            const info = chartRef.current.getViewInfo();
            alert(JSON.stringify(info, null, 2));
        }
    }

    // Example: clear all shapes/canvas
    function handleClear() {
        if (chartRef.current && chartRef.current.clearCanvas) {
            chartRef.current.clearCanvas();
        }
    }

    // Example: force redraw
    function handleRedraw() {
        if (chartRef.current && chartRef.current.redrawCanvas) {
            chartRef.current.redrawCanvas();
        }
    }

    function reloadCanvas() {
        if (chartRef.current && chartRef.current.reloadCanvas) {
            chartRef.current.reloadCanvas();
        }
    }

    return (
        <div className={'app-root'}>
            {/*<div style={{marginBottom: 16}}>*/}
            {/*    <button onClick={handleAddShape}>Add Shape</button>*/}
            {/*    <button onClick={handleGetInfo}>Get View Info</button>*/}
            {/*    <button onClick={handleClear}>Clear Canvas</button>*/}
            {/*    <button onClick={handleRedraw}>Redraw Canvas</button>*/}
            {/*    <button onClick={reloadCanvas}>Reload Canvas</button>*/}
            {/*</div>*/}
            <SimpleChartEdge
                ref={chartRef}
                className="simple-chart-edge"
                intervalsArray={intervalsArray}
                initialNumberOfYTicks={5}
                initialXAxisHeight={40}
                initialYAxisWidth={50}
                initialTimeDetailLevel={TimeDetailLevel.Auto}
                initialTimeFormat12h={false}
                initialVisibleTimeRange={exampleVisibleRange}
                initialVisiblePriceRange={{min: minPrice, max: maxPrice}}
                chartOptions={{
                    base: {
                        chartType: ChartType.Candlestick,
                        showOverlayLine: true,
                        // overlays: demoOverlays,
                        // style: {
                        //     overlay: {lineWidth: 1.5, lineStyle: 'solid', lineColor: '#22ff34'},
                        // },
                        // overlayKinds: [OverlayKind.sma, OverlayKind.bbands_lower],
                        showHistogram: true,
                    }
                }}
            />
        </div>
    );
}