import React, {useEffect, useRef, useState} from 'react';
import {Mode, useMode} from '../contexts/ModeContext';
import '../styles/ChartCanves.scss';
import {LineShape, LineShapeArgs} from "./Drawing/LineShape.ts";
import {TriangleShapeArgs} from "./Drawing/TriangleShape.ts";
import {RectangleShape, RectangleShapeArgs} from "./Drawing/RectangleShape.ts";
import {CircleShape, CircleShapeArgs} from "./Drawing/CircleShape.ts";
import {AngleShapeArgs} from "./Drawing/Angleshape.ts";
import {CustomSymbolShapeArgs} from "./Drawing/CustomSymbolShape.ts";
import {PolylineShapeArgs} from "./Drawing/Polyline.ts";
import {ArrowShapeArgs} from "./Drawing/ArrowShape.ts";

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
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const {mode} = useMode();
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
    const [drawings, setDrawings] = useState<Drawing[]>([]);

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawCandlesticks = () => {
            const dpr = window.devicePixelRatio || 1;
            const paddingLeft = 40;
            const paddingRight = 20;
            const drawableWidth = canvas.width / dpr - paddingLeft - paddingRight;
            const candleSpacing = drawableWidth / candles.length;
            const candleWidth = candleSpacing * 0.6;

            const max = Math.max(...candles.map(c => c.high));
            const min = Math.min(...candles.map(c => c.low));
            const priceRange = max - min;

            const priceToY = (price: number) => {
                const logicalHeight = canvas.height / dpr;
                return logicalHeight - ((price - min) / priceRange) * logicalHeight;
            };

            candles.forEach((candle, i) => {
                const x = paddingLeft + i * candleSpacing;
                const highY = priceToY(candle.high);
                const lowY = priceToY(candle.low);
                const openY = priceToY(candle.open);
                const closeY = priceToY(candle.close);

                const isUp = candle.close >= candle.open;
                ctx.strokeStyle = isUp ? 'green' : 'red';
                ctx.lineWidth = 1;

                // Wick
                ctx.beginPath();
                ctx.moveTo(x + candleWidth / 2, highY);
                ctx.lineTo(x + candleWidth / 2, lowY);
                ctx.stroke();

                // Body
                ctx.fillStyle = isUp ? 'green' : 'red';
                const bodyY = Math.min(openY, closeY);
                const bodyHeight = Math.abs(openY - closeY);
                ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
            });
        };

        const drawBackground = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            drawings.forEach(d => {
                ctx.beginPath();

                if (d.mode === Mode.drawLine) {
                    const args = d.args as LineShapeArgs;
                    const lineDrawer = new LineShape(args.startX, args.startY, args.endX, args.endY);
                    lineDrawer.draw(ctx);
                } else if (d.mode === Mode.drawRectangle) {
                    const args = d.args as RectangleShapeArgs;
                    const rectDrawer = new RectangleShape(args.x, args.y, args.width, args.height);
                    rectDrawer.draw(ctx);
                } else if (d.mode === Mode.drawCircle) {
                    const args = d.args as CircleShapeArgs;
                    const circDrawer = new CircleShape(args.centerX, args.centerY, args.radius);
                    circDrawer.draw(ctx);
                }
                ctx.stroke();
            });

            drawCandlesticks();
        };

        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);

            drawBackground();
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (mode !== Mode.none) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setStartPoint({x, y});
                setIsDrawing(true);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDrawing || !startPoint || (mode === Mode.none)) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            drawBackground();
            ctx.beginPath();
            if (mode === Mode.drawLine) {
                const lineDrawer = new LineShape(startPoint.x, startPoint.y, x, y);
                lineDrawer.draw(ctx);
            } else if (mode === 'draw-rectangle') {
                ctx.rect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
            } else if (mode === 'draw-circle') {
                const dx = x - startPoint.x;
                const dy = y - startPoint.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
            }
            ctx.stroke();
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isDrawing || !startPoint || (mode === Mode.none)) return;
            const rect = canvas.getBoundingClientRect();
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
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
        };
    }, [mode, isDrawing, startPoint, drawings, candles]);

    return (
        <div className={'chart-canvas-container'}>
            <canvas
                ref={canvasRef}
            />
        </div>
    );
};