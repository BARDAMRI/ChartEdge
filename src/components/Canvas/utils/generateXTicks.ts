// ================================
// TYPE DEFINITIONS & INTERFACES
// ================================

/**
 * @typedef {Object} Candle
 * @property {number} t - Timestamp (Unix timestamp in seconds)
 * @property {number} o - Open price
 * @property {number} c - Close price
 * @property {number} h - High price
 * @property {number} l - Low price
 */

/**
 * @typedef {Object} CanvasDimensions
 * @property {number} width - Canvas width in pixels
 * @property {number} height - Canvas height in pixels
 */

/**
 * @typedef {Object} TickOptions
 * @property {'standard'|'ui-friendly'} labelType - Label formatting type
 * @property {'dd/mm/yy'|'mm/dd/yy'|'yyyy-mm-dd'} [dateFormat] - Date format for standard labels
 * @property {'hh:mm'|'hh:mm:ss'|'HH:MM'} [timeFormat] - Time format for standard labels
 * @property {string} [locale] - Locale for internationalization
 */

/**
 * @typedef {Object} Tick
 * @property {string} label - Display label for the tick
 * @property {number} x - X position on canvas in pixels
 * @property {number} timestamp - Unix timestamp of the tick
 * @property {'minute'|'hour'|'day'|'week'|'month'|'year'} [type] - Type for UI-friendly labels
 */

/**
 * @typedef {Object} TimeRange
 * @property {number} start - Start timestamp (Unix seconds)
 * @property {number} end - End timestamp (Unix seconds)
 */

/**
 * @typedef {Object} ParsedTimeRange
 * @property {number} value - Numeric value (e.g., 1, 5, 30)
 * @property {string} unit - Time unit (minutes, hours, days, etc.)
 * @property {number} seconds - Total seconds in the range
 */

// ================================
// ENUMS & CONSTANTS
// ================================

const TIME_RANGE_PATTERNS = {
    // Minutes
    '1m': { value: 1, unit: 'minutes', seconds: 60 },
    '2m': { value: 2, unit: 'minutes', seconds: 120 },
    '5m': { value: 5, unit: 'minutes', seconds: 300 },
    '15m': { value: 15, unit: 'minutes', seconds: 900 },
    '30m': { value: 30, unit: 'minutes', seconds: 1800 },

    // Hours
    '1h': { value: 1, unit: 'hours', seconds: 3600 },
    '2h': { value: 2, unit: 'hours', seconds: 7200 },
    '4h': { value: 4, unit: 'hours', seconds: 14400 },
    '6h': { value: 6, unit: 'hours', seconds: 21600 },
    '12h': { value: 12, unit: 'hours', seconds: 43200 },

    // Days
    '1d': { value: 1, unit: 'days', seconds: 86400 },
    '3d': { value: 3, unit: 'days', seconds: 259200 },
    '5d': { value: 5, unit: 'days', seconds: 432000 },

    // Weeks
    '1w': { value: 1, unit: 'weeks', seconds: 604800 },
    '2w': { value: 2, unit: 'weeks', seconds: 1209600 },

    // Months (approximate)
    '1M': { value: 1, unit: 'months', seconds: 2629746 },
    '3M': { value: 3, unit: 'months', seconds: 7889238 },
    '6M': { value: 6, unit: 'months', seconds: 15778476 },

    // Years
    '1y': { value: 1, unit: 'years', seconds: 31556952 },
    '2y': { value: 2, unit: 'years', seconds: 63113904 },
    '5y': { value: 5, unit: 'years', seconds: 157784760 }
};

const TICK_INTERVALS = {
    MINUTE_1: 60,
    MINUTE_2: 120,
    MINUTE_5: 300,
    MINUTE_10: 600,
    MINUTE_15: 900,
    MINUTE_30: 1800,
    HOUR_1: 3600,
    HOUR_2: 7200,
    HOUR_4: 14400,
    HOUR_6: 21600,
    HOUR_12: 43200,
    DAY_1: 86400,
    DAY_5: 432000,
    WEEK_1: 604800,
    WEEK_2: 1209600,
    MONTH_1: 2629746
};

