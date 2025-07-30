"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleChartEdge = void 0;
var react_1 = require("react");
var ChartStage_1 = require("./Canvas/ChartStage");
var Toolbar_1 = require("./Toolbar/Toolbar");
var SettingsToolbar_1 = require("./Toolbar/SettingsToolbar");
require("../styles/App.scss");
var types_1 = require("../types/types");
var chartStyleOptions_1 = require("../types/chartStyleOptions");
var SimpleChartEdge = function (_a) {
    var _b = _a.initialCandles, initialCandles = _b === void 0 ? [] : _b, _c = _a.initialYAxisPosition, initialYAxisPosition = _c === void 0 ? types_1.AxesPosition.left : _c, _d = _a.initialMargin, initialMargin = _d === void 0 ? 20 : _d, _e = _a.initialNumberOfYTicks, initialNumberOfYTicks = _e === void 0 ? 5 : _e, _f = _a.initialXAxisHeight, initialXAxisHeight = _f === void 0 ? 40 : _f, _g = _a.initialYAxisWidth, initialYAxisWidth = _g === void 0 ? 50 : _g, _h = _a.initialTimeDetailLevel, initialTimeDetailLevel = _h === void 0 ? chartStyleOptions_1.TimeDetailLevel.Auto : _h, _j = _a.initialTimeFormat12h, initialTimeFormat12h = _j === void 0 ? false : _j, _k = _a.initialVisibleRange, initialVisibleRange = _k === void 0 ? {
        start: Date.now() - 7 * 24 * 60 * 60 * 1000,
        end: Date.now()
    } : _k;
    return (react_1.default.createElement("div", { className: 'main-app-window flex flex-col h-full w-full p-0 m-0' },
        react_1.default.createElement("div", { className: 'settings-area' },
            react_1.default.createElement(SettingsToolbar_1.SettingsToolbar, null)),
        react_1.default.createElement("div", { className: 'lower-container flex flex-1' },
            react_1.default.createElement("div", { className: 'toolbar-area' },
                react_1.default.createElement(Toolbar_1.Toolbar, null)),
            react_1.default.createElement("div", { className: 'chart-stage-area flex-1 h-full' },
                react_1.default.createElement(ChartStage_1.ChartStage, { initialCandles: initialCandles, initialYAxisPosition: initialYAxisPosition, initialMargin: initialMargin, initialNumberOfYTicks: initialNumberOfYTicks, initialXAxisHeight: initialXAxisHeight, initialYAxisWidth: initialYAxisWidth, initialTimeDetailLevel: initialTimeDetailLevel, initialTimeFormat12h: initialTimeFormat12h, initialVisibleRange: initialVisibleRange })))));
};
exports.SimpleChartEdge = SimpleChartEdge;
