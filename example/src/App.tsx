import {SimpleChartEdge} from 'chartedge';
import type {Candle} from 'chartedge';
import {AxesPosition, TimeDetailLevel} from 'chartedge';

const intervalsArray: Candle[] = [
    {t: 1688000000000, o: 100, h: 110, l: 95, c: 105},
    {t: 1688003600000, o: 105, h: 115, l: 100, c: 110},
    {t: 1688007200000, o: 110, h: 120, l: 105, c: 115},
    {t: 1688010800000, o: 115, h: 125, l: 110, c: 120},
    {t: 1688014400000, o: 120, h: 125, l: 100, c: 105},
    {t: 1688018000000, o: 105, h: 115, l: 95, c: 110},
    {t: 1688021600000, o: 110, h: 120, l: 105, c: 115},
    {t: 1688025200000, o: 115, h: 125, l: 110, c: 120},
    {t: 1688028800000, o: 120, h: 130, l: 115, c: 125},
    {t: 1688032400000, o: 125, h: 135, l: 120, c: 130},
    {t: 1688036000000, o: 130, h: 140, l: 125, c: 135},
    {t: 1688039600000, o: 135, h: 145, l: 130, c: 140},
    {t: 1688043200000, o: 140, h: 150, l: 135, c: 145},
    {t: 1688046800000, o: 145, h: 155, l: 140, c: 150},
    {t: 1688050400000, o: 150, h: 160, l: 145, c: 155},
    {t: 1688054000000, o: 155, h: 165, l: 150, c: 160},
    {t: 1688057600000, o: 160, h: 170, l: 155, c: 165},
    {t: 1688061200000, o: 165, h: 175, l: 160, c: 170},
    {t: 1688064800000, o: 170, h: 180, l: 165, c: 175},
    {t: 1688068400000, o: 175, h: 185, l: 170, c: 180},
    {t: 1688072000000, o: 180, h: 190, l: 175, c: 185},
    {t: 1688075600000, o: 185, h: 195, l: 180, c: 190},
    {t: 1688079200000, o: 190, h: 200, l: 185, c: 195},
    {t: 1688082800000, o: 195, h: 205, l: 190, c: 200},
    {t: 1688086400000, o: 200, h: 210, l: 195, c: 205},
    {t: 1688090000000, o: 205, h: 215, l: 200, c: 210},
    {t: 1688093600000, o: 210, h: 220, l: 205, c: 215},
    {t: 1688097200000, o: 215, h: 225, l: 210, c: 220},
    {t: 1688100800000, o: 220, h: 230, l: 215, c: 225},
    {t: 1688104400000, o: 225, h: 235, l: 220, c: 230},
    {t: 1688108000000, o: 230, h: 240, l: 225, c: 235},
    {t: 1688111600000, o: 235, h: 245, l: 230, c: 240},
    {t: 1688115200000, o: 240, h: 250, l: 235, c: 245},
];

const minPrice = Math.min(...intervalsArray.map(candle => [candle.l,candle.h, candle.c, candle.o]).flat());
const maxPrice = Math.max(...intervalsArray.map(candle => [candle.l,candle.h, candle.c, candle.o]).flat());

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
                initialVisiblePriceRange={{min:minPrice, max: maxPrice}}
            />
        </div>
    );
}