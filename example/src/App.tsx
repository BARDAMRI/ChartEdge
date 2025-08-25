import type {Interval} from 'chartedge';
import {AxesPosition, ChartType, SimpleChartEdge, TimeDetailLevel} from 'chartedge';

// ---- Simple, deterministic OHLC generator (random-walk with small drift) ----
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

        out.push({
            t,
            o: +o.toFixed(2),
            h: +h.toFixed(2),
            l: +l.toFixed(2),
            c: +c.toFixed(2),
        });

        lastClose = c;
        t += intervalSec;
    }

    return out;
}

// ---- Example: 200 bars of 5m starting at 1688000000 around price 100 ----
const intervalsArray: Interval[] = makeSimpleIntervals({
    startTime: 1688000000,
    startPrice: 100,
    intervalSec: 300,
    count: 200,
    seed: 4242,
    driftPerBar: 0.03,
    vol: 0.7,
    // addGapsEvery: 40, // uncomment to add a small gap every 40 bars
});
const minPrice = Math.min(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());
const maxPrice = Math.max(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());

const exampleVisibleRange = {
    start: intervalsArray[0].t,
    end: intervalsArray[intervalsArray.length - 1].t + 3601 // Add one hour to the end,
};

export default function App() {
    return (
        <div style={{height: '100vh', width: '100vw'}}>
            <SimpleChartEdge
                intervalsArray={intervalsArray}
                initialMargin={20}
                initialNumberOfYTicks={5}
                initialXAxisHeight={40}
                initialYAxisWidth={50}
                initialTimeDetailLevel={TimeDetailLevel.Auto}
                initialTimeFormat12h={false}
                initialVisibleTimeRange={exampleVisibleRange}
                initialVisiblePriceRange={{min: minPrice, max: maxPrice}}
                chartType={ChartType.Candlestick}
                chartOptions={{
                    base: {
                        showOverlayLine: true
                    }
                }}
            />
        </div>
    );
}