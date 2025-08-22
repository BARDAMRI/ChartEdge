import type {Interval} from 'chartedge';
import {AxesPosition, ChartType, SimpleChartEdge, TimeDetailLevel} from 'chartedge';

const intervalsArray: Interval[] = [
    { t: 1688000000, o: 100, h: 105, l: 98, c: 102 },
    { t: 1688003600, o: 102, h: 107, l: 100, c: 104 },
    { t: 1688007200, o: 104, h: 109, l: 102, c: 106 },
    { t: 1688010800, o: 106, h: 111, l: 104, c: 108 },
    { t: 1688014400, o: 108, h: 113, l: 106, c: 110 },
    { t: 1688018000, o: 110, h: 115, l: 108, c: 112 },
    { t: 1688021600, o: 112, h: 117, l: 110, c: 114 },
    { t: 1688025200, o: 114, h: 119, l: 112, c: 116 },
    // { t: 1688028800, o: 116, h: 121, l: 114, c: 118 },
    // { t: 1688032400, o: 118, h: 123, l: 116, c: 120 },
    // { t: 1688036000, o: 120, h: 125, l: 118, c: 122 },
    // { t: 1688039600, o: 122, h: 127, l: 120, c: 124 },
    // { t: 1688043200, o: 124, h: 129, l: 122, c: 126 },
    // { t: 1688046800, o: 126, h: 131, l: 124, c: 128 },
    // { t: 1688050400, o: 128, h: 133, l: 126, c: 130 },
];
const minPrice = Math.min(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());
const maxPrice = Math.max(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());

const exampleVisibleRange = {
    start: intervalsArray[2].t,
    end: intervalsArray[intervalsArray.length - 1].t + 3601 // Add one hour to the end,
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
                chartType={ChartType.Area}
            />
        </div>
    );
}