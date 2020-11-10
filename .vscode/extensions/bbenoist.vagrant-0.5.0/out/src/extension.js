"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vagrantExt = require("./vagrant-extension");
function activate(context) {
    vagrantExt.registerCommands(context);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map