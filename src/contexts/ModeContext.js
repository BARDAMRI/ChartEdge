"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMode = exports.ModeProvider = exports.Mode = void 0;
var react_1 = require("react");
var Mode;
(function (Mode) {
    Mode[Mode["none"] = 0] = "none";
    Mode[Mode["drawLine"] = 1] = "drawLine";
    Mode[Mode["drawRectangle"] = 2] = "drawRectangle";
    Mode[Mode["drawCircle"] = 3] = "drawCircle";
    Mode[Mode["drawTriangle"] = 4] = "drawTriangle";
    Mode[Mode["drawAngle"] = 5] = "drawAngle";
    Mode[Mode["select"] = 6] = "select";
    Mode[Mode["editShape"] = 7] = "editShape";
    Mode[Mode["drawPolyline"] = 8] = "drawPolyline";
    Mode[Mode["drawArrow"] = 9] = "drawArrow";
    Mode[Mode["drawCustomSymbol"] = 10] = "drawCustomSymbol";
    Mode[Mode["drawText"] = 11] = "drawText";
})(Mode || (exports.Mode = Mode = {}));
var ModeContext = (0, react_1.createContext)(undefined);
var ModeProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(Mode.none), mode = _b[0], setModeState = _b[1];
    var setMode = function (newMode) {
        setModeState(function (prev) { return (prev === newMode ? Mode.none : newMode); });
    };
    return (react_1.default.createElement(ModeContext.Provider, { value: { mode: mode, setMode: setMode } }, children));
};
exports.ModeProvider = ModeProvider;
var useMode = function () {
    var context = (0, react_1.useContext)(ModeContext);
    if (!context) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};
exports.useMode = useMode;
