import type {Interval} from 'chartedge';
import {AxesPosition, ChartType, SimpleChartEdge, TimeDetailLevel} from 'chartedge';

const intervalsArray: Interval[] = [
    { t: 1688000000, o: 100, h: 105, l: 98, c: 102 },
    { t: 1688003600, o: 102, h: 107, l: 100, c: 104 },
    { t: 1688007200, o: 104, h: 109, l: 102, c: 106 },
    { t: 1688010800, o: 106, h: 111, l: 104, c: 108 },
    { t: 1688014400, o: 108, h: 113, l: 106, c: 110 },
    { t: 1688018000, o: 110, h: 115, l: 108, c: 112 },
    { t: 1688021600, o: 112, h: 117, l: 110, c: 114 }
];
const minPrice = Math.min(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());
const maxPrice = Math.max(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());

const exampleVisibleRange = {
    start: intervalsArray[0].t,
    end: intervalsArray[intervalsArray.length - 1].t + 3600 // Add one hour to the end,
};

export default function App() {
    return (
        <div style={{height: '100vh', width: '100vw'}}>
            <SimpleChartEdge
                intervalsArray={intervalsArray}
                initialYAxisPosition={AxesPosition.left}
                initialMargin={20}
                initialNumberOfYTicks={5}
                initialXAxisHeight={40}
                initialYAxisWidth={50}
                initialTimeDetailLevel={TimeDetailLevel.Auto}
                initialTimeFormat12h={false}
                initialVisibleTimeRange={exampleVisibleRange}
                initialVisiblePriceRange={{min: minPrice, max: maxPrice}}
                chartType={ChartType.Candlestick}
            />
        </div>
    );
}