"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utils_1 = require("../utils");
const discord_1 = require("../discord");
const slack_1 = require("../slack");
const views_1 = require("./views");
const config_1 = require("../config");
const chatManager_1 = require("./chatManager");
const constants_1 = require("../constants");
const vslsSpaces_1 = require("../vslsSpaces");
class Manager {
    constructor(store) {
        this.store = store;
        this.isTokenInitialized = false;
        this.chatProviders = new Map();
        this.migrateTokenForSlack = async (teamId) => {
            // Migration for 0.10.x
            const teamToken = await config_1.ConfigHelper.getToken("slack", teamId);
            if (!teamToken) {
                const slackToken = await config_1.ConfigHelper.getToken("slack");
                if (!!slackToken) {
                    await config_1.ConfigHelper.setToken(slackToken, "slack", teamId);
                    await config_1.ConfigHelper.clearToken("slack");
                }
            }
        };
        this.initializeToken = async (newInitialState) => {
            let enabledProviderStates = this.getEnabledProviders(newInitialState);
            if (Object.keys(enabledProviderStates).length === 0) {
                // Do this to ensure we load vsls, need to delay for vscode.getExtension
                // to work properly right after installation (and no restart).
                const delay = (ms) => new Promise(res => setTimeout(res, ms));
                await delay(5 * 1000);
                enabledProviderStates = this.getEnabledProviders(newInitialState);
            }
            for (const initialState of enabledProviderStates) {
                const { provider: stateProvider, teamId } = initialState;
                const provider = stateProvider;
                if (!!provider) {
                    if (provider === "slack" /* slack */ && !!teamId) {
                        this.migrateTokenForSlack(teamId);
                    }
                    const token = await config_1.ConfigHelper.getToken(provider, teamId);
                    if (!!token) {
                        const existingProvider = this.chatProviders.get(provider);
                        if (!existingProvider || existingProvider.teamId !== teamId) {
                            const chatProvider = this.instantiateChatProvider(token, provider);
                            const chatManager = new chatManager_1.ChatProviderManager(this.store, provider, teamId, chatProvider, this);
                            this.chatProviders.set(provider, chatManager);
                        }
                        this.isTokenInitialized = true;
                    }
                }
            }
            this.initializeViewsManager();
        };
        this.initializeViewsManager = () => {
            const enabledProviders = Array.from(this.chatProviders.keys());
            let providerTeams = {};
            enabledProviders.forEach(provider => {
                const chatProvider = this.chatProviders.get(provider);
                if (!!chatProvider) {
                    providerTeams[provider] = chatProvider.getTeams();
                }
            });
            this.viewsManager.initialize(enabledProviders, providerTeams);
        };
        this.initializeProviders = async () => {
            for (let entry of Array.from(this.chatProviders.entries())) {
                let chatProvider = entry[1];
                try {
                    await chatProvider.initializeProvider();
                }
                catch (err) {
                    // try-catch will save vsls in case vslsSpaces crashes because
                    // it cannot find exports for the vslsSpaces extension.
                    console.log(err);
                }
            }
        };
        this.getCurrentUserPresence = (provider) => {
            const cp = this.chatProviders.get(provider);
            return !!cp ? cp.getCurrentUserPresence() : undefined;
        };
        this.updateCurrentWorkspace = async (provider, team) => {
            const existingUserInfo = this.getCurrentUserFor(provider);
            if (!!existingUserInfo) {
                const newCurrentUser = Object.assign({}, existingUserInfo, { currentTeamId: team.id });
                return this.store.updateCurrentUser(provider, newCurrentUser);
            }
        };
        this.sendMessage = async (providerName, text, channelId, parentTimestamp) => {
            const cp = this.chatProviders.get(providerName);
            return !!cp ? cp.sendMessage(text, channelId, parentTimestamp) : undefined;
        };
        this.updateSelfPresence = async (providerName, presence, durationInMinutes) => {
            const cp = this.chatProviders.get(providerName);
            return !!cp ? cp.updateSelfPresence(presence, durationInMinutes) : undefined;
        };
        this.updatePresenceForUser = (providerName, userId, presence) => {
            const cp = this.chatProviders.get(providerName);
            return !!cp ? cp.updatePresenceForUser(userId, presence) : undefined;
        };
        this.getChannel = (provider, channelId) => {
            const cp = this.chatProviders.get(provider);
            return !!cp ? cp.getChannel(channelId) : undefined;
        };
        this.fetchUsers = (providerName) => {
            const cp = this.chatProviders.get(providerName);
            return !!cp ? cp.fetchUsers() : undefined;
        };
        this.fetchChannels = (providerName) => {
            const cp = this.chatProviders.get(providerName);
            return !!cp ? cp.fetchChannels() : undefined;
        };
        this.getMessages = (providerName) => {
            const cp = this.chatProviders.get(providerName);
            return !!cp ? cp.messages : {};
        };
        this.getUnreadCount = (provider, channel) => {
            const cp = this.chatProviders.get(provider);
            return !!cp ? cp.getUnreadCount(channel) : 0;
        };
        this.viewsManager = new views_1.ViewsManager(this);
    }
    getEnabledProviders(newInitialState) {
        // if newInitialState is specified, enabled list must include it
        let currentUserInfos = this.store.getCurrentUserForAll();
        let providerTeamIds = {};
        currentUserInfos.forEach(currentUser => {
            const { provider } = currentUser;
            if (provider !== "vslsSpaces") {
                // This provider is dependent on installed extensions, not the user state
                providerTeamIds[currentUser.provider] = currentUser.currentTeamId;
            }
        });
        const hasVslsSpaces = utils_1.hasVslsSpacesExtension();
        if (hasVslsSpaces) {
            providerTeamIds["vslsSpaces" /* vslsSpaces */] = undefined;
        }
        if (!!newInitialState) {
            providerTeamIds[newInitialState.provider] = newInitialState.teamId;
        }
        if (!!providerTeamIds["discord" /* discord */]) {
            providerTeamIds["discord" /* discord */] = undefined;
        }
        return Object.keys(providerTeamIds).map(provider => ({
            provider,
            teamId: providerTeamIds[provider]
        }));
    }
    isProviderEnabled(provider) {
        const cp = this.chatProviders.get(provider);
        return !!cp;
    }
    getCurrentTeamIdFor(provider) {
        const currentUser = this.store.getCurrentUser(provider);
        return !!currentUser ? currentUser.currentTeamId : undefined;
    }
    getCurrentUserFor(provider) {
        return this.store.getCurrentUser(provider);
    }
    getChatProvider(providerName) {
        return this.chatProviders.get(providerName);
    }
    instantiateChatProvider(token, provider) {
        switch (provider) {
            case "discord":
                return new discord_1.DiscordChatProvider(token, this);
            case "slack":
                return new slack_1.SlackChatProvider(token, this);
            case "vslsSpaces":
                return new vslsSpaces_1.VslsSpacesProvider();
            default:
                throw new Error(`unsupport chat provider: ${provider}`);
        }
    }
    async validateToken(provider, token) {
        const chatProvider = this.instantiateChatProvider(token, provider);
        const currentUser = await chatProvider.validateToken();
        return currentUser;
    }
    isAuthenticated(providerName) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.isAuthenticated() : false;
    }
    async initializeStateForAll() {
        for (let entry of Array.from(this.chatProviders.entries())) {
            let chatProvider = entry[1];
            await chatProvider.initializeState();
        }
    }
    subscribePresenceForAll() {
        for (let entry of Array.from(this.chatProviders.entries())) {
            let chatProvider = entry[1];
            chatProvider.subscribeForPresence();
        }
    }
    async updateUserPrefsForAll() {
        for (let entry of Array.from(this.chatProviders.entries())) {
            let chatProvider = entry[1];
            await chatProvider.updateUserPrefs();
        }
    }
    async signout() {
        // This will sign out of slack and discord. vsls depends only on whether
        // the vsls extension has been installed.
        let hasSignedOut = false;
        for (let entry of Array.from(this.chatProviders.entries())) {
            let providerName = entry[0];
            await config_1.ConfigHelper.clearToken(providerName);
            hasSignedOut = true;
        }
        if (hasSignedOut) {
            // When token state is cleared, we need to call reset
            vscode.commands.executeCommand(constants_1.SelfCommands.RESET_STORE, {
                newProvider: undefined
            });
        }
    }
    clearAll() {
        // This method clears local storage for slack/discord, but not vsls
        const enabledProviders = Array.from(this.chatProviders.keys());
        enabledProviders.forEach(provider => {
            this.store.clearProviderState(provider);
            const chatProvider = this.chatProviders.get(provider);
            if (!!chatProvider) {
                chatProvider.destroy();
                this.chatProviders.delete(provider);
            }
        });
        this.isTokenInitialized = false;
    }
    async clearOldWorkspace(provider) {
        // Clears users and channels so that we are loading them again
        await this.store.updateUsers(provider, {});
        await this.store.updateChannels(provider, []);
        await this.store.updateLastChannelId(provider, undefined);
    }
    async updateWebviewForProvider(provider, channelId, typingUserId) {
        const currentUser = this.store.getCurrentUser(provider);
        const channels = this.store.getChannels(provider);
        const channel = channels.find(channel => channel.id === channelId);
        if (!!currentUser && !!channel) {
            await this.store.updateLastChannelId(provider, channelId);
            const users = this.store.getUsers(provider);
            const allMessages = this.getMessages(provider);
            const messages = allMessages[channel.id] || {};
            let typingUser;
            if (typingUserId) {
                typingUser = users[typingUserId];
            }
            this.viewsManager.updateWebview(currentUser, provider, users, channel, messages, typingUser);
        }
    }
    updateStatusItemsForProvider(provider) {
        const cp = this.chatProviders.get(provider);
        if (!!cp) {
            const teams = cp.getTeams();
            teams.forEach(team => {
                this.viewsManager.updateStatusItem(provider, team);
            });
        }
    }
    updateTreeViewsForProvider(provider) {
        this.viewsManager.updateTreeViews(provider);
    }
    updateAllUI() {
        const providers = Array.from(this.chatProviders.keys());
        providers.forEach(provider => {
            const lastChannelId = this.store.getLastChannelId(provider);
            if (!!lastChannelId) {
                this.updateWebviewForProvider(provider, lastChannelId);
            }
            this.updateStatusItemsForProvider(provider);
            this.updateTreeViewsForProvider(provider);
        });
    }
    dispose() {
        this.viewsManager.dispose();
    }
    getChannelLabels(provider) {
        // Return channel labels from all providers if input provider is undefined
        let channelLabels = [];
        for (let entry of Array.from(this.chatProviders.entries())) {
            const cp = entry[1];
            const providerName = entry[0];
            if (!provider || provider === providerName) {
                channelLabels = [...channelLabels, ...cp.getChannelLabels()];
            }
        }
        return channelLabels;
    }
    getUserForId(provider, userId) {
        const cachedUser = this.store.getUser(provider, userId);
        return cachedUser;
    }
    getIMChannel(provider, user) {
        // DM channels look like `name`
        const channels = this.store.getChannels(provider);
        const { name } = user;
        return channels.find(channel => channel.name === name);
    }
    async createIMChannel(providerName, user) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? await cp.createIMChannel(user) : undefined;
    }
    getUserPresence(provider, userId) {
        const cp = this.chatProviders.get(provider);
        return !!cp ? cp.getUserPresence(userId) : undefined;
    }
    async loadChannelHistory(providerName, channelId) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.loadChannelHistory(channelId) : undefined;
    }
    async updateReadMarker(providerName) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.updateReadMarker() : undefined;
    }
    addReaction(providerName, channelId, msgTimestamp, userId, reactionName) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.addReaction(channelId, msgTimestamp, userId, reactionName) : undefined;
    }
    removeReaction(providerName, channelId, msgTimestamp, userId, reactionName) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.removeReaction(channelId, msgTimestamp, userId, reactionName) : undefined;
    }
    async fetchThreadReplies(providerName, parentTimestamp) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.fetchThreadReplies(parentTimestamp) : undefined;
    }
    updateMessageReply(providerName, parentTimestamp, channelId, reply) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.updateMessageReply(parentTimestamp, channelId, reply) : undefined;
    }
    updateMessages(providerName, channelId, messages) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.updateMessages(channelId, messages) : undefined;
    }
    clearMessages(providerName, channelId) {
        const cp = this.chatProviders.get(providerName);
        return !!cp ? cp.clearMessages(channelId) : undefined;
    }
    updateChannelMarked(provider, channelId, readTimestamp, unreadCount) {
        const cp = this.chatProviders.get(provider);
        return !!cp ? cp.updateChannelMarked(channelId, readTimestamp, unreadCount) : undefined;
    }
}
exports.default = Manager;
//# sourceMappingURL=index.js.map