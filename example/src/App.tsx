import {SimpleChartEdge} from 'chartedge';
import type {Candle} from 'chartedge';
import {AxesPosition, TimeDetailLevel} from 'chartedge';

const exampleCandles: Candle[] = [
    {t: 1688000000000, o: 100, h: 110, l: 95, c: 105},
    {t: 1688003600000, o: 105, h: 115, l: 100, c: 110},
    {t: 1688007200000, o: 110, h: 120, l: 105, c: 115},
];

const exampleVisibleRange = {
    start: exampleCandles[0].t,
    end: exampleCandles[exampleCandles.length - 1].t,
};

export default function App() {
    return (
        <div style={{height: '100vh', width: '100vw'}}>
            <SimpleChartEdge
                // initialCandles={exampleCandles}
                initialYAxisPosition={AxesPosition.left}
                initialMargin={20}
                initialNumberOfYTicks={5}
                initialXAxisHeight={40}
                initialYAxisWidth={50}
                initialTimeDetailLevel={TimeDetailLevel.Auto}
                initialTimeFormat12h={false}
                // initialVisibleRange={exampleVisibleRange}
            />
        </div>
    );
}