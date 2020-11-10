"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const webview_1 = require("../webview");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const commands_1 = require("./commands");
const markdowner_1 = require("./markdowner");
exports.getCommand = (text) => {
    const pattern = /^\/(\w+) (\w+)$/;
    const trimmed = text.trim();
    const matched = trimmed.match(pattern);
    if (matched) {
        return { namespace: matched[1], subcommand: matched[2] };
    }
};
class ViewController {
    constructor(context, onUIDispose, onUIVisible, onUIFocus) {
        this.context = context;
        this.onUIDispose = onUIDispose;
        this.onUIVisible = onUIVisible;
        this.onUIFocus = onUIFocus;
        this.isUIReady = false; // Vuejs loaded
        this.pendingMessage = undefined;
        this.isUILoaded = () => !!this.ui;
        this.loadUi = () => {
            if (this.ui) {
                this.ui.reveal();
            }
            else {
                const { extensionPath } = this.context;
                this.ui = new webview_1.default(extensionPath, () => {
                    this.ui = undefined;
                    this.isUIReady = false;
                    this.onUIDispose(this.currentProvider, this.currentSource);
                }, isVisible => (isVisible ? this.onUIVisible(this.currentProvider) : null));
                this.ui.setMessageHandler(this.sendToExtension);
            }
        };
        this.isValidCommand = (text, commandList) => {
            const parsed = exports.getCommand(text);
            if (parsed) {
                const { namespace, subcommand } = parsed;
                if (namespace in commandList) {
                    const subcommands = Object.keys(commandList[namespace]);
                    return subcommands.indexOf(subcommand) >= 0;
                }
            }
            return false;
        };
        this.isValidReverseCommand = (text) => {
            return this.isValidCommand(text, constants_1.REVERSE_SLASH_COMMANDS);
        };
        this.handleCommand = (text) => {
            if (this.isValidCommand(text, constants_1.SLASH_COMMANDS)) {
                const parsed = exports.getCommand(text);
                if (!!parsed) {
                    const { namespace, subcommand } = parsed;
                    if (namespace === "live" && subcommand === "share") {
                        // Temporary bypass for "/live share" till we move
                        // all of this to the common command handlers
                        return vscode.commands.executeCommand(constants_1.SelfCommands.LIVE_SHARE_SLASH, {
                            provider: this.currentProvider
                        });
                    }
                    else {
                        return this.dispatchCommand(parsed);
                    }
                }
            }
            if (text === "/clear") {
                return vscode.commands.executeCommand(constants_1.SelfCommands.CLEAR_MESSAGES, {
                    channelId: this.currentChannelId,
                    provider: this.currentProvider
                });
            }
            if (text === "/invite") {
                return vscode.commands.executeCommand(constants_1.SelfCommands.INVITE_LIVE_SHARE_CONTACT, {
                    channelId: this.currentChannelId,
                    provider: this.currentProvider
                });
            }
            if (this.isValidReverseCommand(text)) {
                return this.sendTextMessage(text);
            }
            // TODO(arjun): if not valid, then we need to parse and make a chat.command
            // API call, instead of sending it as a simple text message.
            // Docs: https://github.com/ErikKalkoken/slackApiDoc/blob/master/chat.command.md
            return this.sendTextMessage(text);
        };
        this.handleInternal = (message) => {
            const { text } = message;
            if (text === "is_ready") {
                this.isUIReady = true;
                return this.pendingMessage ? this.sendToUI(this.pendingMessage) : null;
            }
            if (text === "is_focused") {
                this.onUIFocus(this.currentProvider);
            }
            if (text === "fetch_replies") {
                const { parentTimestamp } = message;
                vscode.commands.executeCommand(constants_1.SelfCommands.FETCH_REPLIES, {
                    parentTimestamp,
                    provider: this.currentProvider
                });
            }
            if (text === "is_typing") {
                vscode.commands.executeCommand(constants_1.SelfCommands.SEND_TYPING, {
                    channelId: this.currentChannelId,
                    provider: this.currentProvider
                });
            }
        };
        this.sendTextMessage = (text) => {
            return vscode.commands.executeCommand(constants_1.SelfCommands.SEND_MESSAGE, {
                text,
                provider: this.currentProvider
            });
        };
        this.sendThreadReply = (payload) => {
            const { text, parentTimestamp } = payload;
            return vscode.commands.executeCommand(constants_1.SelfCommands.SEND_THREAD_REPLY, {
                text,
                parentTimestamp,
                provider: this.currentProvider
            });
        };
        this.sendToExtension = (message) => {
            const { type, text } = message;
            logger_1.default.log(`Sending to extension (${type}) ${text}`);
            switch (type) {
                case "internal":
                    return this.handleInternal(message);
                case "link":
                    return this.dispatchCommand({ namespace: "open", subcommand: text });
                case "command":
                    return this.handleCommand(text);
                case "text":
                    return text ? this.sendTextMessage(text) : null;
                case "thread_reply":
                    return this.sendThreadReply(text);
            }
        };
        this.handleReverseCommands = (uiMessage) => {
            // TODO: Reverse commands are disabled, until we fix this
            // Reverse commands are slash commands fired by other Slack users
            // For example, `/live request` requests someone to host a session
            const { currentUser, messages } = uiMessage;
            let handledMessages = {};
            Object.keys(messages).forEach(ts => {
                // Any of these messages might be reverse commands
                const { text, userId } = messages[ts];
                const notCurrentUser = currentUser.id !== userId;
                // let textHTML = messages[ts].textHTML;
                if (this.isValidReverseCommand(text) && notCurrentUser) {
                    if (text === "/live request") {
                        const confirmation = `<a href="#" onclick="sendCommand('/live share'); return false;">Accept</a>`;
                        // textHTML = `${str.LIVE_REQUEST_MESSAGE} ${confirmation}`;
                    }
                }
                handledMessages[ts] = Object.assign({}, messages[ts]
                // textHTML
                );
            });
            return Object.assign({}, uiMessage, { messages: handledMessages });
        };
        this.updateCurrentState = (provider, channelId, source) => {
            this.currentProvider = provider;
            this.currentChannelId = channelId;
            this.currentSource = source;
        };
        this.sendToUI = (uiMessage) => {
            const { provider: incomingProvider, channel: incomingChannel } = uiMessage;
            if (!!this.ui && this.ui.isVisible()) {
                // The webview is visible => we check if the incoming message is valid.
                const isSameProvider = !this.currentProvider || incomingProvider === this.currentProvider;
                const isSameChannel = !this.currentChannelId || incomingChannel.id === this.currentChannelId;
                if (!isSameChannel || !isSameProvider) {
                    return; // Ignore this message.
                }
            }
            if (!this.isUIReady) {
                this.pendingMessage = uiMessage;
            }
            else {
                const { messages } = uiMessage;
                const size = Object.keys(messages).length;
                logger_1.default.log(`Sending to webview: ${size} messages`);
                // Handle markdown
                const mdMessages = markdowner_1.default(uiMessage);
                // Handle reverse slash commands
                // Since this overwrites the textHTML field, it should happen
                // after the markdown
                const message = this.handleReverseCommands(mdMessages);
                // Send to UI after markdown
                if (this.ui) {
                    this.ui.update(message);
                    this.pendingMessage = undefined;
                }
            }
        };
    }
    dispatchCommand(command) {
        const handler = new commands_1.default();
        handler.handle(command).then(result => {
            if (!!result) {
                const { sendToSlack, response } = result;
                if (sendToSlack && response) {
                    this.sendTextMessage(response);
                }
            }
        });
    }
}
exports.default = ViewController;
//# sourceMappingURL=index.js.map