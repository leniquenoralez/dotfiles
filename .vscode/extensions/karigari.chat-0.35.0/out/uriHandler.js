"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const str = require("./strings");
const issues_1 = require("./issues");
const config_1 = require("./config");
class ExtensionUriHandler {
    handleUri(uri) {
        // vscode://karigari.chat/redirect?url=foobar
        const { path, query } = uri;
        const parsed = this.parseQuery(query);
        const { token, msg, service, team } = parsed;
        switch (path) {
            case "/redirect":
                return config_1.ConfigHelper.setToken(token, service, team);
            case "/error":
                return this.showIssuePrompt(msg, service);
        }
    }
    showIssuePrompt(errorMsg, service) {
        const actionItems = [str.REPORT_ISSUE];
        vscode.window
            .showWarningMessage(str.AUTH_FAILED_MESSAGE, ...actionItems)
            .then(selected => {
            switch (selected) {
                case str.REPORT_ISSUE:
                    const issue = `Sign in with ${service} failed: ${errorMsg}`;
                    issues_1.default.openNewIssue(issue, issue);
            }
        });
    }
    parseQuery(queryString) {
        // From https://stackoverflow.com/a/13419367
        const filtered = queryString[0] === "?" ? queryString.substr(1) : queryString;
        const pairs = filtered.split("&");
        var query = {};
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split("=");
            const key = decodeURIComponent(pair[0]);
            const value = decodeURIComponent(pair[1] || "");
            query[key] = value;
        }
        return query;
    }
}
exports.ExtensionUriHandler = ExtensionUriHandler;
//# sourceMappingURL=uriHandler.js.map