// Pre-sorted for binary search optimization
const TICK_INTERVAL_HIERARCHY = [
    TICK_INTERVALS.MINUTE_1,
    TICK_INTERVALS.MINUTE_2,
    TICK_INTERVALS.MINUTE_5,
    TICK_INTERVALS.MINUTE_10,
    TICK_INTERVALS.MINUTE_15,
    TICK_INTERVALS.MINUTE_30,
    TICK_INTERVALS.HOUR_1,
    TICK_INTERVALS.HOUR_2,
    TICK_INTERVALS.HOUR_4,
    TICK_INTERVALS.HOUR_6,
    TICK_INTERVALS.HOUR_12,
    TICK_INTERVALS.DAY_1,
    TICK_INTERVALS.DAY_5,
    TICK_INTERVALS.WEEK_1,
    TICK_INTERVALS.WEEK_2,
    TICK_INTERVALS.MONTH_1
];

export enum LABEL_TYPE {
    STANDARD,
    UI_FRIENDLY
}

const UI_LABEL_TYPES = {
    MINUTE: 'minute',
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
};

interface TicksOptions {
    labelType?: LABEL_TYPE;
    dateFormat?: 'dd/mm/yy' | 'mm/dd/yy' | 'yyyy-mm-dd';
    timeFormat?: 'hh:mm' | 'hh:mm:ss' | 'HH:MM';
    locale?: string; // e.g., 'en-US', 'he-IL'
}

const DEFAULT_OPTIONS: TicksOptions = {
    labelType: LABEL_TYPE.STANDARD,
    dateFormat: 'dd/mm/yy',
    timeFormat: 'hh:mm',
    locale: 'en-US'
};

// ================================
// FORMATTER CACHE
// ================================

const formatterCache = new Map();

function getFormatter(locale, formatOptions) {
    const key = `${locale}_${JSON.stringify(formatOptions)}`;
    if (!formatterCache.has(key)) {
        formatterCache.set(key, new Intl.DateTimeFormat(locale, formatOptions));
    }
    return formatterCache.get(key);
}

// ================================
// MAIN FUNCTION - OPTIMIZED
// ================================

/**
 * Generates X-axis ticks for time-based charts with intelligent spacing and labeling
 *
 * @param {string} timeRange - Time range specification (e.g., '1d', '1w', '1M', '1y')
 * @param {number|'auto'} minMaxTicks - Min/max ticks requirement or 'auto' for automatic
 * @param {Candle[]} candlesData - Array of candle objects with t,o,c,h,l properties
 * @param {CanvasDimensions} canvasDimensions - Canvas width and height in pixels
 * @param {number} textSizePixels - Text size in pixels for label width calculations
 * @param {TickOptions} [options] - Optional formatting and localization options
 * @returns {Tick[]} Array of tick objects with label, x position, and timestamp
 */
