import { Tick } from "../../../types/Graph";

type TimeDetailLevel = 'auto' | 'low' | 'medium' | 'high';

export function generateTimeTicks(
    startTime: number,
    endTime: number,
    canvasWidth: number,
    timeDetailLevel: TimeDetailLevel,
    timeFormat12h: boolean,
    minPixelPerTick = 60,
): Tick[] {
    const ticks: Tick[] = [];
    const rangeMs = endTime - startTime;

    // Calculate time span in days
    const timeSpanDays = rangeMs / (24 * 60 * 60 * 1000);

    // Determine appropriate tick interval based on time span
    let interval: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
    let intervalStep = 1;

    if (timeSpanDays > 365 * 2) {
        interval = 'year';
        intervalStep = Math.ceil(timeSpanDays / 365 / 10); // Show approximately 10 years
    } else if (timeSpanDays > 60) {
        interval = 'month';
        intervalStep = Math.ceil(timeSpanDays / 30 / 12); // Show approximately 12 months
    } else if (timeSpanDays > 10) {
        interval = 'day';
        intervalStep = Math.ceil(timeSpanDays / 10); // Show approximately 10 days
    } else if (timeSpanDays > 1) {
        interval = 'hour';
        intervalStep = Math.ceil(timeSpanDays * 24 / 12); // Show approximately 12 hours
    } else if (timeSpanDays > 0.04) { // ~1 hour
        interval = 'minute';
        intervalStep = Math.ceil(timeSpanDays * 24 * 60 / 15); // Show approximately every 15 minutes
    } else {
        interval = 'second';
        intervalStep = Math.ceil(timeSpanDays * 24 * 60 * 60 / 15); // Show approximately every 15 seconds
    }

    // Override with user-selected detail level if not auto
    if (timeDetailLevel !== 'auto') {
        switch (timeDetailLevel) {
            case 'low':
                if (interval === 'year') intervalStep = Math.max(intervalStep, 2);
                else if (interval === 'month') interval = 'year';
                else if (interval === 'day') interval = 'month';
                else if (interval === 'hour') interval = 'day';
                else if (interval === 'minute') interval = 'hour';
                else interval = 'minute';
                break;
            case 'medium':
                // Keep default interval but maybe adjust step
                break;
            case 'high':
                if (interval === 'year') interval = 'month';
                else if (interval === 'month') interval = 'day';
                else if (interval === 'day') interval = 'hour';
                else if (interval === 'hour') interval = 'minute';
                else if (interval === 'minute') interval = 'second';
                intervalStep = 1;
                break;
        }
    }

    // Calculate max ticks based on canvas width
    const maxTicks = Math.floor(canvasWidth / minPixelPerTick);

    // Generate ticks based on interval
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Function to get next tick date based on interval
    function getNextTickDate(date: Date): Date {
        const newDate = new Date(date);
        switch (interval) {
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + intervalStep);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + intervalStep);
                break;
            case 'day':
                newDate.setDate(newDate.getDate() + intervalStep);
                break;
            case 'hour':
                newDate.setHours(newDate.getHours() + intervalStep);
                break;
            case 'minute':
                newDate.setMinutes(newDate.getMinutes() + intervalStep);
                break;
            case 'second':
                newDate.setSeconds(newDate.getSeconds() + intervalStep);
                break;
        }
        return newDate;
    }

    // Function to format date based on interval
    function formatTickLabel(date: Date): string {
        switch (interval) {
            case 'year':
                return date.getFullYear().toString();
            case 'month':
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });
            case 'day':
                return date.toLocaleString('default', { day: '2-digit', month: 'short' });
            case 'hour':
                return date.toLocaleString('default', { hour12: timeFormat12h, hour: '2-digit', minute: '2-digit' });
            case 'minute':
                return date.toLocaleString('default', { hour12: timeFormat12h, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            case 'second':
                return date.toLocaleString('default', { hour12: timeFormat12h, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    }
    
    // Find first tick (align to interval boundary)
    let currentDate = new Date(startDate);
    switch (interval) {
        case 'year':
            currentDate = new Date(currentDate.getFullYear(), 0, 1);
            break;
        case 'month':
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            break;
        case 'day':
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            break;
        case 'hour':
            currentDate = new Date(
                currentDate.getFullYear(), 
                currentDate.getMonth(), 
                currentDate.getDate(), 
                currentDate.getHours()
            );
            break;
        case 'minute':
            currentDate = new Date(
                currentDate.getFullYear(), 
                currentDate.getMonth(), 
                currentDate.getDate(), 
                currentDate.getHours(),
                Math.floor(currentDate.getMinutes() / intervalStep) * intervalStep
            );
            break;
        case 'second':
            currentDate = new Date(
                currentDate.getFullYear(), 
                currentDate.getMonth(), 
                currentDate.getDate(), 
                currentDate.getHours(),
                currentDate.getMinutes(),
                Math.floor(currentDate.getSeconds() / intervalStep) * intervalStep
            );
            break;
    }
    
    // If first tick is before start time, move to next tick
    if (currentDate.getTime() < startTime) {
        currentDate = getNextTickDate(currentDate);
    }
    
    // Generate ticks until we reach end time
    while (currentDate.getTime() <= endTime) {
        const tickTime = currentDate.getTime();
        const label = formatTickLabel(currentDate);
        
        ticks.push({ time: tickTime, label });
        currentDate = getNextTickDate(currentDate);
        
        // Safety check to prevent infinite loops
        if (ticks.length > 100) break;
    }
    
    // Ensure we don't have too many ticks for the available width
    if (ticks.length > maxTicks) {
        // Sample ticks evenly
        const step = Math.ceil(ticks.length / maxTicks);
        return ticks.filter((_, i) => i % step === 0);
    }
    
    return ticks;
}
