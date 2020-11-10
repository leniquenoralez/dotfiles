"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const constants_1 = require("../constants");
const selfExtension = vscode.extensions.getExtension(constants_1.EXTENSION_ID);
const BASE_PATH = path.join(selfExtension.extensionPath, "public", "icons", "presence");
const PRESENCE_ICONS = {
    green: path.join(BASE_PATH, "green.svg"),
    red: path.join(BASE_PATH, "red.svg"),
    yellow: path.join(BASE_PATH, "yellow.svg")
};
class WorkspaceTreeItem extends vscode.TreeItem {
    constructor(label, provider, team) {
        super(label);
        if (!!team) {
            this.command = {
                command: constants_1.SelfCommands.CHANGE_WORKSPACE,
                title: "",
                arguments: [{ team, provider }]
            };
        }
    }
}
exports.WorkspaceTreeItem = WorkspaceTreeItem;
class ChannelTreeItem extends vscode.TreeItem {
    constructor(label, presence, isCategory, providerName, channel, user) {
        super(label);
        if (!!channel) {
            // This is a channel item
            this.contextValue = "channel";
            const chatArgs = {
                channelId: channel ? channel.id : undefined,
                user,
                providerName,
                source: "activity_bar" /* activity */
            };
            this.command = {
                command: constants_1.SelfCommands.OPEN_WEBVIEW,
                title: "",
                arguments: [chatArgs]
            };
        }
        switch (presence) {
            case "available" /* available */:
                this.iconPath = {
                    light: PRESENCE_ICONS.green,
                    dark: PRESENCE_ICONS.green
                };
                break;
            case "doNotDisturb" /* doNotDisturb */:
                this.iconPath = {
                    light: PRESENCE_ICONS.red,
                    dark: PRESENCE_ICONS.red
                };
                break;
            case "idle" /* idle */:
                this.iconPath = {
                    light: PRESENCE_ICONS.yellow,
                    dark: PRESENCE_ICONS.yellow
                };
                break;
        }
        if (isCategory) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
    }
}
exports.ChannelTreeItem = ChannelTreeItem;
//# sourceMappingURL=treeItem.js.map