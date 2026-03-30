import {
    addDays,
    addHours,
    addMinutes,
    addMonths,
    addYears,
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
    differenceInMonths,
    differenceInYears,
    format,
    startOfDay,
    startOfHour,
    startOfMinute,
    startOfMonth,
    startOfYear,
} from 'date-fns';
import {DrawTicksOptions, Tick, TimeRange} from "../../../types/Graph";
import {TimeDetailLevel, AxesStyleOptions} from "../../../types/chartOptions";
import {AlignOptions, AxesPosition} from "../../../types/types";
import {formatNumber} from "./formatters";
import {getDateFnsLocale} from "../../../utils/i18n";
import {formatWithTimezone} from "../../../utils/timeUtils";
import {FormattingService} from "../../../services/FormattingService";

const TICK_FONT_SIZE_PX = 12;


function selectTimeDetailLevel(
    startDate: Date,
    endDate: Date,
    canvasWidth: number,
    maxTicks: number,
    timeFormat: string,
    timeFormat12h: boolean,
    timeDetailLevel: TimeDetailLevel,
    ctx: CanvasRenderingContext2D,
    timezone?: string
): {
    intervalFn: (date: Date, amount: number) => Date;
    startOfFn: (date: Date) => Date;
    formatStr: string;
    step: number
} | null {
    const durationHours = differenceInHours(endDate, startDate);

    const levels = [
        /* Same-calendar-hour zoom: hour grid skips the window; use minutes first. */
        {
            condition: durationHours < 1,
            intervalFn: addMinutes,
            startOfFn: startOfMinute,
            diffFn: differenceInMinutes,
            formatStr: timeFormat12h ? 'h:mm a' : 'HH:mm',
            /* Like hours' stepFactor:4, group minutes so density check allows ~1h zoom windows. */
            stepFactor: 5,
        },
        {
            condition:
                durationHours >= 1 &&
                (timeDetailLevel === TimeDetailLevel.High ||
                    (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 48)),
            intervalFn: addHours,
            startOfFn: startOfHour,
            diffFn: differenceInHours,
            formatStr: timeFormat12h ? 'h:mm a' : 'HH:mm',
            stepFactor: 4,
        },
        {
            condition: timeDetailLevel === TimeDetailLevel.Medium || (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 24 * 7),
            intervalFn: addDays,
            startOfFn: startOfDay,
            diffFn: differenceInDays,
            formatStr: timeFormat.includes('DD') ? 'MMM DD' : 'MMM d',
            stepFactor: 1
        },
        {
            condition: timeDetailLevel === TimeDetailLevel.Low || (timeDetailLevel === TimeDetailLevel.Auto && durationHours <= 24 * 365),
            intervalFn: addMonths,
            startOfFn: startOfMonth,
            diffFn: differenceInMonths,
            formatStr: timeFormat.includes('YYYY') ? 'MMM YYYY' : 'MMM yyyy',
            stepFactor: 1
        },
        {
            condition: true,
            intervalFn: addYears,
            startOfFn: startOfYear,
            diffFn: differenceInYears,
            formatStr: timeFormat.includes('YYYY') ? 'YYYY' : 'yyyy',
            stepFactor: 1
        }
    ];

    for (const level of levels) {
        if (level.condition) {
            const totalUnits = Math.max(1, Math.floor(level.diffFn(endDate, startDate) / level.stepFactor));
            const sampleLabel = format(new Date(), level.formatStr);
            const labelWidth = ctx.measureText(sampleLabel).width;

            if (totalUnits <= maxTicks && labelWidth * totalUnits <= canvasWidth) {
                const step = Math.max(1, Math.floor(totalUnits / maxTicks));
                return {intervalFn: level.intervalFn, startOfFn: level.startOfFn, formatStr: level.formatStr, step};
            }
        }
    }

    return null;
}

