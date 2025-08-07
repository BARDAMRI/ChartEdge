import {Drawing} from '../../Drawing/types';
import {LineShape} from '../../Drawing/LineShape';
import {RectangleShape} from '../../Drawing/RectangleShape';
import {CircleShape} from '../../Drawing/CircleShape';
import {TriangleShape} from '../../Drawing/TriangleShape';
import {Polyline} from '../../Drawing/Polyline';
import {ArrowShape} from '../../Drawing/ArrowShape';
import {CustomSymbolShape} from '../../Drawing/CustomSymbolShape';
import {Mode} from '../../../contexts/ModeContext';
import {AngleShape} from "../../Drawing/Angleshape";

export function drawDrawings(
    ctx: CanvasRenderingContext2D,
    drawings: Drawing[],
    selectedIndex: number | null,
    width: number,
    height: number
): void {
    drawings.forEach((d, index) => {
        ctx.beginPath();
        let shape = null;
        switch (d.mode) {
            case Mode.drawLine:
                shape = new LineShape(
                    d.args.startX,
                    d.args.startY,
                    d.args.endX,
                    d.args.endY
                );
                break;
            case Mode.drawRectangle:
                shape = new RectangleShape(
                    d.args.x,
                    d.args.y,
                    d.args.width,
                    d.args.height
                );
                break;
            case Mode.drawCircle:
                shape = new CircleShape(
                    d.args.startX,
                    d.args.startY,
                    d.args.endX,
                    d.args.endY,
                    d.args.color,
                    d.args.lineWidth
                );
                break;
            case Mode.drawTriangle:
                shape = new TriangleShape(
                    d.args.x1,
                    d.args.y1,
                    d.args.x2,
                    d.args.y2,
                    d.args.x3,
                    d.args.y3
                );
                break;
            case Mode.drawAngle:
                shape = new AngleShape(
                    d.args.x0,
                    d.args.y0,
                    d.args.x1,
                    d.args.y1,
                    d.args.x2,
                    d.args.y2
                );
                break;
            case Mode.drawPolyline:
                shape = new Polyline(d.args.points);
                break;
            case Mode.drawArrow:
                shape = new ArrowShape(
                    d.args.fromX,
                    d.args.fromY,
                    d.args.toX,
                    d.args.toY,
                    d.args.color,
                    d.args.lineWidth
                );
                break;
            case Mode.drawCustomSymbol:
                shape = new CustomSymbolShape(
                    d.args.x,
                    d.args.y,
                    d.args.symbol,
                    d.args.size,
                    d.args.color
                );
                break;
            default:
                break;
        }

        if (shape) {
            if (selectedIndex === index) {
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
            }
            shape.draw(ctx);
            ctx.stroke();
        }
    });
}