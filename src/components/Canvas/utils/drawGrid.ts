import { useChartStore } from '../../../store/useChartStore';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
) {

  const { stepX, stepY, strokeStyle, canvasWidth, canvasHeight, padding} = useChartStore.getState?.();

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;

  // קצוות הגריד
  const xStart = padding;
  const xEnd = canvasWidth - padding;
  const yStart = padding;
  const yEnd = canvasHeight - padding;

  // קווים אנכיים
  for (let x = xStart; x <= xEnd; x += stepX) {
    ctx.beginPath();
    ctx.moveTo(x, yStart);
    ctx.lineTo(x, yEnd);
    ctx.stroke();
  }

  // קווים אופקיים
  for (let y = yStart; y <= yEnd; y += stepY) {
    ctx.beginPath();
    ctx.moveTo(xStart, y);
    ctx.lineTo(xEnd, y);
    ctx.stroke();
  }
}
