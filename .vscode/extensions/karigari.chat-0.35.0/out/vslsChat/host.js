"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const base_1 = require("./base");
const strings_1 = require("../strings");
class VslsHostService extends base_1.VslsBaseService {
    constructor(api, sharedService, currentUser, serviceName) {
        super(currentUser);
        this.api = api;
        this.sharedService = sharedService;
        this.currentUser = currentUser;
        this.serviceName = serviceName;
        this.messages = {};
        this.cachedPeers = [];
        sharedService.onDidChangeIsServiceAvailable((available) => {
            // Service availability changed
            // TODO
        });
        sharedService.onRequest(utils_1.REQUEST_NAME.message, payload => {
            if (!!payload) {
                const message = payload[0];
                const { userId, text } = message;
                return this.broadcastMessage(userId, text);
            }
        });
        sharedService.onRequest(utils_1.REQUEST_NAME.typing, payload => {
            if (!!payload) {
                const message = payload[0];
                const { userId } = message;
                return this.sendTyping(userId);
            }
        });
        sharedService.onRequest(utils_1.REQUEST_NAME.fetchUsers, () => {
            return this.fetchUsers();
        });
        sharedService.onRequest(utils_1.REQUEST_NAME.fetchUserInfo, payload => {
            if (!!payload) {
                const userId = payload[0];
                return this.fetchUserInfo(userId);
            }
        });
        sharedService.onRequest(utils_1.REQUEST_NAME.fetchMessages, () => {
            return this.fetchMessagesHistory();
        });
        sharedService.onRequest(utils_1.REQUEST_NAME.registerGuest, payload => {
            if (!!payload) {
                const { peer } = payload[0];
                return this.updateCachedPeers([peer], []);
            }
        });
    }
    async dispose() {
        await this.api.unshareService(this.serviceName);
    }
    isConnected() {
        return !!this.sharedService ? this.sharedService.isServiceAvailable : false;
    }
    sendStartedMessage() {
        return this.broadcastMessage(this.currentUser.id, strings_1.LIVE_SHARE_INFO_MESSAGES.started);
    }
    sendEndedMessage() {
        return this.broadcastMessage(this.currentUser.id, strings_1.LIVE_SHARE_INFO_MESSAGES.ended);
    }
    async sendJoinedMessages(peers) {
        (await utils_1.usersFromPeers(peers, this.api)).forEach(user => {
            this.broadcastMessage(user.id, strings_1.LIVE_SHARE_INFO_MESSAGES.joined);
        });
    }
    async sendLeavingMessages(peers) {
        (await utils_1.usersFromPeers(peers, this.api)).forEach(user => {
            this.broadcastMessage(user.id, strings_1.LIVE_SHARE_INFO_MESSAGES.left);
        });
    }
    async fetchUsers() {
        const users = {};
        users[this.currentUser.id] = this.currentUser;
        const peersAsUsers = await utils_1.usersFromPeers(this.api.peers, this.api);
        peersAsUsers.forEach(user => {
            users[user.id] = user;
        });
        return users;
    }
    async fetchUserInfo(userId) {
        // userId could be current user or one of the peers
        let userFound;
        if (this.currentUser.id === userId) {
            return this.currentUser;
        }
        const users = await utils_1.usersFromPeers(this.api.peers, this.api);
        userFound = users.find(user => user.id === userId);
        if (userFound) {
            return userFound;
        }
        // Finally, let's check cached peers
        // In some cases, vsls seems to be returning stale data, and
        // so we cache whatever we know locally.
        const cachedUsers = await utils_1.usersFromPeers(this.cachedPeers, this.api);
        userFound = cachedUsers.find(user => user.id === userId);
        if (userFound) {
            return userFound;
        }
    }
    fetchMessagesHistory() {
        const result = {};
        Object.keys(this.messages).forEach(key => {
            result[key] = utils_1.toBaseMessage(this.messages[key]);
        });
        return Promise.resolve(result);
    }
    broadcastMessage(userId, text) {
        const timestamp = (+new Date() / 1000.0).toString();
        const message = {
            userId,
            text,
            timestamp
        };
        this.sharedService.notify(utils_1.NOTIFICATION_NAME.message, message);
        this.updateMessages(message);
        this.messages[timestamp] = message;
    }
    sendMessage(text, userId, channelId) {
        this.broadcastMessage(userId, text);
        return Promise.resolve();
    }
    sendTyping(userId) {
        this.sharedService.notify(utils_1.NOTIFICATION_NAME.typing, { userId });
        this.showTyping(userId);
    }
    updateCachedPeers(addedPeers, removedPeers) {
        const updated = [...this.cachedPeers, ...addedPeers, ...removedPeers];
        const uniquePeers = updated.filter((peer, index, self) => index === self.findIndex(t => t.peerNumber === peer.peerNumber));
        this.cachedPeers = uniquePeers;
    }
}
exports.VslsHostService = VslsHostService;
//# sourceMappingURL=host.js.map