export function generateXTicks(timeRange, minMaxTicks, candlesData, canvasDimensions, textSizePixels, options:TicksOptions = {}) {

    // Performance profiling start
    const startTime = performance.now();

    // ================================
    // 1. INPUT VALIDATION
    // ================================

    if (!timeRange || typeof timeRange !== 'string') {
        throw new Error('Invalid timeRange: must be a string like "1d", "1w", etc.');
    }

    if (!TIME_RANGE_PATTERNS[timeRange]) {
        throw new Error(`Unsupported timeRange: ${timeRange}`);
    }

    if (!Array.isArray(candlesData) || candlesData.length === 0) {
        return [];
    }

    if (!canvasDimensions || canvasDimensions.width <= 0 || canvasDimensions.height <= 0) {
        throw new Error('Invalid canvasDimensions');
    }

    if (textSizePixels <= 0) {
        textSizePixels = 12; // default
    }

    // Merge with default options
    options = { ...DEFAULT_OPTIONS, ...options };

    // ================================
    // 2. DATA VALIDATION & PREPROCESSING
    // ================================

    // Filter out invalid candles
    const validCandles = candlesData.filter(candle =>
        candle != null &&
        typeof candle.t === 'number' &&
        typeof candle.o === 'number' &&
        typeof candle.c === 'number' &&
        typeof candle.h === 'number' &&
        typeof candle.l === 'number' &&
        candle.t > 0
    );

    if (validCandles.length === 0) {
        return [];
    }

    // Sort candles by timestamp ascending
    validCandles.sort((a, b) => a.t - b.t);

    // ================================
    // 3. CALCULATE ACTUAL TIME RANGE
    // ================================

    const parsedRange = TIME_RANGE_PATTERNS[timeRange];
    const latestCandleTime = validCandles[validCandles.length - 1].t;
    const calculatedTimeRange = {
        end: latestCandleTime,
        start: latestCandleTime - parsedRange.seconds
    };

    // Filter candles within the calculated time range
    const candlesInRange = validCandles.filter(candle =>
        candle.t >= calculatedTimeRange.start && candle.t <= calculatedTimeRange.end
    );

    if (candlesInRange.length === 0) {
        return [];
    }

    // Update time range to actual data boundaries if needed
    const actualTimeRange = {
        start: Math.max(calculatedTimeRange.start, candlesInRange[0].t),
        end: Math.min(calculatedTimeRange.end, candlesInRange[candlesInRange.length - 1].t)
    };

    // ================================
    // 4. PERFORMANCE OPTIMIZATIONS - PRECOMPUTE VALUES
    // ================================

    const timeSpanSeconds = actualTimeRange.end - actualTimeRange.start;

    // OPTIMIZATION 2: Cache estimated label width calculation
    const estimatedLabelWidth = calculateEstimatedLabelWidth(textSizePixels, options.labelType, parsedRange);
    const minSpacingPixels = estimatedLabelWidth + 20; // padding between labels
    const maxPossibleTicks = Math.floor(canvasDimensions.width / minSpacingPixels);

    // OPTIMIZATION 3: Precompute pixel-per-second ratio
    const pixelPerSecond = canvasDimensions.width / timeSpanSeconds;

    // ================================
    // 5. DETERMINE OPTIMAL TICK INTERVAL
    // ================================

    // Determine target number of ticks
    const targetTicks = determineTargetTickCount(minMaxTicks, maxPossibleTicks, parsedRange);

    // OPTIMIZATION 5: Use binary search for interval selection
    const optimalTickInterval = selectOptimalTickIntervalBinary(timeSpanSeconds, targetTicks, TICK_INTERVAL_HIERARCHY);

    // ================================
    // 6. GENERATE TICK POSITIONS - OPTIMIZED
    // ================================

    // Align start time to interval boundaries for clean ticks
    const alignedStartTime = alignTimeToInterval(actualTimeRange.start, optimalTickInterval);

    const rawTicks = [];
    let currentTime = alignedStartTime;
    let previousLabelInfo = null;

    while (currentTime <= actualTimeRange.end && rawTicks.length < maxPossibleTicks) {

        if (currentTime >= actualTimeRange.start) {

            // OPTIMIZATION 3: Use precomputed pixelPerSecond
            const xPosition = Math.floor((currentTime - actualTimeRange.start) * pixelPerSecond);

            // Store minimal tick info first (defer label generation)
            const tickInfo = {
                timestamp: currentTime,
                x: xPosition,
                interval: optimalTickInterval,
                previousLabelInfo: previousLabelInfo
            };

            rawTicks.push(tickInfo);
        }

        // Move to next tick position
        currentTime = currentTime + optimalTickInterval;
    }

    // ================================
    // 7. POST-PROCESSING & OPTIMIZATION
    // ================================

    // OPTIMIZATION 8: Ensure minimum spacing before label generation
    const spacedTicks = ensureMinimumSpacingOptimized(rawTicks, minSpacingPixels);

    // OPTIMIZATION 7: Delay label formatting until after filtering
    const finalTicks = [];
    let prevLabelInfo = null;

    for (const tickInfo of spacedTicks) {
        // OPTIMIZATION 1: Create Date object once per tick
        const date = new Date(tickInfo.timestamp * 1000);

        // Generate label with reused Date object
        const labelInfo = generateTickLabelOptimized(date, tickInfo.timestamp, tickInfo.interval, options, prevLabelInfo);

        const tick = {
            label: labelInfo.text,
            x: tickInfo.x,
            timestamp: tickInfo.timestamp,
            type: labelInfo.type || null
        };

        finalTicks.push(tick);
        prevLabelInfo = labelInfo;
    }

    // OPTIMIZATION 4: Optimize UI-friendly label removal with forward loop
    if (options.labelType === LABEL_TYPE.UI_FRIENDLY) {
        optimizeUIFriendlyLabelsOptimized(finalTicks, optimalTickInterval, parsedRange);
    }

    // Validate final output
    if (finalTicks.length === 0) {
        return createFallbackTicks(actualTimeRange, canvasDimensions.width, options);
    }

    // Performance profiling end
    const endTime = performance.now();
    if (typeof console !== 'undefined' && console.log) {
        console.log(`Tick generation took ${(endTime - startTime).toFixed(2)}ms`);
    }

    return finalTicks;
}

// ================================
// OPTIMIZED HELPER FUNCTIONS
// ================================

