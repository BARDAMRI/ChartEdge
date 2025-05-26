import { useChartStore } from '../../../store/useChartStore';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
) {
  const { stepX, stepY, strokeStyle } = useChartStore.getState?.();

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;

  // קווים אנכיים
  for (let x = padding; x <= width - padding; x += stepX) {
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();
  }

  // קווים אופקיים
  for (let y = padding; y <= height - padding; y += stepY) {
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
}
