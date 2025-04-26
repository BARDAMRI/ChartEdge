// GridRenderer אחראי לציור קווי גריד אופקיים ואנכיים ברקע הגרף
export class GridRenderer {
    private ctx: CanvasRenderingContext2D;

    // קונסטרקטור שמקבל את הקונטקסט של הקנבס
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * מצייר את קווי הגריד על הקנבס.
     * @param minTime - הזמן המינימלי (כרגע לא בשימוש לציור הגריד, שמור להרחבות עתידיות)
     * @param maxTime - הזמן המקסימלי (כנ"ל)
     * @param scaledMin - המחיר המינימלי אחרי התאמה (כרגע לא בשימוש כאן ישירות)
     * @param scaledMax - המחיר המקסימלי אחרי התאמה (כנ"ל)
     * @param canvasWidth - רוחב הקנבס
     * @param canvasHeight - גובה הקנבס
     * @param horizontalLines - מספר קווי הגריד האופקיים (ברירת מחדל 5)
     * @param verticalLines - מספר קווי הגריד האנכיים (ברירת מחדל 5)
     */
    drawGrid(
        minTime: number,
        maxTime: number,
        scaledMin: number,
        scaledMax: number,
        canvasWidth: number,
        canvasHeight: number,
        horizontalLines: number = 5,
        verticalLines: number = 5
    ) {
        this.ctx.save(); // שמירת מצב הקנבס הנוכחי

        // הגדרת סגנון הקווים
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)'; // צבע אפור שקוף
        this.ctx.lineWidth = 1; // קו דק

        // ציור קווי גריד אופקיים (Y)
        for (let i = 0; i <= horizontalLines; i++) {
            const y = (canvasHeight / horizontalLines) * i; // חישוב מיקום כל קו
            this.ctx.beginPath();
            this.ctx.moveTo(0, y); // התחלת קו מהקצה השמאלי
            this.ctx.lineTo(canvasWidth, y); // סיום קו בקצה הימני
            this.ctx.stroke(); // צייר את הקו
        }

        // ציור קווי גריד אנכיים (X)
        for (let i = 0; i <= verticalLines; i++) {
            const x = (canvasWidth / verticalLines) * i; // חישוב מיקום כל קו
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0); // התחלת קו למעלה
            this.ctx.lineTo(x, canvasHeight); // סיום קו למטה
            this.ctx.stroke(); // צייר את הקו
        }

        this.ctx.restore(); // שחזור מצב הקנבס המקורי
    }
}