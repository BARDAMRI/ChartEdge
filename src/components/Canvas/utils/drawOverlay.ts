import {Mode} from '../../../contexts/ModeContext';

type OverlayOpts = {
    dpr?: number;
    color?: string;
    lineWidth?: number;
    dash?: number[];
};

export function drawOverlay(
    ctx: CanvasRenderingContext2D,
    mode: Mode,
    isDrawing: boolean,
    startPoint: { x: number; y: number } | null,
    currentPoint: { x: number; y: number } | null,
    width: number,
    height: number,
    opts: OverlayOpts = {}
) {
    if (!isDrawing || !startPoint || !currentPoint) return;

    ctx.save();

    // Apply DPR scaling here only if this is a standalone overlay canvas.
    if (opts.dpr && opts.dpr !== 1) {
        ctx.setTransform(opts.dpr, 0, 0, opts.dpr, 0, 0);
        // If this overlay owns clearing, do it in CSS pixels after setTransform:
        // ctx.clearRect(0, 0, width, height);
    }

    ctx.strokeStyle = opts.color ?? 'blue';
    ctx.lineWidth = opts.lineWidth ?? 2;
    ctx.setLineDash(opts.dash ?? [5, 5]);

    ctx.beginPath();
    switch (mode) {
        case Mode.drawLine: {
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(currentPoint.x, currentPoint.y);
            break;
        }
        case Mode.drawRectangle: {
            const x = Math.min(startPoint.x, currentPoint.x);
            const y = Math.min(startPoint.y, currentPoint.y);
            const w = Math.abs(currentPoint.x - startPoint.x);
            const h = Math.abs(currentPoint.y - startPoint.y);
            ctx.rect(x, y, w, h);
            break;
        }
        case Mode.drawCircle: {
            const dx = currentPoint.x - startPoint.x;
            const dy = currentPoint.y - startPoint.y;
            const radius = Math.hypot(dx, dy); // circle from center
            ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
            break;
        }
        default:
            // Nothing to draw
            ctx.restore();
            return;
    }

    ctx.stroke();
    // No need to manually reset dash; restore() will revert it.
    ctx.restore();
}