function calculateEstimatedLabelWidth(textSize, labelType, parsedRange) {
    if (labelType === LABEL_TYPE.STANDARD) {
        if (parsedRange.unit === 'minutes' || parsedRange.unit === 'hours') {
            return textSize * 5; // "HH:MM"
        } else {
            return textSize * 8; // "DD/MM/YY"
        }
    } else { // UI_FRIENDLY
        return textSize * 4; // "MMM", "DD", "HH"
    }
}

function determineTargetTickCount(minMaxTicks, maxPossible, parsedRange) {
    if (minMaxTicks === 'auto') {
        // Smart defaults based on time range
        switch (parsedRange.unit) {
            case 'minutes':
            case 'hours':
                return Math.min(8, maxPossible);
            case 'days':
                if (parsedRange.value <= 5) {
                    return Math.min(parsedRange.value, maxPossible);
                } else {
                    return Math.min(7, maxPossible);
                }
            case 'weeks':
                return Math.min(7, maxPossible);
            case 'months':
                return Math.min(12, maxPossible);
            case 'years':
                return Math.min(5, maxPossible);
            default:
                return Math.min(6, maxPossible);
        }
    } else {
        return Math.min(minMaxTicks, maxPossible);
    }
}

// OPTIMIZATION 5: Binary search for interval selection
function selectOptimalTickIntervalBinary(timeSpan, targetTicks, intervalHierarchy) {
    const idealInterval = timeSpan / Math.max(targetTicks - 1, 1);

    let left = 0;
    let right = intervalHierarchy.length - 1;
    let result = intervalHierarchy[right]; // fallback to largest

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const interval = intervalHierarchy[mid];

        if (interval >= idealInterval) {
            result = interval;
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }

    return result;
}

function alignTimeToInterval(timestamp, interval) {
    const date = new Date(timestamp * 1000);

    switch (interval) {
        case TICK_INTERVALS.MINUTE_1:
        case TICK_INTERVALS.MINUTE_2:
        case TICK_INTERVALS.MINUTE_5:
        case TICK_INTERVALS.MINUTE_10:
        case TICK_INTERVALS.MINUTE_15:
        case TICK_INTERVALS.MINUTE_30:
            return roundDownToMinuteBoundary(timestamp, interval / 60);

        case TICK_INTERVALS.HOUR_1:
        case TICK_INTERVALS.HOUR_2:
        case TICK_INTERVALS.HOUR_4:
        case TICK_INTERVALS.HOUR_6:
        case TICK_INTERVALS.HOUR_12:
            return roundDownToHourBoundary(timestamp, interval / 3600);

        case TICK_INTERVALS.DAY_1:
        case TICK_INTERVALS.DAY_5:
            return startOfDay(timestamp);

        case TICK_INTERVALS.WEEK_1:
        case TICK_INTERVALS.WEEK_2:
            return startOfWeek(timestamp);

        case TICK_INTERVALS.MONTH_1:
            return startOfMonth(timestamp);

        default:
            return timestamp;
    }
}

function roundDownToMinuteBoundary(timestamp, minuteInterval) {
    const date = new Date(timestamp * 1000);
    const minutes = date.getMinutes();
    const alignedMinutes = Math.floor(minutes / minuteInterval) * minuteInterval;

    date.setMinutes(alignedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return Math.floor(date.getTime() / 1000);
}

function roundDownToHourBoundary(timestamp, hourInterval) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const alignedHours = Math.floor(hours / hourInterval) * hourInterval;

    date.setHours(alignedHours);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return Math.floor(date.getTime() / 1000);
}

