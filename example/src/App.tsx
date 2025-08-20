import type {Candle} from 'chartedge';
import {AxesPosition, ChartType, SimpleChartEdge, TimeDetailLevel} from 'chartedge';

const len = 100;
const numSections = 5;
const sectionSize = Math.floor(len / numSections);
const intervalsArray: Candle[] = Array.from({length: len}, (_, i) => {
    const t = 1688000000000 + i * 3600000;


    const section = Math.floor(i / sectionSize);

    let base = 100;
    if (section === 1) base = 200;
    else if (section === 2) base = 100;
    else if (section === 3) base = 150;
    else if (section === 4) base = 200;
    else base = 180;
    let offset = i % sectionSize;

    let o: number, h: number, l: number, c: number;

    switch (section) {
        case 0: // עלייה לינארית
            o = base + offset;
            c = o + 5;
            break;

        case 1: // ירידה לינארית
            o = base + sectionSize - offset;
            c = o - 5;
            break;

        case 2: // zig-zag
            o = base + (offset % 2 === 0 ? 10 : -10);
            c = o + (offset % 2 === 0 ? -5 : 5);
            break;

        case 3: // תנועה צידית רועשת
            o = base + Math.sin(offset / 5) * 10;
            c = o + Math.sin(offset) * 3;
            break;

        case 4: // קפיצות פתאומיות
            o = base + (Math.random() > 0.95 ? Math.random() * 50 : 0);
            c = o + (Math.random() - 0.5) * 10;
            break;

        default: // רנדומליות מבוקרת
            o = base + (Math.random() - 0.5) * 20;
            c = o + (Math.random() - 0.5) * 10;
    }

    h = Math.max(o, c) + Math.random() * 5;
    l = Math.min(o, c) - Math.random() * 5;

    return {t, o, h, l, c};
});
const minPrice = Math.min(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());
const maxPrice = Math.max(...intervalsArray.map(candle => [candle.l, candle.h, candle.c, candle.o]).flat());

const exampleVisibleRange = {
    start: intervalsArray[0].t,
    end: intervalsArray[intervalsArray.length - 1].t,
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