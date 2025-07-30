import React, { useEffect, useRef } from 'react';
import { CanvasSizes } from "../ChartStage";
import { StyledYAxisCanvas } from '../../../styles/YAxis.styles';

interface YAxisProps {
  parentContainerRef: React.RefObject<HTMLDivElement | null>;
  canvasSizes: CanvasSizes;
  yAxisPosition: 'left' | 'right';
  xAxisHeight: number;
  yAxisWidth: number;
  minPrice: number;
  maxPrice: number;
  numberOfYTicks: number;
}

export default function YAxis({
  parentContainerRef,
  canvasSizes,
  yAxisWidth,
  xAxisHeight,
  yAxisPosition,
  minPrice,
  maxPrice,
  numberOfYTicks
}: YAxisProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dpr = window.devicePixelRatio || 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const y_axis_canvas_height = canvas.clientHeight;
    const y_axis_canvas_width = canvas.clientWidth;

    canvas.height = y_axis_canvas_height * dpr;
    canvas.width = y_axis_canvas_width * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.font = `${12 * dpr}px Arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = yAxisPosition === 'left' ? 'right' : 'left';

    ctx.beginPath();
    ctx.moveTo(y_axis_canvas_width, (y_axis_canvas_height - xAxisHeight + 1));
    ctx.lineTo(y_axis_canvas_width, 0);
    ctx.stroke();

    // future ticks
  }, [parentContainerRef, yAxisWidth, minPrice, maxPrice, numberOfYTicks, yAxisPosition, dpr, canvasSizes]);

  return (
    <StyledYAxisCanvas ref={canvasRef} $position={yAxisPosition} />
  );
}