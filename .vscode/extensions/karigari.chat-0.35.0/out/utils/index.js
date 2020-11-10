"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const os = require("os");
const constants_1 = require("../constants");
exports.openUrl = (url) => {
    const parsedUrl = vscode.Uri.parse(url);
    return vscode.commands.executeCommand(constants_1.VSCodeCommands.OPEN, parsedUrl);
};
exports.openSettings = () => {
    vscode.commands.executeCommand(constants_1.VSCodeCommands.OPEN_SETTINGS);
};
exports.setVsContext = (name, value) => {
    return vscode.commands.executeCommand("setContext", name, value);
};
exports.getExtension = (extensionId) => {
    return vscode.extensions.getExtension(extensionId);
};
exports.getExtensionVersion = () => {
    const extension = exports.getExtension(constants_1.EXTENSION_ID);
    return !!extension ? extension.packageJSON.version : undefined;
};
exports.getVersions = () => {
    return {
        os: `${os.type()} ${os.arch()} ${os.release()}`,
        extension: exports.getExtensionVersion(),
        editor: vscode.version
    };
};
exports.hasVslsExtensionPack = () => {
    return !!exports.getExtension(constants_1.VSLS_EXTENSION_PACK_ID);
};
exports.hasVslsExtension = () => {
    return !!exports.getExtension(constants_1.VSLS_EXTENSION_ID);
};
exports.hasVslsSpacesExtension = () => {
    return !!exports.getExtension(constants_1.VSLS_SPACES_EXTENSION_ID);
};
exports.sanitiseTokenString = (token) => {
    const trimmed = token.trim();
    const sansQuotes = trimmed.replace(/['"]+/g, "");
    return sansQuotes;
};
function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.uuidv4 = uuidv4;
function isSuperset(set, subset) {
    for (var elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}
exports.isSuperset = isSuperset;
function difference(setA, setB) {
    var _difference = new Set(setA);
    for (var elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}
exports.difference = difference;
function equals(setA, setB) {
    if (setA.size !== setB.size) {
        return false;
    }
    for (var a of setA) {
        if (!setB.has(a)) {
            return false;
        }
    }
    return true;
}
exports.equals = equals;
// User-defined type guard
// https://github.com/Microsoft/TypeScript/issues/20707#issuecomment-351874491
function notUndefined(x) {
    return x !== undefined;
}
exports.notUndefined = notUndefined;
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
exports.toTitleCase = toTitleCase;
function toDateString(date) {
    // Returns ISO-format date string for a given date
    let month = (date.getMonth() + 1).toString();
    let day = date.getDate().toString();
    if (month.length === 1) {
        month = `0${month}`;
    }
    if (day.length === 1) {
        day = `0${day}`;
    }
    return `${date.getFullYear()}-${month}-${day}`;
}
exports.toDateString = toDateString;
function camelCaseToTitle(text) {
    var result = text.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}
exports.camelCaseToTitle = camelCaseToTitle;
function titleCaseToCamel(text) {
    var result = text.replace(/ /g, "");
    return result.charAt(0).toLowerCase() + result.slice(1);
}
exports.titleCaseToCamel = titleCaseToCamel;
//# sourceMappingURL=index.js.map