function generateAndDrawTicksForLevel(
    canvas: HTMLCanvasElement,
    startDate: Date,
    endDate: Date,
    durationSec: number,
    canvasWidth: number,
    level: {
        intervalFn: (date: Date, amount: number) => Date;
        startOfFn: (date: Date) => Date;
        formatStr: string;
        step: number
    },
    options: DrawTicksOptions,
    strokeStyle: string,
    xAxisHeight: number,
    locale: string = 'en-US',
    timezone?: string
): Tick[] {
    const {intervalFn, startOfFn, formatStr, step} = level;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    const {
        tickHeight = 10,
        tickColor = strokeStyle,
        labelColor = strokeStyle,
        labelFont = `${TICK_FONT_SIZE_PX}px Arial`,
        labelOffset = 15,
        axisY = canvas.clientHeight - xAxisHeight
    } = options;

    const ticks: Tick[] = [];
    let currentTickDate = startOfFn(startDate);

    if (currentTickDate.getTime() < startDate.getTime()) {
        currentTickDate = intervalFn(currentTickDate, step);
    }

    while (currentTickDate.getTime() / 1000 <= endDate.getTime() / 1000) {
        const tickTime = currentTickDate.getTime();
        const tickTimeSec = tickTime / 1000;
        const startTimeSec = startDate.getTime() / 1000;
        const pos = ((tickTimeSec - startTimeSec) / durationSec) * canvasWidth;

        if (pos >= 0 && pos <= canvasWidth) {
            const label = timezone 
                ? formatWithTimezone(tickTime / 1000, { 
                    year: formatStr.includes('yyyy') || formatStr.includes('YYYY') ? 'numeric' : undefined,
                    month: formatStr.includes('MMM') ? 'short' : (formatStr.includes('MM') ? '2-digit' : undefined),
                    day: formatStr.includes('d') || formatStr.includes('D') ? 'numeric' : undefined,
                    hour: formatStr.includes('H') || formatStr.includes('h') ? '2-digit' : undefined,
                    minute: formatStr.includes('mm') ? '2-digit' : undefined,
                    hour12: formatStr.includes('a')
                  }, locale, timezone)
                : FormattingService.formatDate(currentTickDate, { locale, dateFormat: formatStr } as any);
            ticks.push({position: pos, label});
        }

        currentTickDate = intervalFn(currentTickDate, step);
    }

    if (ticks.length === 0) {
        ticks.push(
            {position: 0, label: FormattingService.formatDate(startDate, { locale, dateFormat: formatStr } as any)},
            {position: canvasWidth, label: FormattingService.formatDate(endDate, { locale, dateFormat: formatStr } as any)}
        );
    }

    drawXTicks(ctx, canvasWidth, ticks, tickHeight, tickColor, labelColor, labelFont, labelOffset, axisY);

    return ticks;
}

