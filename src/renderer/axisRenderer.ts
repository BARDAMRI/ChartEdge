// AxisRenderer אחראי לציור סימונים של צירי Y ו-X על הקנבס
export class AxisRenderer {
    private ctx: CanvasRenderingContext2D;
    private font: string = '10px Arial'; // פונט ברירת מחדל לטקסט
    private textColor: string = '#999'; // צבע טקסט עדין

    // קונסטרקטור שמקבל את הקונטקסט של הקנבס
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * מצייר את הצירים (Y ו-X) על הקנבס
     * @param minTime - הזמן המינימלי (כמספר מילישניות)
     * @param maxTime - הזמן המקסימלי
     * @param scaledMin - המחיר המינימלי אחרי התאמה
     * @param scaledMax - המחיר המקסימלי אחרי התאמה
     * @param canvasWidth - רוחב הקנבס
     * @param canvasHeight - גובה הקנבס
     * @param horizontalLines - מספר קווי גריד אופקיים (ברירת מחדל 5)
     * @param verticalLines - מספר קווי גריד אנכיים (ברירת מחדל 5)
     */
    drawAxes(
        minTime: number,
        maxTime: number,
        scaledMin: number,
        scaledMax: number,
        canvasWidth: number,
        canvasHeight: number,
        horizontalLines: number = 5,
        verticalLines: number = 5
    ): void {
        this.ctx.save(); // שמירת מצב קנבס

        // הגדרות טקסט
        this.ctx.font = this.font;
        this.ctx.fillStyle = this.textColor;
        this.ctx.textAlign = 'right'; // טקסט צמוד לימין (לציר Y)
        this.ctx.textBaseline = 'middle'; // טקסט ממורכז לגובה השורה

        // ציור ערכים על ציר Y
        for (let i = 0; i <= horizontalLines; i++) {
            const y = (canvasHeight / horizontalLines) * i; // חישוב מיקום Y
            const value = scaledMax - ((scaledMax - scaledMin) / horizontalLines) * i; // חישוב ערך המחיר
            const formattedValue = value.toFixed(2); // פורמט לשני ספרות אחרי הנקודה

            this.ctx.fillText(formattedValue, canvasWidth - 5, y); // צייר את הערך (קצת לפני הקצה הימני)
        }

        // ציור ערכים על ציר X
        this.ctx.textAlign = 'center'; // טקסט ממורכז (לציר X)
        this.ctx.textBaseline = 'top'; // טקסט מתחיל מלמעלה

        for (let i = 0; i <= verticalLines; i++) {
            const x = (canvasWidth / verticalLines) * i; // חישוב מיקום X
            const timestamp = minTime + ((maxTime - minTime) / verticalLines) * i; // חישוב זמן
            const date = new Date(timestamp);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const label = `${hours}:${minutes}`; // פורמט שעה:דקה

            this.ctx.fillText(label, x, canvasHeight - 15); // צייר את הזמן מעל תחתית הקנבס
        }

        // ציור קווים מודגשים של הצירים עצמם
        this.ctx.strokeStyle = '#666'; // צבע כהה יותר
        this.ctx.lineWidth = 1.5;

        // קו ציר Y (אנכי) בצד ימין
        this.ctx.beginPath();
        this.ctx.moveTo(canvasWidth, 0);
        this.ctx.lineTo(canvasWidth, canvasHeight);
        this.ctx.stroke();

        // קו ציר X (אופקי) בתחתית
        this.ctx.beginPath();
        this.ctx.moveTo(0, canvasHeight);
        this.ctx.lineTo(canvasWidth, canvasHeight);
        this.ctx.stroke();

        this.ctx.restore(); // החזרת מצב הקנבס המקורי
    }
}