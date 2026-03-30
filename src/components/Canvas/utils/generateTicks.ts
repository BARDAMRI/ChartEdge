import {DrawTicksOptions, Tick, TimeRange} from "../../../types/Graph";
import {TimeDetailLevel, AxesStyleOptions} from "../../../types/chartOptions";
import {AlignOptions, AxesPosition} from "../../../types/types";
import {formatWithTimezone} from "../../../utils/timeUtils";
import {FormattingService} from "../../../services/FormattingService";

const TICK_FONT_SIZE_PX = 12;

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

/**
 * Nice tick steps in **seconds** (Unix span). Used only with
 * {@link TimeRange.start} / {@link TimeRange.end} — no dependency on off-screen data.
 */
const NICE_STEPS_SEC_ASC: readonly number[] = [
    1, 2, 5, 10, 15, 30,
    1 * MIN, 2 * MIN, 5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN,
    1 * HOUR, 2 * HOUR, 3 * HOUR, 4 * HOUR, 6 * HOUR, 8 * HOUR, 12 * HOUR,
    1 * DAY, 2 * DAY, 3 * DAY, 7 * DAY, 14 * DAY,
    30 * DAY, 60 * DAY, 90 * DAY, 180 * DAY, 365 * DAY, 2 * 365 * DAY, 5 * 365 * DAY,
];

function nextNiceStep(stepSec: number): number {
    const i = NICE_STEPS_SEC_ASC.findIndex((s) => s > stepSec);
    return i >= 0 ? NICE_STEPS_SEC_ASC[i]! : stepSec * 2;
}

function prevNiceStep(stepSec: number): number {
    for (let i = NICE_STEPS_SEC_ASC.length - 1; i >= 0; i--) {
        const s = NICE_STEPS_SEC_ASC[i]!;
        if (s < stepSec) {
            return s;
        }
    }
    return Math.max(1, stepSec / 2);
}

/** Target tick count from axis width (label spacing), capped by caller. */
function targetTickCount(canvasWidth: number, minPxPerTick: number, hardMax: number): number {
    const fromWidth = Math.floor(canvasWidth / minPxPerTick);
    return Math.max(2, Math.min(hardMax, fromWidth));
}

/**
 * Pick step from visible duration only; honor {@link TimeDetailLevel} density.
 */
function pickStepSeconds(
    durationSec: number,
    maxTicks: number,
    timeDetailLevel: TimeDetailLevel
): number {
    if (!(durationSec > 0) || maxTicks < 2) {
        return Math.max(1, durationSec);
    }
    const targetTicks = Math.max(2, maxTicks);
    let ideal = durationSec / targetTicks;
    switch (timeDetailLevel) {
        case TimeDetailLevel.High:
            ideal *= 0.5;
            break;
        case TimeDetailLevel.Medium:
            ideal *= 1.1;
            break;
        case TimeDetailLevel.Low:
            ideal *= 2.2;
            break;
        case TimeDetailLevel.Auto:
        default:
            break;
    }

    let step = NICE_STEPS_SEC_ASC[NICE_STEPS_SEC_ASC.length - 1]!;
    for (const s of NICE_STEPS_SEC_ASC) {
        if (s >= ideal) {
            step = s;
            break;
        }
    }

    while (durationSec / step > maxTicks + 0.5) {
        const next = nextNiceStep(step);
        if (next <= step) {
            break;
        }
        step = next;
    }

    while (durationSec / step < 2 && step > NICE_STEPS_SEC_ASC[0]!) {
        const prev = prevNiceStep(step);
        if (prev >= step) {
            break;
        }
        step = prev;
    }

    return Math.max(1, step);
}

/**
 * Classify a Unix timestamp (seconds, UTC-adjusted) into its boundary level:
 *   3 = year boundary (Jan 1, 00:00)
 *   2 = month boundary (1st of month, 00:00)
 *   1 = day boundary (midnight 00:00)
 *   0 = no boundary (regular tick)
 *
 * We work in UTC so the boundary check is timezone-agnostic at this stage;
 * actual label text will still use Intl (which handles timezone).
 */
function boundaryLevel(tSec: number, tzOffset: number = 0): 0 | 1 | 2 | 3 {
    // Shift to "local" time for boundary detection
    const local = tSec + tzOffset;
    const d = new Date(local * 1000);
    // Use UTC methods since we already shifted
    const month = d.getUTCMonth();   // 0-based
    const day   = d.getUTCDate();    // 1-based
    const hour  = d.getUTCHours();
    const min   = d.getUTCMinutes();
    const sec   = d.getUTCSeconds();

    const isMidnight = hour === 0 && min === 0 && sec === 0;
    if (!isMidnight) return 0;
    if (day === 1 && month === 0) return 3; // Jan 1
    if (day === 1) return 2;                 // 1st of any other month
    return 1;                                // midnight but not month/year start
}

/**
 * Build Intl options for the *regular* (non-boundary) label at a given step.
 * Boundary ticks override this with a promoted format.
 */
