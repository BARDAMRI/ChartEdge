"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleApp = void 0;
var react_1 = require("react");
var SimpleChartEdge_1 = require("../src/components/SimpleChartEdge"); // או הנתיב אליו יצאת את הקומפוננטה שלך
var ExampleApp = function () {
    // אם הקומפוננטה שלך צריכה פרופס של נתונים - תעביר כאן
    // נניח שזה פשוט כרגע קומפוננטה עצמאית ללא פרופס, אחרת תתאים לפי מימוש
    return (react_1.default.createElement("div", { style: { height: '100vh', width: '100vw' } },
        react_1.default.createElement(SimpleChartEdge_1.SimpleChartEdge, null)));
};
exports.ExampleApp = ExampleApp;
