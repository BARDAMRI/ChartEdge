

import { Mode } from '../../../contexts/ModeContext';

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  mode: Mode,
  isDrawing: boolean,
  startPoint: { x: number; y: number } | null,
  currentPoint: { x: number; y: number } | null
) {
  if (!isDrawing || !startPoint || !currentPoint) return;

  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]); // קו מנוקד

  ctx.beginPath();
  switch (mode) {
    case Mode.drawLine:
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      break;

    case Mode.drawRectangle:
      ctx.rect(
        Math.min(startPoint.x, currentPoint.x),
        Math.min(startPoint.y, currentPoint.y),
        Math.abs(currentPoint.x - startPoint.x),
        Math.abs(currentPoint.y - startPoint.y)
      );
      break;

    case Mode.drawCircle:
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      break;

    default:
      ctx.setLineDash([]);
      return;
  }

  ctx.stroke();
  ctx.setLineDash([]);
}