function regularIntlOpts(
    stepSec: number,
    timeFormat12h: boolean
): Intl.DateTimeFormatOptions {
    if (stepSec < MIN) {
        return { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: timeFormat12h };
    }
    if (stepSec < HOUR) {
        return { hour: '2-digit', minute: '2-digit', hour12: timeFormat12h };
    }
    if (stepSec < DAY) {
        // Intraday: just show time. Boundary midnight will be promoted to date.
        return { hour: '2-digit', minute: '2-digit', hour12: timeFormat12h };
    }
    if (stepSec < 14 * DAY) {
        // Daily: show day number inside a month context
        // Boundary (1st of month) will be promoted to month name.
        return { day: 'numeric' };
    }
    if (stepSec < 60 * DAY) {
        // Multi-day / weekly: short date
        return { month: 'short', day: 'numeric' };
    }
    if (stepSec < 400 * DAY) {
        // Monthly steps: show month name only; year boundary promoted to YYYY
        return { month: 'short' };
    }
    // Multi-year
    return { year: 'numeric' };
}

/**
 * Build Intl options for a PROMOTED (boundary) label.
 *   level 3 → year ("2026")
 *   level 2 → month name ("Mar") — or "Mar '25" when cross-year context needed
 *   level 1 → date ("Mar 30" / "30 Mar")
 */
function boundaryIntlOpts(
    level: 0 | 1 | 2 | 3,
    stepSec: number,
    dateFormat: string,
    crossYear: boolean
): Intl.DateTimeFormatOptions {
    const fmt = (dateFormat || '').toLowerCase();
    const isDMY = fmt.startsWith('d');

    if (level === 3) {
        return { year: 'numeric' };
    }
    if (level === 2) {
        // Month start: normally just "Mar"; add '25 if mixed years visible
        if (crossYear) return { month: 'short', year: '2-digit' };
        return { month: 'short' };
    }
    // level === 1: day boundary (midnight). Show date.
    // For small steps (< DAY) show month + day; for day-level steps also just month name at month start.
    if (stepSec < DAY) {
        // Intraday steps crossing midnight → "Mar 30" / "30 Mar"
        if (isDMY) return { day: 'numeric', month: 'short' };
        return { month: 'short', day: 'numeric' };
    }
    // Day-level step at non-month-start: ordinarily shows day number, promote to "Mar 30"
    if (isDMY) return { day: 'numeric', month: 'short' };
    return { month: 'short', day: 'numeric' };
}

function getYMDInZone(tSec: number, timezone: string | undefined): {y: number; m: number; d: number} {
    const opts: Intl.DateTimeFormatOptions = {year: 'numeric', month: '2-digit', day: '2-digit'};
    if (timezone) {
        opts.timeZone = timezone;
    }
    const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(new Date(tSec * 1000));
    const y = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const m = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
    const d = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
    return {y, m, d};
}

/**
 * Build X ticks from **[startSec, endSec]** only; positions are linear in visible time.
 * Implements TradingView-style boundary-upgraded labels.
 */
function buildVisibleRangeTicks(
    startSec: number,
    endSec: number,
    canvasWidth: number,
    maxTicks: number,
    timeDetailLevel: TimeDetailLevel,
    timeFormat12h: boolean,
    locale: string,
    timezone: string | undefined,
    dateFormat: string
): Tick[] {
    const durationSec = endSec - startSec;
    if (!(durationSec > 0) || canvasWidth <= 0) {
        return [];
    }

    const step = pickStepSeconds(durationSec, maxTicks, timeDetailLevel);

    const regularOpts  = regularIntlOpts(step, timeFormat12h);

    const firstTick = Math.ceil(startSec / step) * step;
    const ticks: Tick[] = [];
    const eps = step * 1e-9;

    for (let t = firstTick; t <= endSec + eps; t += step) {
        const pos = ((t - startSec) / durationSec) * canvasWidth;
        if (pos < -0.5 || pos > canvasWidth + 0.5) continue;

        // Transition-based promotion: works even when the grid isn't aligned to midnight / 1st-of-month.
        // The promoted label appears on the FIRST tick after a boundary.
        const prev = getYMDInZone(t - step, timezone);
        const cur = getYMDInZone(t, timezone);
        const yearChanged = cur.y !== prev.y;
        const monthChanged = yearChanged || cur.m !== prev.m;
        const dayChanged = monthChanged || cur.d !== prev.d;

        let opts: Intl.DateTimeFormatOptions = regularOpts;

        // Month-ish grids (30d/60d/90d/180d): show "2025" on first tick in the new year, then "Feb", "Mar", ...
        if (step >= 25 * DAY && step < 365 * DAY) {
            opts = yearChanged ? {year: 'numeric'} : {month: 'short'};
        } else if (step >= DAY && step < 25 * DAY) {
            // Day-ish grids (1d/2d/3d/7d/14d): show month name on first tick in the new month, otherwise day number.
            if (yearChanged) opts = {year: 'numeric'};
            else if (monthChanged) opts = {month: 'short'};
            else opts = {day: 'numeric'};
        } else if (step < DAY) {
            // Intraday: show date on first tick in the new day (or month/year), otherwise time.
            if (yearChanged || monthChanged || dayChanged) {
                opts = boundaryIntlOpts(1, step, dateFormat, yearChanged);
            }
        } else if (step >= 365 * DAY) {
            opts = {year: 'numeric'};
        }

        const label = formatWithTimezone(t, opts, locale, timezone);

        ticks.push({ position: pos, label });
    }

    if (ticks.length === 0) {
        ticks.push(
            { position: 0,           label: formatWithTimezone(startSec, regularOpts, locale, timezone) },
            { position: canvasWidth, label: formatWithTimezone(endSec,   regularOpts, locale, timezone) }
        );
    }

    return ticks;
}

