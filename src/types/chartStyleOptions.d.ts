export interface ChartStyleOptions {
    backgroundColor: string; // צבע רקע הגרף

    grid: {
        lineColor: string; // צבע קווי גריד
        lineWidth: number; // עובי קווי גריד
        horizontalLines: number; // מספר קווי גריד אופקיים
        verticalLines: number; // מספר קווי גריד אנכיים
        showGrid: boolean; // האם להציג קווי גריד בכלל
        lineDash: number[]; // תבנית קו מקווקו (למשל [5,5])
    };

    axes: {
        textColor: string; // צבע טקסט בצירים
        font: string; // פונט טקסטים בצירים
        lineColor: string; // צבע קו הצירים
        lineWidth: number; // עובי קו הצירים
        showAxes: boolean; // האם להציג צירים בכלל
        axisPosition: 'left' | 'right'; // מיקום ציר Y
    };

    candles: {
        upColor: string; // צבע נר עולה
        downColor: string; // צבע נר יורד
        borderColor: string; // צבע מסגרת נר
        borderWidth: number; // עובי מסגרת נר
        bodyWidthFactor: number; // יחס בין רוחב גוף הנר לרוחב הכללי
    };

    lineOverlay: {
        color: string; // צבע קו overlay
        lineWidth: number; // עובי קו overlay
        dashed: boolean; // האם קו overlay יהיה מקווקו
    };

    padding: {
        type: 'percent' | 'pixels'; // האם padding בסקלה יחושב באחוזים או בפיקסלים
        value: number; // הערך עצמו: כמה אחוזים או כמה פיקסלים
    };
}