import {Candle} from "../../../types/Candle.ts";
import {useChartStore} from '../../../store/useChartStore';

export function drawAxes(
    ctx: CanvasRenderingContext2D,
    candles: Candle[],
    width: number,
    height: number,
) {
    const {
        padding,
        visibleRange,
        minPrice,
        maxPrice,
        yAxisPosition,
        numberOfYTicks,
        numberOfXTicks,
        timeFormat,
        priceDecimalPlaces,
    } = useChartStore.getState?.();

    function formatUnixTime(unixTime: number): string {
        const date = new Date(unixTime);
        const options: Intl.DateTimeFormatOptions = timeFormat;
        return new Intl.DateTimeFormat('default', options).format(date);
    }

    ctx.strokeStyle = '#333';
    ctx.fillStyle = '#333';
    ctx.lineWidth = 2;
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';

    const yAxisX = yAxisPosition === 'left' ? padding : width - padding;

    // ציור קו ציר Y
    ctx.beginPath();
    ctx.moveTo(yAxisX, padding);
    ctx.lineTo(yAxisX, height - (padding - 7));
    ctx.stroke();

    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    // ציור קו ציר X
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // ציור ערכי ביניים בציר Y
    const step = (maxPrice - minPrice) / (numberOfYTicks - 1);

    for (let i = 0; i < numberOfYTicks; i++) {
        const value = minPrice + i * step;
        const y = height - padding - (i * (height - 2 * padding) / (numberOfYTicks - 1));

        const formattedValue = value.toFixed(priceDecimalPlaces);
        const offset = (formattedValue.length) * 5;
        const xPos = yAxisPosition === 'left' ? yAxisX - offset : yAxisX + offset;

        ctx.fillText(formattedValue, xPos, y - 5);

        ctx.beginPath();
        ctx.moveTo(yAxisX - (yAxisPosition === 'left' ? 5 : -5), y);
        ctx.lineTo(yAxisX, y);
        ctx.stroke();

    }

    // ציור ערכי ביניים בציר X עם שימוש בפונקציה formatUnixTime
    const timeRange = visibleRange.end - visibleRange.start;
    if (timeRange <= 0) return;

    ctx.textAlign = 'center';

    const xPositions = [
        visibleRange.start,
        visibleRange.end
    ];
    // הוספת ערכי בינתיים על ידי מספר ticks ל-x
    const stepX = (visibleRange.end - visibleRange.start) / (numberOfXTicks - 1);
    for (let i = 1; i < numberOfXTicks - 1; i++) {
        xPositions.push(visibleRange.start + i * stepX);
    }

    // מיון הערכים כדי להבטיח סדר כרונולוגי
    xPositions.sort((a, b) => a - b);


    // ציור הערכים בציר X
    xPositions.forEach(time => {
        // הוספת קו באורך 10 מעל לטקסט
        const x = padding + ((time - visibleRange.start) / timeRange) * (width - 2 * padding);
        ctx.beginPath();
        ctx.moveTo(x, height - padding);
        ctx.lineTo(x, height - padding + 7);
        ctx.stroke();
        // הוספת טקסט מתחת לקו
        const label = formatUnixTime(time);
        ctx.fillText(label, x, height - padding + 10);
    });
}