export function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const stepX = 50; // ריווח אופקי בין קווים, ניתן לשנות
  const stepY = 50; // ריווח אנכי בין קווים, ניתן לשנות
  const strokeStyle = '#ccc'; // צבע הקווים, ניתן לשנות

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1;

  // קצוות הגריד
  const xStart = 0;
  const xEnd = width;
  const yStart = 0;
  const yEnd = height;

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
