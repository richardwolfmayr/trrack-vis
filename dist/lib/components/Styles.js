"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.treeColor = void 0;
var typestyle_1 = require("typestyle");
exports.treeColor = function (current) {
    return typestyle_1.style({
        fill: current ? 'rgb(88, 22, 22)' : 'white',
        stroke: 'rgb(88, 22, 22)'
    });
};
//# sourceMappingURL=Styles.js.map