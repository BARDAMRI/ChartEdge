"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = YAxis;
var react_1 = require("react");
function YAxis(_a) {
    var parentContainerRef = _a.parentContainerRef, canvasSizes = _a.canvasSizes, yAxisWidth = _a.yAxisWidth, xAxisHeight = _a.xAxisHeight, yAxisPosition = _a.yAxisPosition, minPrice = _a.minPrice, maxPrice = _a.maxPrice, numberOfYTicks = _a.numberOfYTicks;
    var canvasRef = (0, react_1.useRef)(null);
    var dpr = window.devicePixelRatio || 1;
    function calculateTicks() {
        var _a;
        var y_axis_height = ((_a = parentContainerRef === null || parentContainerRef === void 0 ? void 0 : parentContainerRef.current) === null || _a === void 0 ? void 0 : _a.clientHeight) || 0;
        var y_axis_width = yAxisWidth || 40; // Default width if not set
        var step = (maxPrice - minPrice) / (numberOfYTicks - 1);
        //TODO complete this function.
        return [];
    }
    (0, react_1.useEffect)(function () {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var y_axis_canvas_height = canvas.clientHeight;
        var y_axis_canvas_width = canvas.clientWidth; // Default width if not set
        canvas.height = y_axis_canvas_height * dpr;
        canvas.width = y_axis_canvas_width * dpr;
        var ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'black';
        ctx.font = "".concat(12 * dpr, "px Arial");
        ctx.textBaseline = 'middle';
        ctx.textAlign = yAxisPosition === 'left' ? 'right' : 'left';
        ctx.beginPath();
        ctx.moveTo(y_axis_canvas_width, (y_axis_canvas_height - xAxisHeight + 1));
        ctx.lineTo(y_axis_canvas_width, 0);
        ctx.stroke();
        // const ticks = calculateTicks();
        // ticks.forEach(({y, value}) => {
        //     ctx.beginPath();
        //     ctx.moveTo(yAxisX, y);
        //     ctx.lineTo(yAxisPosition === 'left' ? yAxisX - 5 : yAxisX + 5, y);
        //     ctx.stroke();
        //
        //     const text = value.toFixed(2);
        //     const textWidth = ctx.measureText(text).width;
        //     const offsetX = yAxisPosition === 'left' ? yAxisX - 10 - textWidth : yAxisX + 10;
        //
        //     ctx.fillText(text, offsetX, y);
        // });
    }, [parentContainerRef, yAxisWidth, minPrice, maxPrice, numberOfYTicks, yAxisPosition, dpr, canvasSizes]);
    return (react_1.default.createElement("canvas", { className: "y-canvas block relative left-".concat(yAxisPosition === 'left' ? 0 : 'auto', " right-").concat(yAxisPosition === 'right' ? 0 : 'auto', " top-0 bottom-0 pointer-events-none w-[100%] h-[100%]"), ref: canvasRef }));
}
