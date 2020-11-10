"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const BASE_ISSUES_URL = "https://github.com/karigari/vscode-chat/issues/new";
class IssueReporter {
    static getVersionString() {
        const { extension, os, editor } = utils_1.getVersions();
        return `- Extension Version: ${extension}\n- OS Version: ${os}\n- VSCode version: ${editor}`;
    }
    static getUrl(query) {
        const getParams = (p) => Object.entries(p)
            .map(kv => kv.map(encodeURIComponent).join("="))
            .join("&");
        return `${BASE_ISSUES_URL}?${getParams(query)}`;
    }
    static openNewIssue(title, body) {
        const versions = this.getVersionString();
        const bodyText = `${body}\n\n${versions}`.replace(/\n/g, "%0A");
        const params = { title: `[vscode] ${title}`, body: bodyText };
        return utils_1.openUrl(this.getUrl(params));
    }
}
exports.default = IssueReporter;
//# sourceMappingURL=issues.js.map