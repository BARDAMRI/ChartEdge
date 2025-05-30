export interface Tick {
    time: number;      // timestamp UNIX במילישניות
    label: string;     // תצוגת הטיק כטקסט
}

export interface TimeRange {
    start: number; // timestamp התחלה
    end: number;   // timestamp סיום
}