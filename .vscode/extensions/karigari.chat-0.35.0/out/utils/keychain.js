"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// From https://github.com/Microsoft/vscode-pull-request-github/blob/master/src/common/keychain.ts
const vscode = require("vscode");
function getNodeModule(moduleName) {
    const vscodeRequire = eval("require");
    try {
        return vscodeRequire(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
    }
    catch (err) {
        // Not in ASAR.
    }
    try {
        return vscodeRequire(`${vscode.env.appRoot}/node_modules/${moduleName}`);
    }
    catch (err) {
        // Not available.
    }
    return undefined;
}
exports.keychain = getNodeModule("keytar");
//# sourceMappingURL=keychain.js.map