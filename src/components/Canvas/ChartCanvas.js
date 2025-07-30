"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartCanvas = void 0;
var react_1 = require("react");
var ModeContext_1 = require("../../contexts/ModeContext");
var ChartCanvas = function (_a) {
    var parentContainerRef = _a.parentContainerRef, candlesToUse = _a.candlesToUse, setCandlesAndVisibleRange = _a.setCandlesAndVisibleRange, setVisibleRange = _a.setVisibleRange, visibleRange = _a.visibleRange, drawings = _a.drawings, isDrawing = _a.isDrawing, setIsDrawing = _a.setIsDrawing, currentPoint = _a.currentPoint, padding = _a.padding, setCurrentPoint = _a.setCurrentPoint, setDrawings = _a.setDrawings, startPoint = _a.startPoint, setStartPoint = _a.setStartPoint, maxPrice = _a.maxPrice, minPrice = _a.minPrice, selectedIndex = _a.selectedIndex, setSelectedIndex = _a.setSelectedIndex, xAxisHeight = _a.xAxisHeight;
    var mode = (0, ModeContext_1.useMode)().mode;
    var containerRef = (0, react_1.useRef)(null);
    var canvasRef = (0, react_1.useRef)(null);
    var now = Date.now();
    var oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    var defaultVisibleRange = {
        start: oneYearAgo,
        end: now,
    };
    (0, react_1.useEffect)(function () {
        if (!visibleRange || visibleRange.start === 0 || visibleRange.end === 0) {
            setVisibleRange(defaultVisibleRange);
        }
    }, [candlesToUse, visibleRange, setVisibleRange]);
    (0, react_1.useEffect)(function () {
        setCandlesAndVisibleRange(candlesToUse, visibleRange || { start: 0, end: Date.now() });
    }, [candlesToUse, visibleRange, setCandlesAndVisibleRange]);
    var handleMouseDown = function (e) {
        if (!canvasRef.current)
            return;
        var rect = canvasRef.current.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        if (mode === ModeContext_1.Mode.select) {
            for (var i = 0; i < drawings.length; i++) {
                var d = drawings[i];
                var shape = null;
                if (d.mode === ModeContext_1.Mode.drawLine) {
                    // @ts-ignore
                    shape = new LineShape(d.args.startX, d.args.startY, d.args.endX, d.args.endY);
                }
                else if (d.mode === ModeContext_1.Mode.drawRectangle) {
                    // @ts-ignore
                    shape = new RectangleShape(d.args.x, d.args.y, d.args.width, d.args.height);
                }
                else if (d.mode === ModeContext_1.Mode.drawCircle) {
                    // @ts-ignore
                    shape = new CircleShape(d.args.centerX, d.args.centerY, d.args.radius);
                }
                if (shape && shape.isHit(x, y)) {
                    setSelectedIndex(i);
                    return;
                }
            }
            setSelectedIndex(null);
            return;
        }
        if (mode !== ModeContext_1.Mode.none) {
            setStartPoint({ x: x, y: y });
            setIsDrawing(true);
        }
    };
    var handleMouseMove = function (e) {
        if (!isDrawing || !startPoint || mode === ModeContext_1.Mode.none)
            return;
        if (!canvasRef.current)
            return;
        var rect = canvasRef.current.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        setCurrentPoint({ x: x, y: y });
    };
    var handleMouseUp = function (e) {
        if (!isDrawing || !startPoint || mode === ModeContext_1.Mode.none)
            return;
        if (!canvasRef || !canvasRef.current)
            return;
        var rect = canvasRef.current.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        setDrawings(function (prev) {
            var _a;
            var newDrawing = (_a = {},
                _a[ModeContext_1.Mode.drawLine] = function () { return ({
                    mode: ModeContext_1.Mode.drawLine,
                    args: {
                        startX: startPoint.x,
                        startY: startPoint.y,
                        endX: x,
                        endY: y,
                    },
                }); },
                _a[ModeContext_1.Mode.drawRectangle] = function () { return ({
                    mode: ModeContext_1.Mode.drawRectangle,
                    args: {
                        x: startPoint.x,
                        y: startPoint.y,
                        width: x - startPoint.x,
                        height: y - startPoint.y,
                    },
                }); },
                _a[ModeContext_1.Mode.drawCircle] = function () {
                    var dx = x - startPoint.x;
                    var dy = y - startPoint.y;
                    var radius = Math.sqrt(dx * dx + dy * dy);
                    return {
                        mode: ModeContext_1.Mode.drawCircle,
                        args: {
                            centerX: startPoint.x,
                            centerY: startPoint.y,
                            radius: radius,
                        },
                    };
                },
                _a);
            if (mode in newDrawing) {
                return __spreadArray(__spreadArray([], prev, true), [newDrawing[mode]()], false);
            }
            else {
                return prev;
            }
        });
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
    };
    return (react_1.default.createElement("div", { className: "inner-canvas-container relative", style: { width: '100%', height: "calc(100% - ".concat(xAxisHeight, "px)") }, ref: containerRef },
        react_1.default.createElement("canvas", { className: "canvas flex relative w-full h-full p-0 m-0 bg-white border-none pointer-events-auto", ref: canvasRef, onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp })));
};
exports.ChartCanvas = ChartCanvas;
