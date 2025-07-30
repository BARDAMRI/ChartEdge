"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var react_1 = require("react");
var chartedge_1 = require("chartedge");
// דוגמה לנתוני נרות - פשוט מאוד להמחשה
var exampleCandles = [
    { t: 1688000000000, o: 100, h: 110, l: 95, c: 105 },
    { t: 1688003600000, o: 105, h: 115, l: 100, c: 110 },
    { t: 1688007200000, o: 110, h: 120, l: 105, c: 115 },
];
// טווח זמן רלוונטי (התחלה וסוף בהתאמה)
var exampleVisibleRange = {
    start: exampleCandles[0].t,
    end: exampleCandles[exampleCandles.length - 1].t,
};
function App() {
    return (react_1.default.createElement("div", { style: { height: '100vh', width: '100vw' } },
        react_1.default.createElement(chartedge_1.SimpleChartEdge, { initialCandles: exampleCandles, initialYAxisPosition: AxesPosition.left, initialMargin: 20, initialNumberOfYTicks: 5, initialXAxisHeight: 40, initialYAxisWidth: 50, initialTimeDetailLevel: TimeDetailLevel.Auto, initialTimeFormat12h: false, initialVisibleRange: exampleVisibleRange })));
}