export function generateAndDrawTimeTicks(
    canvas: HTMLCanvasElement,
    timeRange: TimeRange,
    numberOfXTicks: number,
    timeFormat: string,
    timeFormat12h: boolean,
    xAxisHeight: number,
    strokeStyle: string,
    timeDetailLevel: TimeDetailLevel,
    options: DrawTicksOptions,
    locale: string = 'en-US',
    timezone?: string
): Tick[] {
    const {start, end} = timeRange;
    const canvasWidth = canvas.clientWidth;

    if (start >= end || canvasWidth <= 0 || numberOfXTicks <= 0) {
        return [];
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    const durationSec = end - start;
    const startDate = new Date(start * 1000);
    const endDate = new Date(end * 1000);

    const pixelsPerTick = 80;
    const estimatedTicks = Math.max(2, Math.floor(canvasWidth / pixelsPerTick));
    const maxTicks = Math.min(estimatedTicks, numberOfXTicks);

    const selectedLevel = selectTimeDetailLevel(startDate, endDate, canvasWidth, maxTicks, timeFormat, timeFormat12h, timeDetailLevel, ctx, timezone);

    if (!selectedLevel) {
        return [];
    }

    return generateAndDrawTicksForLevel(canvas, startDate, endDate, durationSec, canvasWidth, selectedLevel, options, strokeStyle, xAxisHeight, locale, timezone);
}


export function generateAndDrawYTicks(
    canvas: HTMLCanvasElement,
    minValue: number,
    maxValue: number,
    numberOfYTicks: number,
    yAxisPosition: AxesPosition = AxesPosition.left,
    tickColor: string = 'black',
    labelColor: string = 'black',
    labelFont: string = '12px Arial',
    tickLength: number = 5,
    labelOffset: number = 5,
    formatting: Partial<AxesStyleOptions> = {}
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Cannot get canvas context');
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const paddingTop = 10;
    const paddingBottom = 10;
    const effectiveHeight = height - paddingTop - paddingBottom;
    const range = maxValue - minValue;

    ctx.clearRect(0, 0, width, height);
    
    const pixelsPerTick = 40; 
    const maxYTicks = Math.max(2, Math.floor(height / pixelsPerTick));
    const effectiveNumberOfYTicks = Math.min(numberOfYTicks, maxYTicks);

    if (!isFinite(minValue) || !isFinite(maxValue) || !isFinite(range) || range < 0 || effectiveNumberOfYTicks <= 1) {
        return;
    }

    let dynamicFractionDigits = formatting.numberFractionDigits;
    if (formatting.autoPrecision) {
        const interval = range / (effectiveNumberOfYTicks - 1);
        if (interval > 0) {
            // Log10 of the interval tells us where the first significant digit is.
            // E.g. if interval is 0.05, log10 is -1.3 -> we need 2 digits.
            // if interval is 0.001, log10 is -3 -> we need 3 digits.
            dynamicFractionDigits = Math.max(2, Math.ceil(-Math.log10(interval)));
        }
    }

    const ticks = Array.from({length: effectiveNumberOfYTicks}, (_, i) => {
        const ratio = i / (effectiveNumberOfYTicks - 1);
        const y = paddingTop + ratio * effectiveHeight;
        const value = maxValue - ratio * range;
        return {
            y,
            label: FormattingService.formatPrice(value, {
                ...formatting,
                numberFractionDigits: dynamicFractionDigits,
            } as AxesStyleOptions)
        };
    });

    drawYTicks(ctx, ticks, width, yAxisPosition, tickColor, labelColor, labelFont, tickLength, labelOffset);
}

function drawXTicks(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    ticks: Tick[],
    tickHeight: number,
    tickColor: string,
    labelColor: string,
    labelFont: string,
    labelOffset: number,
    axisY: number
): void {
    ctx.save();

    const crisp = (v: number) => Math.round(v) + 0.5;

    ctx.strokeStyle = tickColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(crisp(0), axisY);
    ctx.lineTo(crisp(canvasWidth), axisY);
    ctx.stroke();

    let lastRight = -Infinity;

    // drawing each tick and its label
    ticks.forEach((tick, i) => {
        const x = crisp(tick.position);

        ctx.strokeStyle = tickColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, axisY);
        ctx.lineTo(x, axisY + tickHeight);
        ctx.stroke();

        ctx.fillStyle = labelColor;
        ctx.font = labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const w = ctx.measureText(tick.label).width;
        let xPos = tick.position;

        // Ensure boundary labels stay within canvas
        if (i === 0) {
            // First tick: shift right if it overflows left
            if (xPos - w / 2 < 2) {
                xPos = w / 2 + 2;
            }
        } else if (i === ticks.length - 1) {
            // Last tick: shift left if it overflows right
            if (xPos + w / 2 > canvasWidth - 2) {
                xPos = canvasWidth - w / 2 - 2;
            }
        }

        const labelLeft = xPos - w / 2;
        const labelRight = xPos + w / 2;

        if (labelLeft > lastRight + 4) {
            ctx.fillText(tick.label, xPos, axisY + labelOffset + 5);
            lastRight = labelRight;
        }
    });

    ctx.restore();
}

// Draw Y-axis ticks helper
function drawYTicks(
    ctx: CanvasRenderingContext2D,
    ticks: { y: number; label: string }[],
    width: number,
    yAxisPosition: AxesPosition,
    tickColor: string,
    labelColor: string,
    labelFont: string,
    tickLength: number,
    labelOffset: number
): void {
    ctx.strokeStyle = tickColor;
    ctx.fillStyle = labelColor;
    ctx.font = labelFont;
    ctx.textAlign = yAxisPosition == AxesPosition.left ? AlignOptions.right : AlignOptions.left;
    ctx.textBaseline = 'middle';

    // draw Y-axis line
    const axisX = yAxisPosition == AxesPosition.left ? width : 0;
    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, ctx.canvas.clientHeight);
    ctx.stroke();

    for (const tick of ticks) {
        const x = yAxisPosition == AxesPosition.left ? width : 0;
        const tickEndX = yAxisPosition == AxesPosition.left ? width - tickLength : tickLength;
        const labelX = yAxisPosition == AxesPosition.left ? tickEndX - labelOffset : tickEndX + labelOffset;

        ctx.beginPath();
        ctx.moveTo(x, tick.y);
        ctx.lineTo(tickEndX, tick.y);
        ctx.stroke();

        let label = tick.label;
        const maxLabelWidth = Math.max(0, width - tickLength - labelOffset - 2); // 2px safety margin
        let labelWidth = ctx.measureText(label).width;

        if (labelWidth > maxLabelWidth) {
            const ellipsisWidth = ctx.measureText('...').width;
            if (maxLabelWidth < ellipsisWidth) {
                label = ''; // No room even for ellipsis
            } else {
                while (label.length > 0 && labelWidth > maxLabelWidth) {
                    label = label.slice(0, -1);
                    labelWidth = ctx.measureText(label + '...').width;
                }
                label += '...';
            }
        }

        if (label) {
            ctx.fillText(label, labelX, tick.y);
        }
    }
}
