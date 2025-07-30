"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toolbar = void 0;
var react_1 = require("react");
var ModeContext_1 = require("../../contexts/ModeContext");
var ModeButton_1 = require("./ModeButton");
require("../../styles/Toolbar.scss");
var Toolbar = function () {
    var _a = (0, ModeContext_1.useMode)(), mode = _a.mode, setMode = _a.setMode;
    return (react_1.default.createElement("div", { className: 'toolbar-container' },
        react_1.default.createElement("div", { className: 'toolbar' },
            react_1.default.createElement(ModeButton_1.default, { mode: ModeContext_1.Mode.drawLine, currentMode: mode, onClick: setMode, label: "D Line" }),
            react_1.default.createElement(ModeButton_1.default, { mode: ModeContext_1.Mode.drawRectangle, currentMode: mode, onClick: setMode, label: "D Rect" }),
            react_1.default.createElement(ModeButton_1.default, { mode: ModeContext_1.Mode.drawCircle, currentMode: mode, onClick: setMode, label: "D Cir" }),
            react_1.default.createElement(ModeButton_1.default, { mode: ModeContext_1.Mode.drawTriangle, currentMode: mode, onClick: setMode, label: "D Triangle" }),
            react_1.default.createElement(ModeButton_1.default, { mode: ModeContext_1.Mode.drawAngle, currentMode: mode, onClick: setMode, label: "D Angle" }),
            react_1.default.createElement(ModeButton_1.default, { mode: ModeContext_1.Mode.select, currentMode: mode, onClick: setMode, label: "Select" }),
            react_1.default.createElement(ModeButton_1.default, { mode: ModeContext_1.Mode.editShape, currentMode: mode, onClick: setMode, label: "Edit" }))));
};
exports.Toolbar = Toolbar;
