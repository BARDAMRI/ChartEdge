import {TradingSession} from "../types/chartOptions";

/**
 * Formats a timestamp into a human-readable date/time string with timezone support.
 */
export function formatWithTimezone(
    timestamp: number,
    formatOptions: Intl.DateTimeFormatOptions,
    locale: string = 'en-US',
    timezone?: string
): string {
    const date = new Date(timestamp * 1000);
    const options = { ...formatOptions };
    if (timezone) {
        options.timeZone = timezone;
    }
    return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Checks if a given timestamp is within any of the provided trading sessions.
 */
export function isWithinTradingSession(timestamp: number, sessions: TradingSession[], timezone?: string): boolean {
    if (!sessions || sessions.length === 0) return true;

    // Get date/time components in the target timezone
    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'narrow' as any, // 0-6 is not directly available, but we can get day of week
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone
    };
    
    // We need the day of week as a number (0-6)
    // Intl.DateTimeFormat doesn't easily give day of week as 0-6 without extra steps.
    // Use the hack of formatting to a specific locale or just using UTC if no TZ.
    
    const tzDateStr = date.toLocaleString('en-US', { timeZone: timezone });
    const tzDate = new Date(tzDateStr);
    const dayOfWeek = tzDate.getDay();
    const hours = tzDate.getHours();
    const minutes = tzDate.getMinutes();
    const timeVal = hours * 60 + minutes;

    return sessions.some(s => {
        if (s.dayOfWeek !== dayOfWeek) return false;
        const [sHours, sMinutes] = s.start.split(':').map(Number);
        const [eHours, eMinutes] = s.end.split(':').map(Number);
        const sTime = sHours * 60 + sMinutes;
        const eTime = eHours * 60 + eMinutes;
        return timeVal >= sTime && timeVal <= eTime;
    });
}
