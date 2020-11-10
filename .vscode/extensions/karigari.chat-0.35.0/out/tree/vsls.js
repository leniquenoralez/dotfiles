"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vsls = require("vsls");
const vscode = require("vscode");
const constants_1 = require("../constants");
const utils_1 = require("../vslsChat/utils");
const LIVE_SHARE_VIEW_ID = "liveshare.session";
const LIVE_SHARE_EXPLORER_VIEW_ID = "liveshare.session.explorer";
const TREE_ITEM_LABEL = "Chat Channel";
class VslsSessionTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._disposables = [];
        this.unreadCount = 0;
        const baseCommand = constants_1.SelfCommands.OPEN_WEBVIEW;
        this.commandName = `${baseCommand}.activityBar`;
        // Construct a compound command around base command to send
        // the correct event source value for telemetry
        const chatArgs = {
            source: "activity_bar" /* activity */,
            providerName: "vsls",
            channelId: utils_1.VSLS_CHAT_CHANNEL.id
        };
        this.disposableCommand = vscode.commands.registerCommand(this.commandName, () => vscode.commands.executeCommand(baseCommand, chatArgs));
        this._disposables.push(this.disposableCommand);
    }
    updateUnreadCount(count) {
        this.unreadCount = count;
        this.refresh();
    }
    async refresh(treeItem) {
        return treeItem
            ? this._onDidChangeTreeData.fire(treeItem)
            : this._onDidChangeTreeData.fire();
    }
    async register() {
        const liveshare = await vsls.getApi();
        if (!!liveshare) {
            this._disposables.push(liveshare.registerTreeDataProvider(LIVE_SHARE_VIEW_ID, this));
            this._disposables.push(liveshare.registerTreeDataProvider(LIVE_SHARE_EXPLORER_VIEW_ID, this));
        }
    }
    getTreeItem(element) {
        let label = element.label;
        if (this.unreadCount > 0) {
            label = `${label} (${this.unreadCount} new)`;
        }
        const treeItem = new vscode.TreeItem(label);
        treeItem.command = {
            command: this.commandName,
            title: TREE_ITEM_LABEL,
            arguments: []
        };
        return treeItem;
    }
    getChildren(element) {
        return Promise.resolve([{ label: TREE_ITEM_LABEL }]);
    }
    dispose() {
        this._disposables.forEach(dispose => dispose.dispose());
    }
}
exports.VslsSessionTreeProvider = VslsSessionTreeProvider;
//# sourceMappingURL=vsls.js.map