"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsToolbar = void 0;
var react_1 = require("react");
require("../../styles/SettingsToolbar.scss");
var SettingsToolbar = function () {
    var handleDownload = function () {
        var canvas = document.querySelector('canvas'); // Ensure the tag name is lowercase
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.error('Canvas element not found or invalid.');
            return;
        }
        var link = document.createElement('a');
        link.download = 'chart-snapshot.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    var openSettingsMenu = function () {
        // This function should open the settings menu.
        // You can implement this based on your application's requirements.
        console.log('Opening settings menu...');
    };
    // add the styles using daisy-ui to all elements.
    //style all options in the select elements and all buttons with daisy ui styles.
    // I want this to look like a modern trading platform toolbar with a light theme.
    return (react_1.default.createElement("div", { className: 'settings-toolbar' },
        react_1.default.createElement("input", { type: "text", placeholder: "Symbol" }),
        react_1.default.createElement("select", null,
            react_1.default.createElement("option", { value: "1m" }, "1 Min"),
            react_1.default.createElement("option", { value: "5m" }, "5 Min"),
            react_1.default.createElement("option", { value: "1h" }, "1 Hour"),
            react_1.default.createElement("option", { value: "1d" }, "1 Day")),
        react_1.default.createElement("select", null,
            react_1.default.createElement("option", { value: "50" }, "50 Bars"),
            react_1.default.createElement("option", { value: "100" }, "100 Bars"),
            react_1.default.createElement("option", { value: "200" }, "200 Bars")),
        react_1.default.createElement("select", null,
            react_1.default.createElement("option", { value: "candlestick" }, "Candlestick"),
            react_1.default.createElement("option", { value: "line" }, "Line")),
        react_1.default.createElement("button", { onClick: handleDownload }, "\uD83D\uDCF8 Snapshot"),
        react_1.default.createElement("button", null, "\u2699\uFE0F Settings")));
};
exports.SettingsToolbar = SettingsToolbar;
