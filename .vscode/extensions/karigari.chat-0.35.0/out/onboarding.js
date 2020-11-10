"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const str = require("./strings");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
exports.setupSlack = () => {
    vscode.commands.executeCommand(constants_1.SelfCommands.SIGN_IN, {
        source: "info_message" /* info */,
        service: "slack"
    });
};
exports.setupDiscord = () => {
    utils_1.openUrl("https://github.com/karigari/vscode-chat/blob/master/docs/DISCORD.md");
};
exports.askForAuth = async () => {
    const actionItems = [str.SETUP_SLACK, str.SETUP_DISCORD];
    const selected = await vscode.window.showInformationMessage(str.TOKEN_NOT_FOUND, ...actionItems);
    switch (selected) {
        case str.SETUP_SLACK:
            exports.setupSlack();
            break;
        case str.SETUP_DISCORD:
            exports.setupDiscord();
            break;
    }
};
class CustomOnboardingTreeItem extends vscode.TreeItem {
    constructor(label, command) {
        super(label);
        this.command = {
            command,
            title: "",
            arguments: [{ source: "activity_bar" /* activity */ }]
        };
    }
}
const OnboardingCommands = {
    SETUP_SLACK: "extension.chat.onboarding.slack",
    SETUP_DISCORD: "extension.chat.onboarding.discord"
};
class OnboardingTreeProvider {
    constructor() {
        // private vslsViewId = "chat.treeView.onboarding.vsls";
        this.mainViewId = "chat.treeView.onboarding.main";
        this._disposables = [];
        this._disposables.push(
        // vscode.window.registerTreeDataProvider(this.vslsViewId, this),
        vscode.window.registerTreeDataProvider(this.mainViewId, this), vscode.commands.registerCommand(OnboardingCommands.SETUP_SLACK, exports.setupSlack), vscode.commands.registerCommand(OnboardingCommands.SETUP_DISCORD, exports.setupDiscord));
    }
    dispose() {
        this._disposables.forEach(dispose => dispose.dispose());
    }
    getChildren(element) {
        return Promise.resolve([
            { label: str.SETUP_SLACK, command: OnboardingCommands.SETUP_SLACK },
            { label: str.SETUP_DISCORD, command: OnboardingCommands.SETUP_DISCORD }
        ]);
    }
    getTreeItem(element) {
        const { label, command } = element;
        return new CustomOnboardingTreeItem(label, command);
    }
}
exports.OnboardingTreeProvider = OnboardingTreeProvider;
//# sourceMappingURL=onboarding.js.map