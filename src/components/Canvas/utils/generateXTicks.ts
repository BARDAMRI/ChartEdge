import {
    startOfHour,
    startOfDay,
    startOfMonth,
    startOfYear,
    addHours,
    addDays,
    addMonths,
    addYears,
    format,
    differenceInHours,
    differenceInDays,
    differenceInMonths,
    differenceInYears,
} from 'date-fns';
import {DrawTicksOptions, Tick, TimeRange} from "../../../types/Graph";
import { TimeDetailLevel } from "../../../types/chartStyleOptions";


export function generateAndDrawTimeTicks(
    canvas: HTMLCanvasElement,
    timeRange: TimeRange,
    numberOfXTicks: number,           // number of max ticks on the X axis
    timeFormat: string,              // the format of the time labels, e.g. 'DD/MM/YYYY HH:mm'
    timeFormat12h: boolean,          // the time format is 12h or 24h
    xAxisHeight: number,             // X axis height in pixels
    strokeStyle: string,             // line color for the ticks and labels
    timeDetailLevel: TimeDetailLevel,
    options: DrawTicksOptions
): Tick[] {
    const {start, end} = timeRange;
    const canvasWidth = canvas.clientWidth;

    if (start >= end || canvasWidth <= 0 || numberOfXTicks <= 0) {
        return [];
    }

    const {
        tickHeight = 10,
        tickColor = strokeStyle,
        labelColor = strokeStyle,
        labelFont = '12px Arial',
        labelOffset = 15,
        axisY = canvas.height - xAxisHeight
    }: DrawTicksOptions = options;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('cannot receive canvas context');
    }

    const durationMs = end - start;

    const startDate = new Date(start);
    const endDate = new Date(end);

    // check if the timeDetailLevel is set, otherwise determine it automatically
    let intervalFn: (date: Date, amount: number) => Date;
    let startOfFn: (date: Date) => Date;
    let diffFn: (dateLeft: Date, dateRight: Date) => number;
    let formatStr: string;

    const durationHours = differenceInHours(endDate, startDate);

    // choosing the appropriate time detail level based on the duration
    if (timeDetailLevel === TimeDetailLevel.High || (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 12)) {
        // high detail - ticks every hour
        intervalFn = addHours;
        startOfFn = startOfHour;
        diffFn = differenceInHours;
        formatStr = timeFormat12h ? 'h:mm a' : 'HH:mm';
    } else if (timeDetailLevel === TimeDetailLevel.Medium || (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 24 * 7)) {
        // medium detail - ticks every day
        intervalFn = addDays;
        startOfFn = startOfDay;
        diffFn = differenceInDays;
        // use 'MMM DD' if the format includes 'DD', otherwise use 'MMM d'
        formatStr = timeFormat.includes('DD') ? 'MMM DD' : 'MMM d';
    } else if (timeDetailLevel === TimeDetailLevel.Low || (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 24 * 365)) {
        // low detail - ticks every month
        intervalFn = addMonths;
        startOfFn = startOfMonth;
        diffFn = differenceInMonths;
        formatStr = timeFormat.includes('YYYY') ? 'MMM YYYY' : 'MMM yyyy';
    } else {
        // minimal detail - ticks every year
        intervalFn = addYears;
        startOfFn = startOfYear;
        diffFn = differenceInYears;
        formatStr = timeFormat.includes('YYYY') ? 'YYYY' : 'yyyy';
    }

    // calculate the total number of units between start and end
    const totalUnits = diffFn(endDate, startDate);

    // if no units to display, return an empty array
    if (totalUnits <= 0) {
        return [];
    }

    // setting the step size for the ticks
    const step = Math.max(1, Math.ceil(totalUnits / numberOfXTicks));

    // creating an array to hold the ticks
    const ticks: Tick[] = [];

    // start from the first tick date
    let currentTickDate = startOfFn(startDate);

    // if the current tick date is before the start, move it to the first valid tick
    if (currentTickDate.getTime() < start) {
        currentTickDate = intervalFn(currentTickDate, step);
    }

    // creating ticks until we reach the end date
    while (currentTickDate.getTime() <= end) {
        const tickTime = currentTickDate.getTime();

        // calculating the position of the tick on the canvas
        const pos = ((tickTime - start) / durationMs) * canvasWidth;

        // debug print for each tick
        console.log('🧪 Tick:', {
            tickTime,
            pos,
            label: format(currentTickDate, formatStr),
            percent: (tickTime - start) / durationMs
        });

        // only add the tick if it is within the canvas width
        if (pos >= 0 && pos <= canvasWidth) {
            const label = format(currentTickDate, formatStr);
            ticks.push({position: pos, label});
        }

        // moving to the next tick date
        currentTickDate = intervalFn(currentTickDate, step);
    }

    // in case no ticks were generated, add the start and end dates as ticks
    if (ticks.length === 0) {
        ticks.push(
            {position: 0, label: format(startDate, formatStr)},
            {position: canvasWidth, label: format(endDate, formatStr)}
        );
    }

    // drawing the ticks on the canvas
    drawTicks(ctx, ticks, tickHeight, tickColor, labelColor, labelFont, labelOffset, axisY);

    return ticks;
}

function drawTicks(
    ctx: CanvasRenderingContext2D,
    ticks: Tick[],
    tickHeight: number,
    tickColor: string,
    labelColor: string,
    labelFont: string,
    labelOffset: number,
    axisY: number
): void {
    // drawing the axis line
    ctx.strokeStyle = tickColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(ctx.canvas.clientWidth, axisY);
    ctx.stroke();

    // drawing each tick and its label
    ticks.forEach(tick => {
        ctx.strokeStyle = tickColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tick.position, axisY);
        ctx.lineTo(tick.position, axisY + tickHeight);
        ctx.stroke();

        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(tick.label, tick.position, axisY + labelOffset + 5);
    });
}