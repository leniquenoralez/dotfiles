"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const constants_1 = require("./constants");
class Logger {
    static setup() {
        this.output =
            this.output || vscode.window.createOutputChannel(constants_1.OUTPUT_CHANNEL_NAME);
    }
    static get timestamp() {
        const now = new Date();
        return now.toLocaleString();
    }
    static logOnConsole(message) {
        console.log(message);
    }
    static logOnOutput(message) {
        if (this.output === undefined) {
            this.setup();
        }
        if (!!this.output) {
            this.output.appendLine(message);
        }
    }
    static log(message) {
        const logLine = `[${this.timestamp}] Chat: ${message}`;
        return process.env.IS_DEBUG === "true"
            ? this.logOnConsole(logLine)
            : this.logOnOutput(logLine);
    }
}
exports.default = Logger;
//# sourceMappingURL=logger.js.map