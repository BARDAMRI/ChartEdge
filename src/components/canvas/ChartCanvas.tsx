import React, {useEffect, useRef, useState} from 'react';
import {Mode, useMode} from '../../contexts/ModeContext.tsx';
import '../../styles/ChartCanves.scss';
import {LineShape, LineShapeArgs} from "../Drawing/LineShape.ts";
import {TriangleShapeArgs} from "../Drawing/TriangleShape.ts";
import {RectangleShape, RectangleShapeArgs} from "../Drawing/RectangleShape.ts";
import {CircleShape, CircleShapeArgs} from "../Drawing/CircleShape.ts";
import {AngleShapeArgs} from "../Drawing/Angleshape.ts";
import {CustomSymbolShapeArgs} from "../Drawing/CustomSymbolShape.ts";
import {PolylineShapeArgs} from "../Drawing/Polyline.ts";
import {ArrowShapeArgs} from "../Drawing/ArrowShape.ts";
import {drawCandlesticks} from '../canvasUtils/drawCandlesticks';

type Drawing = {
    mode: Mode,
    args: LineShapeArgs
        | TriangleShapeArgs
        | RectangleShapeArgs
        | CircleShapeArgs
        | AngleShapeArgs
        | CustomSymbolShapeArgs
        | PolylineShapeArgs
        | ArrowShapeArgs
}


type Candle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
};

