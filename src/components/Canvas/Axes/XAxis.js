"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = XAxis;
var react_1 = require("react");
function XAxis(_a) {
    var canvasSizes = _a.canvasSizes, xAxisHeight = _a.xAxisHeight, visibleRange = _a.visibleRange, timeDetailLevel = _a.timeDetailLevel, timeFormat12h = _a.timeFormat12h, parentContainerRef = _a.parentContainerRef;
    var canvasRef = (0, react_1.useRef)(null);
    var dpr = window.devicePixelRatio || 1;
    (0, react_1.useEffect)(function () {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        var ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        // Draw X-axis line
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.font = "".concat(12, "px Arial");
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.stroke();
        // TODO: Uncomment and implement ticks drawing using visibleRange, timeDetailLevel, timeFormat12h
        // const ticks = generateTimeTicks(
        //     visibleRange.start,
        //     visibleRange.end,
        //     width,
        //     timeDetailLevel,
        //     timeFormat12h
        // );
        // ticks.forEach(({ time, label }) => {
        //     const x = ((time - visibleRange.start) / (visibleRange.end - visibleRange.start)) * width;
        //     ctx.beginPath();
        //     ctx.moveTo(x, 0);
        //     ctx.lineTo(x, 5);
        //     ctx.stroke();
        //     ctx.fillText(label, x, 12);
        // });
    }, [xAxisHeight, visibleRange, timeDetailLevel, timeFormat12h, canvasSizes, parentContainerRef]);
    return (react_1.default.createElement("canvas", { className: "x-canvas relative block bottom-0 left-0 w-full h-full p-0 m-0 bg-white border-none pointer-events-none", ref: canvasRef, style: { height: xAxisHeight } }));
}
