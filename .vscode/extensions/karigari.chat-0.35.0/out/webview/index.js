"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const utils_1 = require("../utils");
const SAME_GROUP_TIME = 5 * 60; // seconds
class WebviewContainer {
    constructor(extensionPath, onDidDispose, onDidChangeViewState) {
        this.onDidDispose = onDidDispose;
        this.onDidChangeViewState = onDidChangeViewState;
        const baseVuePath = path.join(extensionPath, "static");
        const staticPath = vscode.Uri.file(baseVuePath).with({
            scheme: "vscode-resource"
        });
        this.panel = vscode.window.createWebviewPanel("chatPanel", "Chat", vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(baseVuePath)]
        });
        this.panel.webview.html = getWebviewContent(staticPath.toString());
        // Handle on did dispose for webview panel
        this.panel.onDidDispose(() => this.onDidDispose());
        // Handle tab switching event
        this.panel.onDidChangeViewState(event => {
            const { visible } = event.webviewPanel;
            this.onDidChangeViewState(visible);
        });
    }
    setMessageHandler(msgHandler) {
        this.panel.webview.onDidReceiveMessage((message) => msgHandler(message));
    }
    update(uiMessage) {
        const { messages, users, channel, currentUser } = uiMessage;
        const annotated = this.getAnnotatedMessages(messages, channel, currentUser);
        const groups = this.getMessageGroups(annotated, users);
        this.panel.webview.postMessage(Object.assign({}, uiMessage, { messages: groups }));
        this.panel.title = !!channel ? channel.name : "";
    }
    reveal() {
        this.panel.reveal();
    }
    getAnnotatedMessages(messages, channel, currentUser) {
        if (!!channel) {
            // Annotates every message with isUnread (boolean)
            const { readTimestamp } = channel;
            let result = {};
            Object.keys(messages).forEach(ts => {
                const message = messages[ts];
                const isDifferentUser = message.userId !== currentUser.id;
                const isUnread = !!readTimestamp && isDifferentUser && +ts > +readTimestamp;
                result[ts] = Object.assign({}, message, { isUnread });
            });
            return result;
        }
        else {
            return messages;
        }
    }
    getMessageGroups(input, users) {
        let result = {};
        Object.keys(input).forEach(ts => {
            const date = new Date(+ts * 1000);
            const dateStr = utils_1.toDateString(date);
            if (!(dateStr in result)) {
                result[dateStr] = {};
            }
            result[dateStr][ts] = input[ts];
        });
        return Object.keys(result)
            .sort((a, b) => a.localeCompare(b))
            .map(date => {
            const messages = result[date];
            const groups = this.getMessageGroupsForDate(messages, users);
            return {
                groups,
                date
            };
        });
    }
    getMessageGroupsForDate(input, users) {
        const timestamps = Object.keys(input).sort((a, b) => +a - +b); // ascending
        const initial = {
            current: {},
            groups: []
        };
        const result = timestamps.reduce((accumulator, ts) => {
            const { current, groups } = accumulator;
            const message = input[ts];
            const isSameUser = current.userId
                ? message.userId === current.userId
                : false;
            const isSameTime = current.ts
                ? +ts - +current.ts < SAME_GROUP_TIME
                : false;
            if (isSameUser && isSameTime) {
                return {
                    groups,
                    current: Object.assign({}, current, { ts, messages: [...current.messages, message] })
                };
            }
            else {
                const currentGroup = {
                    messages: [message],
                    userId: message.userId,
                    user: users[message.userId],
                    minTimestamp: ts,
                    ts,
                    key: ts
                };
                return {
                    groups: current.ts ? [...groups, current] : [...groups],
                    current: currentGroup
                };
            }
        }, initial);
        const { current, groups } = result;
        return current.ts ? [...groups, current] : groups;
    }
    isVisible() {
        return this.panel.visible;
    }
}
exports.default = WebviewContainer;
function getWebviewContent(staticPath) {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" 
        content="default-src * vscode-resource: https: 'unsafe-inline' 'unsafe-eval';
        script-src vscode-resource: blob: data: https: 'unsafe-inline' 'unsafe-eval';
        style-src vscode-resource: https: 'unsafe-inline';
        img-src vscode-resource: data: https:;
        connect-src vscode-resource: blob: data: https: http:;">
      <title>Chat</title>

      <link href="${staticPath}/css/app.css" rel="preload" as="style">
      <link href="${staticPath}/js/chunk-vendors.js" rel="preload" as="script">
      <link href="${staticPath}/js/app.js" rel="preload" as="script">
      <link href="${staticPath}/css/app.css" rel="stylesheet">
  </head>
  <body>
      <div id="app"> </div>
      <script src="${staticPath}/js/chunk-vendors.js"> </script>
      <script src="${staticPath}/js/app.js"> </script>
  </body>
  </html>`;
}
//# sourceMappingURL=index.js.map