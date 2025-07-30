"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var ModeButton = function (_a) {
    var mode = _a.mode, currentMode = _a.currentMode, onClick = _a.onClick, label = _a.label;
    var selected = mode === currentMode;
    return (react_1.default.createElement("button", { className: selected ? 'selected' : '', onClick: function () { return onClick(mode); } }, label));
};
exports.default = ModeButton;