export const ChartCanvas: React.FC = () => {
    const backgroundRef = useRef<HTMLCanvasElement | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const axesRef = useRef<HTMLCanvasElement | null>(null);
    const {mode} = useMode();
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const [candles] = useState<Candle[]>(() => {
        const now = Date.now();
        const generated: Candle[] = [];
        let lastClose = 100;
        for (let i = 0; i < 50; i++) {
            const open = lastClose;
            const change = (Math.random() - 0.5) * 10;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * 5;
            const low = Math.min(open, close) - Math.random() * 5;
            generated.push({
                time: now + i * 60000,
                open,
                high,
                low,
                close,
            });
            lastClose = close;
        }
        return generated;
    });

    const [visibleRange, setVisibleRange] = useState<{ start: number, end: number }>({ start: 0, end: candles.length });

    useEffect(() => {
        const backgroundCanvas = backgroundRef.current;
        const overlayCanvas = overlayRef.current;
        const axesCanvas = axesRef.current;
        if (!backgroundCanvas || !overlayCanvas || !axesCanvas) return;
        const overlayCtx = overlayCanvas.getContext('2d');
        const backgroundCtx = backgroundCanvas.getContext('2d');
        const axesCtx = axesCanvas.getContext('2d');
        if (!overlayCtx || !backgroundCtx || !axesCtx) return;

        const drawBackground = () => {
            backgroundCtx.fillStyle = '#ffffff';
            backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

            backgroundCtx.strokeStyle = 'black';
            backgroundCtx.lineWidth = 2;
            drawings.forEach(d => {
                backgroundCtx.beginPath();

                if (d.mode === Mode.drawLine) {
                    const args = d.args as LineShapeArgs;
                    const lineDrawer = new LineShape(args.startX, args.startY, args.endX, args.endY);
                    lineDrawer.draw(backgroundCtx);
                } else if (d.mode === Mode.drawRectangle) {
                    const args = d.args as RectangleShapeArgs;
                    const rectDrawer = new RectangleShape(args.x, args.y, args.width, args.height);
                    rectDrawer.draw(backgroundCtx);
                } else if (d.mode === Mode.drawCircle) {
                    const args = d.args as CircleShapeArgs;
                    const circDrawer = new CircleShape(args.centerX, args.centerY, args.radius);
                    circDrawer.draw(backgroundCtx);
                }
                backgroundCtx.stroke();
            });

            if (selectedIndex !== null && drawings[selectedIndex]) {
                const d = drawings[selectedIndex];
                let shape = null;
                if (d.mode === Mode.drawLine) {
                    const args = d.args as LineShapeArgs;
                    shape = new LineShape(args.startX, args.startY, args.endX, args.endY);
                } else if (d.mode === Mode.drawRectangle) {
                    const args = d.args as RectangleShapeArgs;
                    shape = new RectangleShape(args.x, args.y, args.width, args.height);
                } else if (d.mode === Mode.drawCircle) {
                    const args = d.args as CircleShapeArgs;
                    shape = new CircleShape(args.centerX, args.centerY, args.radius);
                }
                if (shape) {
                    backgroundCtx.strokeStyle = 'red';
                    backgroundCtx.lineWidth = 2;
                    shape.draw(backgroundCtx);
                }
            }

            const visibleCandles = candles.slice(visibleRange.start, visibleRange.end);
            drawCandlesticks(backgroundCtx, visibleCandles, backgroundCanvas);

            // Draw axes
            axesCtx.clearRect(0, 0, axesCanvas.width, axesCanvas.height);
            axesCtx.strokeStyle = '#888';
            axesCtx.lineWidth = 1;
            axesCtx.font = '10px Arial';
            axesCtx.fillStyle = '#000';

            const priceStep = 20;
            const timeStep = Math.floor(visibleCandles.length / 5);

            const max = Math.max(...visibleCandles.map(c => c.high));
            const min = Math.min(...visibleCandles.map(c => c.low));
            const range = max - min;
            const dpr = window.devicePixelRatio || 1;
            const canvasHeight = axesCanvas.height / dpr;
            const canvasWidth = axesCanvas.width / dpr;

            for (let i = 0; i <= 5; i++) {
              const price = min + (range * i / 5);
              const y = canvasHeight - (i * canvasHeight / 5);
              axesCtx.fillText(price.toFixed(2), 2, y);
              axesCtx.beginPath();
              axesCtx.moveTo(0, y);
              axesCtx.lineTo(5, y);
              axesCtx.stroke();
            }

            for (let i = 0; i <= 5; i++) {
              const index = visibleRange.start + Math.floor(i * visibleCandles.length / 5);
              if (candles[index]) {
                const x = (i * canvasWidth / 5);
                const date = new Date(candles[index].time);
                const label = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                axesCtx.fillText(label, x, canvasHeight - 2);
                axesCtx.beginPath();
                axesCtx.moveTo(x, canvasHeight);
                axesCtx.lineTo(x, canvasHeight - 5);
                axesCtx.stroke();
              }
            }
        };

        const resizeCanvas = () => {
            const container = backgroundCanvas.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            const canvases = [backgroundCanvas, axesCanvas, overlayCanvas];
            canvases.forEach(canvas => {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
            });
            overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
            overlayCtx.scale(dpr, dpr);
            backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);
            backgroundCtx.scale(dpr, dpr);
            axesCtx.setTransform(1, 0, 0, 1, 0, 0);
            axesCtx.scale(dpr, dpr);

            drawBackground();
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (mode === Mode.select) {
                const rect = overlayCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                for (let i = 0; i < drawings.length; i++) {
                    const d = drawings[i];
                    let shape = null;
                    if (d.mode === Mode.drawLine) {
                        const args = d.args as LineShapeArgs;
                        shape = new LineShape(args.startX, args.startY, args.endX, args.endY);
                    } else if (d.mode === Mode.drawRectangle) {
                        const args = d.args as RectangleShapeArgs;
                        shape = new RectangleShape(args.x, args.y, args.width, args.height);
                    } else if (d.mode === Mode.drawCircle) {
                        const args = d.args as CircleShapeArgs;
                        shape = new CircleShape(args.centerX, args.centerY, args.radius);
                    }
                    if (shape?.isHit(x, y)) {
                        setSelectedIndex(i);
                        break;
                    }
                }
                return;
            }
            if (mode !== Mode.none) {
                const rect = overlayCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setStartPoint({x, y});
                setIsDrawing(true);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDrawing || !startPoint || (mode === Mode.none)) return;
            const rect = overlayCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            overlayCtx.beginPath();
            if (mode === Mode.drawLine) {
                const lineDrawer = new LineShape(startPoint.x, startPoint.y, x, y);
                lineDrawer.draw(overlayCtx);
            } else if (mode === 'draw-rectangle') {
                overlayCtx.rect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
            } else if (mode === 'draw-circle') {
                const dx = x - startPoint.x;
                const dy = y - startPoint.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                overlayCtx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
            }
            overlayCtx.stroke();
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isDrawing || !startPoint || (mode === Mode.none)) return;
            const rect = overlayCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            setDrawings(prev => {
                if (mode === Mode.drawLine) {
                    return [...prev, {
                        mode: Mode.drawLine,
                        args: {
                            startX: startPoint.x,
                            startY: startPoint.y,
                            endX: x,
                            endY: y
                        } as LineShapeArgs
                    }];
                } else if (mode === Mode.drawRectangle) {
                    return [...prev, {
                        mode: Mode.drawRectangle,
                        args: {
                            startX: startPoint.x,
                            startY: startPoint.y,
                            endX: x,
                            endY: y
                        } as RectangleShapeArgs
                    }];
                } else if (mode === Mode.drawCircle) {
                    const dx = x - startPoint.x;
                    const dy = y - startPoint.y;
                    const radius = Math.sqrt(dx * dx + dy * dy);
                    return [...prev,
                        {
                            mode: Mode.drawCircle,
                            args: {
                                centerX: startPoint.x,
                                centerY: startPoint.y,
                                radius
                            } as CircleShapeArgs
                        }];
                }
                return prev;
            });
            setIsDrawing(false);
            setStartPoint(null);
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            const rect = overlayCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const dpr = window.devicePixelRatio || 1;
            const logicalWidth = overlayCanvas.width / dpr;

            const rangeSize = visibleRange.end - visibleRange.start;

            if (e.ctrlKey) {
                // Zooming
                const zoomCenterRatio = mouseX / logicalWidth;
                // Smooth proportional zoom: scroll up (deltaY < 0) zooms in (fewer candles), scroll down zooms out
                const zoomFactor = 1 + (e.deltaY > 0 ? 0.1 : -0.1); // > 0 is zoom out
                const newLength = Math.max(10, Math.floor(rangeSize * zoomFactor));
                const centerIndex = visibleRange.start + Math.floor(rangeSize * zoomCenterRatio);
                const half = Math.floor(newLength / 2);
                let start = Math.max(0, centerIndex - half);
                let end = Math.min(candles.length, centerIndex + half);
                // Ensure at least newLength candles in the visible range if possible
                if (end - start < newLength) {
                    if (start === 0) {
                        end = Math.min(candles.length, start + newLength);
                    } else if (end === candles.length) {
                        start = Math.max(0, end - newLength);
                    }
                }
                setVisibleRange({ start, end });
            } else {
                // Panning
                const shift = e.deltaY > 0 ? 1 : -1;
                let start = Math.max(0, visibleRange.start + shift);
                let end = Math.min(candles.length, start + rangeSize);
                if (end - start < rangeSize) {
                    start = candles.length - rangeSize;
                    end = candles.length;
                }
                setVisibleRange({ start, end });
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        overlayCanvas.addEventListener('mousedown', handleMouseDown);
        overlayCanvas.addEventListener('mousemove', handleMouseMove);
        overlayCanvas.addEventListener('mouseup', handleMouseUp);
        overlayCanvas.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            overlayCanvas.removeEventListener('mousedown', handleMouseDown);
            overlayCanvas.removeEventListener('mousemove', handleMouseMove);
            overlayCanvas.removeEventListener('mouseup', handleMouseUp);
            overlayCanvas.removeEventListener('wheel', handleWheel);
        };
    }, [mode, isDrawing, startPoint, drawings, candles, selectedIndex, visibleRange]);

    useEffect(() => {
        const backgroundCanvas = backgroundRef.current;
        const backgroundCtx = backgroundCanvas?.getContext('2d');
        if (backgroundCanvas && backgroundCtx) {
            backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            const drawBackground = () => {
                backgroundCtx.fillStyle = '#ffffff';
                backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

                backgroundCtx.strokeStyle = 'black';
                backgroundCtx.lineWidth = 2;
                drawings.forEach(d => {
                    backgroundCtx.beginPath();

                    if (d.mode === Mode.drawLine) {
                        const args = d.args as LineShapeArgs;
                        const lineDrawer = new LineShape(args.startX, args.startY, args.endX, args.endY);
                        lineDrawer.draw(backgroundCtx);
                    } else if (d.mode === Mode.drawRectangle) {
                        const args = d.args as RectangleShapeArgs;
                        const rectDrawer = new RectangleShape(args.x, args.y, args.width, args.height);
                        rectDrawer.draw(backgroundCtx);
                    } else if (d.mode === Mode.drawCircle) {
                        const args = d.args as CircleShapeArgs;
                        const circDrawer = new CircleShape(args.centerX, args.centerY, args.radius);
                        circDrawer.draw(backgroundCtx);
                    }
                    backgroundCtx.stroke();
                });

                if (selectedIndex !== null && drawings[selectedIndex]) {
                    const d = drawings[selectedIndex];
                    let shape = null;
                    if (d.mode === Mode.drawLine) {
                        const args = d.args as LineShapeArgs;
                        shape = new LineShape(args.startX, args.startY, args.endX, args.endY);
                    } else if (d.mode === Mode.drawRectangle) {
                        const args = d.args as RectangleShapeArgs;
                        shape = new RectangleShape(args.x, args.y, args.width, args.height);
                    } else if (d.mode === Mode.drawCircle) {
                        const args = d.args as CircleShapeArgs;
                        shape = new CircleShape(args.centerX, args.centerY, args.radius);
                    }
                    if (shape) {
                        backgroundCtx.strokeStyle = 'red';
                        backgroundCtx.lineWidth = 2;
                        shape.draw(backgroundCtx);
                    }
                }

                const visibleCandles = candles.slice(visibleRange.start, visibleRange.end);
                drawCandlesticks(backgroundCtx, visibleCandles, backgroundCanvas);
            };
            drawBackground();
        }
    }, [visibleRange]);

    return (
        <div className="chart-canvas-container" style={{position: 'relative', width: '100%', height: '100%'}}>
            <canvas ref={backgroundRef} style={{position: 'absolute', top: 0, left: 0, zIndex: 0}}/>
            <canvas ref={axesRef} style={{position: 'absolute', top: 0, left: 0, zIndex: 1}}/>
            <canvas ref={overlayRef} style={{position: 'absolute', top: 0, left: 0, zIndex: 2}}/>
        </div>
    );
};