/**
 * What boundary level do we actually promote at this step size?
 * At very large steps we don't want to promote every midnight.
 *   step < 1 day  → promote day (1), month (2), year (3)
 *   step < 14 day → promote month (2), year (3)
 *   step < 1 year → promote year (3) only
 *   step ≥ 1 year → nothing (regular labels are already year-level)
 */
function stepBoundaryThreshold(stepSec: number): 0 | 1 | 2 | 3 {
    if (stepSec < DAY)       return 0; // promote day+month+year
    if (stepSec < 14 * DAY) return 1; // promote month+year only
    if (stepSec < 365 * DAY) return 2; // promote year only
    return 3; // nothing to promote (already showing years)
}

/**
 * Approximate the timezone UTC offset in seconds at a given timestamp.
 * Uses Intl to determine the offset for the target timezone.
 */
function getTimezoneOffsetSec(tSec: number, _locale: string, timezone: string | undefined): number {
    if (!timezone) {
        // Use local system timezone
        return -(new Date(tSec * 1000).getTimezoneOffset() * 60);
    }
    try {
        const d = new Date(tSec * 1000);
        // Trick: format two representations and compute the offset
        const utcStr  = d.toLocaleString('en-US', { timeZone: 'UTC', hour12: false,
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const tzStr   = d.toLocaleString('en-US', { timeZone: timezone, hour12: false,
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const toSec = (s: string) => {
            // parse "MM/DD/YYYY, HH:MM:SS"
            const [datePart, timePart] = s.split(', ');
            if (!datePart || !timePart) return 0;
            const [mo, da, yr] = datePart.split('/').map(Number);
            const [hh, mm, ss] = timePart.split(':').map(Number);
            return Date.UTC(yr!, mo! - 1, da!, hh!, mm!, ss!) / 1000;
        };
        return toSec(tzStr) - toSec(utcStr);
    } catch {
        return 0;
    }
}


export function generateAndDrawTimeTicks(
    canvas: HTMLCanvasElement,
    timeRange: TimeRange,
    numberOfXTicks: number,
    /** User's regional date format string (e.g. 'dd/MM/yyyy', 'MMM d, yyyy'). Used to determine date order on day-level ticks. */
    dateFormat: string,
    timeFormat12h: boolean,
    xAxisHeight: number,
    strokeStyle: string,
    timeDetailLevel: TimeDetailLevel,
    options: DrawTicksOptions,
    locale: string = 'en-US',
    timezone?: string,
    /** Prefer layout width from {@link getBoundingClientRect} so ticks match the visible span even when `clientWidth` is briefly 0. */
    cssWidthOverride?: number
): Tick[] {
    const {start, end} = timeRange;
    const canvasWidth = cssWidthOverride != null && cssWidthOverride > 0 ? cssWidthOverride : canvas.clientWidth;

    if (start >= end || canvasWidth <= 0 || numberOfXTicks <= 0) {
        return [];
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    const durationSec = end - start;
    const minPxPerTick = 88; // wide enough for "Mar 30" / "14:00" labels without crowding
    const maxTicks = Math.min(numberOfXTicks, targetTickCount(canvasWidth, minPxPerTick, numberOfXTicks));

    const {
        tickHeight = 10,
        tickColor = strokeStyle,
        labelColor = strokeStyle,
        labelFont = `${TICK_FONT_SIZE_PX}px Arial`,
        labelOffset = 15,
        axisY = canvas.clientHeight - xAxisHeight,
    } = options;

    const ticks = buildVisibleRangeTicks(
        start,
        end,
        canvasWidth,
        maxTicks,
        timeDetailLevel,
        timeFormat12h,
        locale,
        timezone,
        dateFormat
    );

    if (ticks.length === 0) {
        return [];
    }

    drawXTicks(ctx, canvasWidth, ticks, tickHeight, tickColor, labelColor, labelFont, labelOffset, axisY);
    return ticks;
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

    // drawing each tick and its label (density is controlled in buildVisibleRangeTicks, not here)
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

        if (i === 0 && xPos - w / 2 < 2) {
            xPos = w / 2 + 2;
        } else if (i === ticks.length - 1 && xPos + w / 2 > canvasWidth - 2) {
            xPos = canvasWidth - w / 2 - 2;
        }

        ctx.fillText(tick.label, xPos, axisY + labelOffset + 5);
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
