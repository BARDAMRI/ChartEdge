"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartStage = void 0;
var react_1 = require("react");
var ChartCanvas_1 = require("./ChartCanvas");
var XAxis_1 = require("./Axes/XAxis");
var YAxis_1 = require("./Axes/YAxis");
require("../../styles/Canvas/ChartStage.scss");
// Logger utility
var DebugLogger = /** @class */ (function () {
    function DebugLogger() {
        this.logs = [];
    }
    DebugLogger.prototype.log = function (message, data) {
        var timestamp = new Date().toLocaleTimeString();
        var logEntry = "[".concat(timestamp, "] ").concat(message).concat(data ? '\n' + JSON.stringify(data, null, 2) : '');
        this.logs.push(logEntry);
        console.log(message, data);
    };
    DebugLogger.prototype.getLogs = function () {
        return this.logs.join('\n\n');
    };
    DebugLogger.prototype.downloadLogs = function () {
        var logContent = this.getLogs();
        var blob = new Blob([logContent], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = "resize-debug-".concat(new Date().toISOString().slice(0, 19), ".txt");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    DebugLogger.prototype.clear = function () {
        this.logs = [];
    };
    return DebugLogger;
}());
var logger = new DebugLogger();
var ChartStage = function (_a) {
    var initialCandles = _a.initialCandles, initialYAxisPosition = _a.initialYAxisPosition, initialMargin = _a.initialMargin, initialNumberOfYTicks = _a.initialNumberOfYTicks, initialXAxisHeight = _a.initialXAxisHeight, initialYAxisWidth = _a.initialYAxisWidth, initialTimeDetailLevel = _a.initialTimeDetailLevel, initialTimeFormat12h = _a.initialTimeFormat12h, initialVisibleRange = _a.initialVisibleRange;
    var _b = (0, react_1.useState)({ width: 0, height: 0 }), canvasSizes = _b[0], setCanvasSizes = _b[1];
    var _c = (0, react_1.useState)(0), logCount = _c[0], setLogCount = _c[1];
    var containerRef = (0, react_1.useRef)(null);
    var _d = (0, react_1.useState)(initialCandles), candles = _d[0], setCandles = _d[1];
    var _e = (0, react_1.useState)(initialYAxisPosition), yAxisPosition = _e[0], setYAxisPosition = _e[1];
    var _f = (0, react_1.useState)(initialMargin), margin = _f[0], setMargin = _f[1];
    var _g = (0, react_1.useState)(initialNumberOfYTicks), numberOfYTicks = _g[0], setNumberOfYTicks = _g[1];
    var _h = (0, react_1.useState)(initialXAxisHeight), xAxisHeight = _h[0], setXAxisHeight = _h[1];
    var _j = (0, react_1.useState)(initialYAxisWidth), yAxisWidth = _j[0], setYAxisWidth = _j[1];
    var _k = (0, react_1.useState)(initialTimeDetailLevel), timeDetailLevel = _k[0], setTimeDetailLevel = _k[1];
    var _l = (0, react_1.useState)(initialTimeFormat12h), timeFormat12h = _l[0], setTimeFormat12h = _l[1];
    var _m = (0, react_1.useState)(function () {
        if (initialVisibleRange)
            return initialVisibleRange;
        var now = Date.now();
        return { start: now - 7 * 24 * 60 * 60 * 1000, end: now }; // default last 7 days
    }), visibleRange = _m[0], setVisibleRange = _m[1];
    // חישוב מחירים מינימלי ומקסימלי מתוך הנרות (candles)
    var _o = react_1.default.useMemo(function () {
        if (!candles || candles.length === 0)
            return [0, 0];
        var prices = candles.flatMap(function (c) { return [c.l, c.h]; });
        return [Math.min.apply(Math, prices), Math.max.apply(Math, prices)];
    }, [candles]), minPrice = _o[0], maxPrice = _o[1];
    (0, react_1.useEffect)(function () {
        if (!containerRef.current)
            return;
        var element = containerRef.current;
        if (!element)
            return;
        // Initial size logging
        var initialRect = element.getBoundingClientRect();
        logger.log('🔷 Initial container size:', {
            width: initialRect.width,
            height: initialRect.height,
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight
        });
        // Log computed styles that might affect sizing
        var computedStyle = window.getComputedStyle(element);
        logger.log('🔷 Container computed styles:', {
            width: computedStyle.width,
            height: computedStyle.height,
            minWidth: computedStyle.minWidth,
            minHeight: computedStyle.minHeight,
            maxWidth: computedStyle.maxWidth,
            maxHeight: computedStyle.maxHeight,
            boxSizing: computedStyle.boxSizing,
            display: computedStyle.display,
            flexGrow: computedStyle.flexGrow,
            flexShrink: computedStyle.flexShrink,
            flexBasis: computedStyle.flexBasis,
            overflow: computedStyle.overflow
        });
        // Check parent chain (up to 3 levels)
        var parent = element.parentElement;
        var level = 1;
        while (parent && level <= 3) {
            var parentRect = parent.getBoundingClientRect();
            var parentStyle = window.getComputedStyle(parent);
            logger.log("\uD83D\uDD37 Parent ".concat(level, " (").concat(parent.className, "):"), {
                size: { width: parentRect.width, height: parentRect.height },
                minWidth: parentStyle.minWidth,
                maxWidth: parentStyle.maxWidth,
                display: parentStyle.display,
                overflow: parentStyle.overflow,
                flexGrow: parentStyle.flexGrow,
                flexShrink: parentStyle.flexShrink
            });
            parent = parent.parentElement;
            level++;
        }
        var resizeObserver = new ResizeObserver(function (entries) {
            var _a, _b;
            logger.log('🟢 ResizeObserver triggered!');
            setLogCount(function (prev) { return prev + 1; });
            var _loop_1 = function (entry) {
                var _c = entry.contentRect, width = _c.width, height = _c.height;
                var target = entry.target;
                logger.log('🟢 ResizeObserver data:', {
                    contentRect: { width: width, height: height },
                    borderBoxSize: (_a = entry.borderBoxSize) === null || _a === void 0 ? void 0 : _a[0],
                    contentBoxSize: (_b = entry.contentBoxSize) === null || _b === void 0 ? void 0 : _b[0],
                    targetClass: target.className,
                    currentCanvasSizes: canvasSizes
                });
                // Also log current element measurements
                var currentRect = element.getBoundingClientRect();
                logger.log('🟢 Current element measurements:', {
                    getBoundingClientRect: { width: currentRect.width, height: currentRect.height },
                    clientSize: { width: element.clientWidth, height: element.clientHeight },
                    offsetSize: { width: element.offsetWidth, height: element.offsetHeight }
                });
                setCanvasSizes(function (prev) {
                    if (prev.width !== width || prev.height !== height) {
                        logger.log('🔄 Updating canvas sizes:', {
                            from: prev,
                            to: { width: width, height: height },
                            change: {
                                width: width - prev.width,
                                height: height - prev.height
                            }
                        });
                        return { width: width, height: height };
                    }
                    logger.log('🚫 No size change, keeping previous:', prev);
                    return prev;
                });
            };
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                _loop_1(entry);
            }
        });
        // Add window resize listener for comparison
        var handleWindowResize = function () {
            var windowSize = { width: window.innerWidth, height: window.innerHeight };
            var elementRect = element.getBoundingClientRect();
            logger.log('🌍 Window resize:', {
                window: windowSize,
                element: { width: elementRect.width, height: elementRect.height }
            });
            setLogCount(function (prev) { return prev + 1; });
        };
        window.addEventListener('resize', handleWindowResize);
        resizeObserver.observe(element);
        logger.log('🔷 ResizeObserver attached to element:', { className: element.className });
        return function () {
            logger.log('🔴 Cleaning up ResizeObserver');
            window.removeEventListener('resize', handleWindowResize);
            resizeObserver.disconnect();
        };
    }, []);
    // Log every render
    logger.log('🔄 ChartStage render:', {
        canvasSizes: canvasSizes,
        containerRefCurrent: !!containerRef.current
    });
    var _p = (0, react_1.useState)(null), currentPoint = _p[0], setCurrentPoint = _p[1];
    var _q = (0, react_1.useState)([]), drawings = _q[0], setDrawings = _q[1];
    var _r = (0, react_1.useState)(false), isDrawing = _r[0], setIsDrawing = _r[1];
    var _s = (0, react_1.useState)(null), selectedIndex = _s[0], setSelectedIndex = _s[1];
    var _t = (0, react_1.useState)(null), startPoint = _t[0], setStartPoint = _t[1];
    var setCandlesAndVisibleRange = function (newCandles, newVisibleRange) {
        setCandles(newCandles);
        setVisibleRange(newVisibleRange);
    };
    return (react_1.default.createElement("div", { ref: containerRef, style: { margin: "".concat(margin, "px") }, className: "chart-stage-container flex w-full h-full" },
        yAxisPosition === 'left' && (react_1.default.createElement("div", { className: "right-y-axis-container relative flex h-full", style: { width: "".concat(yAxisWidth, "px") } },
            react_1.default.createElement(YAxis_1.default, { parentContainerRef: containerRef, canvasSizes: canvasSizes, maxPrice: maxPrice, minPrice: minPrice, numberOfYTicks: numberOfYTicks, xAxisHeight: xAxisHeight, yAxisPosition: yAxisPosition, yAxisWidth: yAxisWidth }))),
        react_1.default.createElement("div", { className: "canvas-axis-container relative flex h-full", style: {
                width: "".concat(canvasSizes.width - (yAxisWidth + 40), "px"),
                marginLeft: "".concat(yAxisPosition === 'left' ? 0 : 40, "px"),
                marginRight: "".concat(yAxisPosition === 'right' ? 0 : 40, "px"),
            } },
            react_1.default.createElement("div", { className: "canvas-container relative" },
                react_1.default.createElement(ChartCanvas_1.ChartCanvas, { parentContainerRef: containerRef, candlesToUse: candles, currentPoint: currentPoint, drawings: drawings, isDrawing: isDrawing, maxPrice: maxPrice, minPrice: minPrice, padding: 10, selectedIndex: selectedIndex, setCandlesAndVisibleRange: setCandlesAndVisibleRange, setCurrentPoint: setCurrentPoint, setDrawings: setDrawings, setIsDrawing: setIsDrawing, setSelectedIndex: setSelectedIndex, setStartPoint: setStartPoint, setVisibleRange: setVisibleRange, startPoint: startPoint, visibleRange: visibleRange, xAxisHeight: xAxisHeight })),
            react_1.default.createElement("div", { className: "x-axis-container absolute bottom-0 left-0 w-full", style: { height: "".concat(xAxisHeight, "px") } },
                react_1.default.createElement(XAxis_1.default, { canvasSizes: canvasSizes, parentContainerRef: containerRef, timeDetailLevel: timeDetailLevel, timeFormat12h: timeFormat12h, visibleRange: visibleRange, xAxisHeight: xAxisHeight }))),
        yAxisPosition === 'right' && (react_1.default.createElement("div", { className: "left-y-axis-container relative flex h-full", style: { width: "".concat(yAxisWidth, "px") } },
            react_1.default.createElement(YAxis_1.default, { parentContainerRef: containerRef, canvasSizes: canvasSizes, maxPrice: maxPrice, minPrice: minPrice, numberOfYTicks: numberOfYTicks, xAxisHeight: xAxisHeight, yAxisPosition: yAxisPosition, yAxisWidth: yAxisWidth })))));
};
exports.ChartStage = ChartStage;