function startOfDay(timestamp) {
    const date = new Date(timestamp * 1000);
    date.setHours(0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
}

function startOfWeek(timestamp) {
    const date = new Date(timestamp * 1000);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
}

function startOfMonth(timestamp) {
    const date = new Date(timestamp * 1000);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
}

// OPTIMIZATION 1: Accept pre-created Date object to avoid repeated creation
function generateTickLabelOptimized(date, timestamp, interval, options, previousLabelInfo) {
    if (options.labelType === LABEL_TYPE.STANDARD) {
        return generateStandardLabelOptimized(date, interval, options);
    } else {
        return generateUIFriendlyLabelOptimized(date, interval, options, previousLabelInfo);
    }
}

// OPTIMIZATION 6: Use Intl formatters with caching
function generateStandardLabelOptimized(date, interval, options) {
    if (interval < TICK_INTERVALS.DAY_1) {
        // Show time for intraday intervals
        const timeFormatter = getFormatter(options.locale, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        return {
            text: timeFormatter.format(date),
            type: UI_LABEL_TYPES.HOUR
        };
    } else {
        // Show date for daily and longer intervals
        const dateFormatter = getFormatter(options.locale, {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        return {
            text: dateFormatter.format(date),
            type: UI_LABEL_TYPES.DAY
        };
    }
}

function generateUIFriendlyLabelOptimized(date, interval, options, previousLabelInfo) {
    // Determine what level of detail to show based on interval
    if (interval < TICK_INTERVALS.HOUR_1) {
        // Minutes level
        if (isStartOfHour(date)) {
            return { text: formatHour(date), type: UI_LABEL_TYPES.HOUR };
        } else {
            return { text: formatMinute(date), type: UI_LABEL_TYPES.MINUTE };
        }
    } else if (interval < TICK_INTERVALS.DAY_1) {
        // Hours level
        if (isStartOfDay(date)) {
            return { text: formatDay(date), type: UI_LABEL_TYPES.DAY };
        } else {
            return { text: formatHour(date), type: UI_LABEL_TYPES.HOUR };
        }
    } else if (interval < TICK_INTERVALS.MONTH_1) {
        // Days level
        if (isStartOfMonth(date)) {
            return { text: formatMonth(date), type: UI_LABEL_TYPES.MONTH };
        } else if (isStartOfWeek(date) && interval >= TICK_INTERVALS.WEEK_1) {
            return { text: formatDay(date), type: UI_LABEL_TYPES.DAY };
        } else {
            return { text: formatDay(date), type: UI_LABEL_TYPES.DAY };
        }
    } else {
        // Months and longer
        if (isStartOfYear(date)) {
            return { text: formatYear(date), type: UI_LABEL_TYPES.YEAR };
        } else {
            return { text: formatMonth(date), type: UI_LABEL_TYPES.MONTH };
        }
    }
}

function formatHour(date) {
    return date.getHours().toString().padStart(2, '0');
}

function formatMinute(date) {
    return date.getMinutes().toString().padStart(2, '0');
}

function formatDay(date) {
    return date.getDate().toString().padStart(2, '0');
}

function formatMonth(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
}

function formatYear(date) {
    return date.getFullYear().toString();
}

function isStartOfHour(date) {
    return date.getMinutes() === 0 && date.getSeconds() === 0;
}

function isStartOfDay(date) {
    return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
}

function isStartOfWeek(date) {
    return date.getDay() === 1 && isStartOfDay(date); // Monday
}

function isStartOfMonth(date) {
    return date.getDate() === 1 && isStartOfDay(date);
}

function isStartOfYear(date) {
    return date.getMonth() === 0 && isStartOfMonth(date);
}

// OPTIMIZATION 4: Forward loop to avoid splice performance issues
function optimizeUIFriendlyLabelsOptimized(ticks, interval, parsedRange) {
    if (ticks.length <= 1) return ticks;

    const filteredTicks = [];

    for (let i = 0; i < ticks.length; i++) {
        const currentTick = ticks[i];
        const shouldKeep = i === 0 ||
            currentTick.type !== ticks[i - 1].type ||
            currentTick.type === UI_LABEL_TYPES.DAY ||
            currentTick.type === UI_LABEL_TYPES.HOUR;

        if (shouldKeep) {
            filteredTicks.push(currentTick);
        }
    }

    // Replace original array contents
    ticks.length = 0;
    ticks.push(...filteredTicks);
}

// OPTIMIZATION 8: Optimized spacing check that works with raw tick info
function ensureMinimumSpacingOptimized(rawTicks, minSpacing) {
    if (rawTicks.length <= 1) return rawTicks;

    const result = [rawTicks[0]];

    for (let i = 1; i < rawTicks.length; i++) {
        const lastTick = result[result.length - 1];
        if (rawTicks[i].x - lastTick.x >= minSpacing) {
            result.push(rawTicks[i]);
        }
    }

    return result;
}

function createFallbackTicks(timeRange, canvasWidth, options) {
    // Create minimal fallback ticks at start and end
    const startDate = new Date(timeRange.start * 1000);
    const endDate = new Date(timeRange.end * 1000);

    const timeFormatter = getFormatter(options.locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return [
        {
            label: timeFormatter.format(startDate),
            x: 0,
            timestamp: timeRange.start,
            type: UI_LABEL_TYPES.HOUR
        },
        {
            label: timeFormatter.format(endDate),
            x: canvasWidth,
            timestamp: timeRange.end,
            type: UI_LABEL_TYPES.HOUR
        }
    ];
}