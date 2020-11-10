"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver = require("semver");
const utils_1 = require("./utils");
// Large discord communities can have lots of users/channels
// More than the quota of context.globalState
const VALUE_LENGTH_LIMIT = 100;
const MESSAGE_HISTORY_LIMIT = 50;
const stateKeys = {
    EXTENSION_VERSION: "extensionVersion",
    INSTALLATION_ID: "installationId",
    LAST_CHANNEL_ID: "lastChannelId",
    CHANNELS: "channels",
    USER_INFO: "userInfo",
    USERS: "users",
    MESSAGE_HISTORY: "messagesHistory"
};
class Store {
    constructor(context) {
        this.context = context;
        this.getCurrentUser = (provider) => {
            return this.currentUserInfo[provider];
        };
        this.getCurrentUserForAll = () => {
            const providers = Object.keys(this.currentUserInfo);
            return providers.map(provider => this.currentUserInfo[provider]);
        };
        this.getUsers = (provider) => {
            return this.users[provider] || {};
        };
        this.getUser = (provider, userId) => {
            const providerUsers = this.users[provider] || {};
            return providerUsers[userId];
        };
        this.getChannels = (provider) => {
            return this.channels[provider] || [];
        };
        this.getLastChannelId = (provider) => {
            return this.lastChannelId[provider];
        };
        this.updateLastChannelId = (provider, channelId) => {
            const lastChannels = Object.assign({}, this.lastChannelId, { [provider]: channelId });
            this.lastChannelId = this.getObjectWithoutUndefined(lastChannels);
            return this.context.globalState.update(stateKeys.LAST_CHANNEL_ID, this.lastChannelId);
        };
        this.updateUsers = (provider, users) => {
            let newUsers = users;
            this.users = Object.assign({}, this.users, { [provider]: newUsers });
            const totalUserCount = Object.values(this.users)
                .map(usersObject => Object.keys(usersObject).length)
                .reduce((acc, curr) => acc + curr);
            const isUnderCacheSizeLimit = totalUserCount <= VALUE_LENGTH_LIMIT;
            if (isUnderCacheSizeLimit) {
                return this.context.globalState.update(stateKeys.USERS, this.users);
            }
            return Promise.resolve();
        };
        this.updateUser = (provider, userId, user) => {
            // NOTE: This does not store to the local storage
            const providerUsers = this.users[provider] || {};
            this.users = Object.assign({}, this.users, { [provider]: Object.assign({}, providerUsers, { [userId]: Object.assign({}, user) }) });
        };
        this.updateChannels = (provider, channels) => {
            this.channels = Object.assign({}, this.channels, { [provider]: channels });
            const totalChannelCount = Object.values(this.channels)
                .map(channels => channels.length)
                .reduce((acc, curr) => acc + curr);
            const isUnderCacheSizeLimit = totalChannelCount <= VALUE_LENGTH_LIMIT;
            if (isUnderCacheSizeLimit) {
                return this.context.globalState.update(stateKeys.CHANNELS, this.channels);
            }
            return Promise.resolve();
        };
        this.updateCurrentUser = (provider, userInfo) => {
            const cachedCurrentUser = this.currentUserInfo[provider];
            let newCurrentUser;
            if (!userInfo) {
                newCurrentUser = userInfo; // Resetting userInfo
            }
            else {
                // Copy cover the currentTeamId from existing state, if available
                let currentTeamId = !!cachedCurrentUser ? cachedCurrentUser.currentTeamId : undefined;
                if (!!userInfo.currentTeamId) {
                    currentTeamId = userInfo.currentTeamId;
                }
                newCurrentUser = Object.assign({}, userInfo, { currentTeamId });
                // If this is Slack, our local state might know of more workspaces
                if (provider === "slack" && !!cachedCurrentUser) {
                    let mergedTeams = {};
                    const { teams: newTeams } = userInfo;
                    const { teams: existingTeams } = cachedCurrentUser;
                    existingTeams.forEach(team => (mergedTeams[team.id] = team));
                    newTeams.forEach(team => (mergedTeams[team.id] = team));
                    const teams = Object.keys(mergedTeams).map(key => mergedTeams[key]);
                    newCurrentUser = Object.assign({}, newCurrentUser, { teams });
                }
            }
            const updatedCurrentUserInfo = Object.assign({}, this.currentUserInfo, { [provider]: !!newCurrentUser ? Object.assign({}, newCurrentUser) : undefined });
            this.currentUserInfo = this.getObjectWithoutUndefined(updatedCurrentUserInfo);
            return this.context.globalState.update(stateKeys.USER_INFO, this.currentUserInfo);
        };
        this.updateMessageHistory = (channelId, messages) => {
            const existingMessages = this.context.globalState.get(stateKeys.MESSAGE_HISTORY) || {};
            const timestamps = Object.keys(messages).map(t => +t);
            let filteredTimestamps = timestamps;
            if (timestamps.length > MESSAGE_HISTORY_LIMIT) {
                const sortedTimestamps = timestamps.sort((a, b) => (b - a));
                filteredTimestamps = sortedTimestamps.slice(0, MESSAGE_HISTORY_LIMIT);
            }
            let filteredMessages = {};
            filteredTimestamps.forEach(ts => {
                filteredMessages[`${ts}`] = messages[`${ts}`];
            });
            return this.context.globalState.update(stateKeys.MESSAGE_HISTORY, Object.assign({}, existingMessages, { [channelId]: filteredMessages }));
        };
        this.getMessageHistoryForChannel = (channelId) => {
            const allMessages = this.context.globalState.get(stateKeys.MESSAGE_HISTORY) || {};
            return allMessages[channelId] || {};
        };
        this.getObjectWithoutUndefined = (input) => {
            // Remove undefined values from the input object
            let withoutUndefined = {};
            Object.keys(input).forEach(key => {
                const value = input[key];
                if (!!value) {
                    withoutUndefined[key] = value;
                }
            });
            return withoutUndefined;
        };
        this.loadInitialState();
    }
    loadInitialState() {
        const { globalState } = this.context;
        this.installationId = globalState.get(stateKeys.INSTALLATION_ID);
        this.existingVersion = globalState.get(stateKeys.EXTENSION_VERSION);
        this.channels = globalState.get(stateKeys.CHANNELS) || {};
        this.currentUserInfo = globalState.get(stateKeys.USER_INFO) || {};
        this.users = globalState.get(stateKeys.USERS) || {};
        this.lastChannelId = globalState.get(stateKeys.LAST_CHANNEL_ID) || {};
    }
    async runStateMigrations() {
        const currentVersion = utils_1.getExtensionVersion();
        if (!!currentVersion && this.existingVersion !== currentVersion) {
            if (!!this.existingVersion) {
                if (semver.lt(this.existingVersion, "0.9.0")) {
                    await this.migrateFor09x();
                }
            }
            this.updateExtensionVersion(currentVersion);
            this.loadInitialState();
        }
    }
    async migrateFor09x() {
        // Run migrations for 0.9.x
        const { globalState } = this.context;
        const currentUser = globalState.get(stateKeys.USER_INFO);
        if (!!currentUser) {
            const { provider } = currentUser;
            if (!!provider) {
                const channels = globalState.get(stateKeys.CHANNELS);
                const users = globalState.get(stateKeys.USERS);
                const lastChannelId = globalState.get(stateKeys.LAST_CHANNEL_ID);
                await globalState.update(stateKeys.USER_INFO, {
                    [provider]: currentUser
                });
                await globalState.update(stateKeys.CHANNELS, {
                    [provider]: channels
                });
                await globalState.update(stateKeys.USERS, { [provider]: users });
                await globalState.update(stateKeys.LAST_CHANNEL_ID, {
                    [provider]: lastChannelId
                });
            }
        }
    }
    generateInstallationId() {
        const uuidStr = utils_1.uuidv4();
        const { globalState } = this.context;
        globalState.update(stateKeys.INSTALLATION_ID, uuidStr);
        this.installationId = uuidStr;
        return uuidStr;
    }
    updateExtensionVersion(version) {
        const { globalState } = this.context;
        return globalState.update(stateKeys.EXTENSION_VERSION, version);
    }
    async clearProviderState(provider) {
        this.currentUserInfo = this.getObjectWithoutUndefined(Object.assign({}, this.currentUserInfo, { [provider]: undefined }));
        this.users = this.getObjectWithoutUndefined(Object.assign({}, this.users, { [provider]: undefined }));
        this.channels = this.getObjectWithoutUndefined(Object.assign({}, this.channels, { [provider]: undefined }));
        this.lastChannelId = this.getObjectWithoutUndefined(Object.assign({}, this.lastChannelId, { [provider]: undefined }));
        await this.context.globalState.update(stateKeys.USER_INFO, this.currentUserInfo);
        await this.context.globalState.update(stateKeys.USERS, this.users);
        await this.context.globalState.update(stateKeys.CHANNELS, this.channels);
        return this.context.globalState.update(stateKeys.LAST_CHANNEL_ID, this.lastChannelId);
    }
}
exports.Store = Store;
//# sourceMappingURL=store.js.map