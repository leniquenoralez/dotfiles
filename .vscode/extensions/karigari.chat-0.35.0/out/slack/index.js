"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const constants_1 = require("../constants");
const client_1 = require("./client");
const messenger_1 = require("./messenger");
const stripLinkSymbols = (text) => {
    // To send out live share links and render them correctly,
    // we append </> to the link text. However, this is not
    // handled by normal Slack clients, and should be removed before
    // we actually send the message via the RTM API
    // This is hacky, and we will need a better solution - perhaps
    // we could make all rendering manipulations on the extension side
    // before sending the message to Vuejs for rendering
    if (text.startsWith("<") && text.endsWith(">")) {
        return text.substr(1, text.length - 2);
    }
    else {
        return text;
    }
};
class SlackChatProvider {
    constructor(token, manager) {
        this.token = token;
        this.manager = manager;
        this.teamDndState = {};
        this.dndTimers = [];
        this.client = new client_1.default(this.token);
        this.messenger = new messenger_1.default(this.token, (userId, presence) => this.onPresenceChanged(userId, presence), (userId, dndState) => this.onDndStateChanged(userId, dndState));
    }
    validateToken() {
        // This is creating a new client, since getToken from keychain
        // is not called before validation
        return this.client.authTest();
    }
    connect() {
        return this.messenger.start();
    }
    isConnected() {
        return !!this.messenger && this.messenger.isConnected();
    }
    subscribePresence(users) {
        return this.messenger.subscribePresence(users);
    }
    createIMChannel(user) {
        return this.client.openIMChannel(user);
    }
    fetchUsers() {
        // async update for dnd statuses
        this.client.getDndTeamInfo().then(response => {
            this.teamDndState = response;
            this.updateDndTimers();
        });
        return this.client.getUsers();
    }
    fetchChannels(users) {
        // users argument is required to associate IM channels
        // with users
        return this.client.getChannels(users);
    }
    onPresenceChanged(userId, rawPresence) {
        // This method is called from the websocket client
        // Here, we parse the incoming raw presence (active / away), and use our
        // known dnd related information, to find the final answer for this user
        let presence = "unknown" /* unknown */;
        switch (rawPresence) {
            case "active":
                presence = "available" /* available */;
                break;
            case "away":
                presence = "offline" /* offline */;
                break;
        }
        if (presence === "available" /* available */) {
            // Check user has dnd active right now
            const userDnd = this.teamDndState[userId];
            if (!!userDnd) {
                const current = +new Date() / 1000.0;
                if (current > userDnd.next_dnd_start_ts &&
                    current < userDnd.next_dnd_end_ts) {
                    presence = "doNotDisturb" /* doNotDisturb */;
                }
            }
        }
        this.updateUserPresence(userId, presence);
    }
    updateUserPresence(userId, presence) {
        vscode.commands.executeCommand(constants_1.SelfCommands.UPDATE_PRESENCE_STATUSES, {
            userId,
            presence,
            provider: "slack"
        });
    }
    onDndStateChanged(userId, dndState) {
        this.teamDndState[userId] = dndState;
        this.updateDndTimerForUser(userId);
    }
    updateDndTimers() {
        const userIds = Object.keys(this.teamDndState);
        userIds.forEach(userId => {
            this.updateDndTimerForUser(userId);
        });
    }
    updateDndTimerForUser(userId) {
        const dndState = this.teamDndState[userId];
        const currentTime = +new Date() / 1000.0;
        const { next_dnd_end_ts: dndEnd, next_dnd_start_ts: dndStart } = dndState;
        if (currentTime < dndStart) {
            // Impending start event, so we will define a start timer
            const delay = (dndStart - currentTime) * 1000;
            const timer = setTimeout(() => {
                // If user is available, change to dnd
                const presence = this.manager.getUserPresence("slack", userId);
                if (presence === "available" /* available */) {
                    this.updateUserPresence(userId, "doNotDisturb" /* doNotDisturb */);
                }
            }, delay);
            this.dndTimers.push(timer);
        }
        if (currentTime < dndEnd) {
            // Impending end event, so define a start timer
            const delay = (dndEnd - currentTime) * 1000;
            const timer = setTimeout(() => {
                // If user is dnd, change to available
                const presence = this.manager.getUserPresence("slack", userId);
                if (presence === "doNotDisturb" /* doNotDisturb */) {
                    this.updateUserPresence(userId, "available" /* available */);
                }
            }, delay);
            this.dndTimers.push(timer);
        }
    }
    fetchUserInfo(userId) {
        if (userId.startsWith("B")) {
            return this.client.getBotInfo(userId);
        }
        else {
            return this.client.getUserInfo(userId);
        }
    }
    loadChannelHistory(channelId) {
        return this.client.getConversationHistory(channelId);
    }
    getUserPreferences() {
        return this.client.getUserPrefs();
    }
    markChannel(channel, timestamp) {
        return this.client.markChannel(channel, timestamp);
    }
    fetchThreadReplies(channelId, timestamp) {
        return this.client.getReplies(channelId, timestamp);
    }
    fetchChannelInfo(channel) {
        return this.client.getChannelInfo(channel);
    }
    sendThreadReply(text, currentUserId, channelId, parentTimestamp) {
        const cleanText = stripLinkSymbols(text);
        return this.client.sendMessage(channelId, cleanText, parentTimestamp);
    }
    async sendMessage(text, currentUserId, channelId) {
        const cleanText = stripLinkSymbols(text);
        try {
            const result = await this.messenger.sendMessage(channelId, cleanText);
            // TODO: this is not the correct timestamp to attach, since the
            // API might get delayed, because of network issues
            let newMessages = {};
            newMessages[result.ts] = {
                userId: currentUserId,
                timestamp: result.ts,
                text,
                content: undefined,
                reactions: [],
                replies: {}
            };
            vscode.commands.executeCommand(constants_1.SelfCommands.UPDATE_MESSAGES, {
                channelId,
                messages: newMessages,
                provider: "slack"
            });
        }
        catch (error) {
            return console.error(error);
        }
    }
    async updateSelfPresence(presence, durationInMinutes) {
        let response;
        const currentPresence = this.manager.getCurrentUserPresence("slack");
        switch (presence) {
            case "doNotDisturb" /* doNotDisturb */:
                response = await this.client.setUserSnooze(durationInMinutes);
                break;
            case "available" /* available */:
                if (currentPresence === "doNotDisturb" /* doNotDisturb */) {
                    // client.endUserDnd() can handle both situations -- when user is on
                    // snooze, and when user is on a scheduled dnd
                    response = await this.client.endUserDnd();
                }
                else {
                    response = await this.client.setUserPresence("auto");
                }
                break;
            case "invisible" /* invisible */:
                response = await this.client.setUserPresence("away");
                break;
            default:
                throw new Error(`unsupported presence type`);
        }
        return !!response ? presence : undefined;
    }
    destroy() {
        if (!!this.messenger) {
            this.messenger.disconnect();
        }
        this.dndTimers.forEach(timer => {
            clearTimeout(timer);
        });
        return Promise.resolve();
    }
    async sendTyping(currentUserId, channelId) { }
}
exports.SlackChatProvider = SlackChatProvider;
//# sourceMappingURL=index.js.map