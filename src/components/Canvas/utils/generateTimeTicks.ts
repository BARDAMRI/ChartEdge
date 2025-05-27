type TimeDetailLevel = 'auto' | 'low' | 'medium' | 'high';

interface Tick {
    time: number;      // timestamp UNIX במילישניות
    label: string;     // תצוגת הטיק כטקסט
}

export function generateTimeTicks(
    startTime: number,
    endTime: number,
    canvasWidth: number,
    timeDetailLevel: TimeDetailLevel,
    minPixelPerTick = 60
): Tick[] {
    const ticks: Tick[] = [];
    const rangeMs = endTime - startTime;

    // חשב את המספר המקסימלי של טיקים לפי רוחב הקנבס ומרחק מינימלי בין טיקים
    const maxTicks = Math.floor(canvasWidth / minPixelPerTick);

    // קבע רמת פירוט מספרית בהתאם ל-timeDetailLevel
    let desiredTicksCount: number;
    switch (timeDetailLevel) {
        case 'low':
            desiredTicksCount = 4;  // שנים או חודשים בולטים
            break;
        case 'medium':
            desiredTicksCount = 8;  // חודשים + ימים
            break;
        case 'high':
            desiredTicksCount = 15; // ימים + שעות
            break;
        case 'auto':
        default:
            desiredTicksCount = maxTicks;
    }

    // התאמת מספר הטיקים למקסימום המותר לפי רוחב
    const tickCount = Math.min(desiredTicksCount, maxTicks);

    // פונקציה לעיגול הזמן לפי רמת הפירוט
    function roundTime(date: Date): Date {
        switch (timeDetailLevel) {
            case 'low':
                return new Date(date.getFullYear(), 0, 1);  // תחילת שנה
            case 'medium':
                return new Date(date.getFullYear(), date.getMonth(), 1); // תחילת חודש
            case 'high':
                return new Date(date.getFullYear(), date.getMonth(), date.getDate()); // תחילת יום
            case 'auto':
            default:
                return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()); // תחילת שעה
        }
    }

    // יצירת הטיקים בפריסה אחידה בטווח
    for (let i = 0; i < tickCount; i++) {
        const time = startTime + (rangeMs / (tickCount - 1)) * i;
        const date = roundTime(new Date(time));
        let label = '';

        switch (timeDetailLevel) {
            case 'low':
                label = `${date.getFullYear()}`;
                break;
            case 'medium':
                label = date.toLocaleString('default', {month: 'short', year: 'numeric'});
                break;
            case 'high':
                label = date.toLocaleString('default', {day: '2-digit', month: 'short'});
                break;
            case 'auto':
            default:
                label = date.toLocaleString('default', {hour: '2-digit', minute: '2-digit'});
                break;
        }

        ticks.push({time: date.getTime(), label});
    }

    return ticks;
}