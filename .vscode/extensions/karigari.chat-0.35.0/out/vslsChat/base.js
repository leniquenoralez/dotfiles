"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const constants_1 = require("../constants");
const utils_1 = require("./utils");
class VslsBaseService {
    constructor(currentUser) {
        this.currentUser = currentUser;
    }
    updateMessages(message) {
        const { timestamp } = message;
        let newMessages = {};
        newMessages[timestamp] = utils_1.toBaseMessage(message);
        vscode.commands.executeCommand(constants_1.SelfCommands.UPDATE_MESSAGES, {
            provider: "vsls",
            channelId: utils_1.VSLS_CHAT_CHANNEL.id,
            messages: newMessages
        });
    }
    showTyping(userId) {
        if (userId !== this.currentUser.id) {
            vscode.commands.executeCommand(constants_1.SelfCommands.SHOW_TYPING, {
                provider: "vsls",
                channelId: utils_1.VSLS_CHAT_CHANNEL.id,
                typingUserId: userId
            });
        }
    }
}
exports.VslsBaseService = VslsBaseService;
//# sourceMappingURL=base.js.map