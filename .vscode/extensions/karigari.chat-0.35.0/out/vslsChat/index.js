"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vsls = require("vsls");
const utils_1 = require("./utils");
const vsls_contactprotocol_js_1 = require("vsls/vsls-contactprotocol.js");
const host_1 = require("./host");
const guest_1 = require("./guest");
const constants_1 = require("../constants");
const str = require("../strings");
const logger_1 = require("../logger");
class VslsChatProvider {
    constructor(store) {
        this.store = store;
        this.hasInitialized = false;
        this.imChannels = [];
        // We are passing the store in here to be able to store message history
    }
    async connect() {
        // This method sets up the chat provider to listen for changes in vsls session
        const liveshare = await vsls.getApi();
        if (!liveshare) {
            logger_1.default.log("vsls not found, required to initialize chat");
            return undefined;
        }
        if (this.hasInitialized) {
            // We have already initialized, and we don't want to
            // attach the event listeners again.
            // (This overrides the connect() logic inside ChatProviderManager)
            if (liveshare.session.user) {
                this.currentUser = this.liveShareUser(liveshare.session.user);
                return this.userToCurrentUser(this.currentUser);
            }
        }
        if (liveshare.session.user) {
            this.currentUser = this.liveShareUser(liveshare.session.user);
        }
        this.liveshare = liveshare;
        this.hasInitialized = true;
        this.liveshare.onDidChangePeers(({ added, removed }) => {
            if (!!this.hostService) {
                this.hostService.updateCachedPeers(added, removed);
                this.hostService.sendJoinedMessages(added);
                this.hostService.sendLeavingMessages(removed);
            }
        });
        this.liveshare.onDidChangeSession(async ({ session }) => {
            const { id: sessionId, role } = session;
            const isSessionActive = !!sessionId;
            if (!this.currentUser) {
                // Hmm, this should never happen, because LS session
                // can only be started if the user is available.
                return;
            }
            if (isSessionActive) {
                await this.initializeChatService(this.currentUser);
                if (!!this.hostService) {
                    this.hostService.sendStartedMessage();
                }
            }
            else {
                if (!!this.hostService) {
                    this.hostService.sendEndedMessage();
                }
                await this.clearSession();
            }
            vscode.commands.executeCommand(constants_1.SelfCommands.LIVE_SHARE_SESSION_CHANGED, {
                isSessionActive,
                currentUser: this.userToCurrentUser(this.currentUser)
            });
        });
        // Initialize our link to the LS presence provider to send/receive DMs
        this.liveshare.onPresenceProviderRegistered((e) => {
            if (utils_1.isLiveshareProvider(e.added)) {
                this.initializePresenceProvider(e.added);
            }
        });
        const registeredProviders = this.liveshare.presenceProviders;
        const provider = registeredProviders.find((p) => utils_1.isLiveshareProvider(p));
        if (provider) {
            this.initializePresenceProvider(provider);
        }
        return new Promise(resolve => {
            // @ts-ignore (session is a readonly property)
            this.liveshare.session = utils_1.onPropertyChanged(this.liveshare.session, "user", () => {
                if (this.liveshare && this.liveshare.session.user) {
                    this.currentUser = this.liveShareUser(this.liveshare.session.user);
                    resolve(this.userToCurrentUser(this.currentUser));
                }
            });
        });
    }
    async initializeChatService(currentUser) {
        // This assumes live share session is available
        const liveshare = await vsls.getApi();
        const { role, id: sessionId, peerNumber, user } = liveshare.session;
        if (!user || !sessionId) {
            return undefined;
        }
        const serviceName = utils_1.getVslsChatServiceName(sessionId);
        if (role === vsls.Role.Host) {
            const sharedService = await liveshare.shareService(serviceName);
            if (!sharedService) {
                throw new Error("Error sharing service for Live Share Chat.");
            }
            this.hostService = new host_1.VslsHostService(liveshare, sharedService, currentUser, serviceName);
        }
        else if (role === vsls.Role.Guest) {
            const serviceProxy = await liveshare.getSharedService(serviceName);
            if (!serviceProxy) {
                throw new Error("Error getting shared service for Live Share Chat.");
            }
            if (!serviceProxy.isServiceAvailable) {
                vscode.window.showWarningMessage(str.NO_LIVE_SHARE_CHAT_ON_HOST);
                return;
            }
            else {
                this.guestService = new guest_1.VslsGuestService(liveshare, serviceProxy, currentUser, (liveshare.session));
            }
        }
        return this.userToCurrentUser(currentUser);
    }
    isConnected() {
        if (!!this.hostService) {
            return this.hostService.isConnected();
        }
        else if (!!this.guestService) {
            return this.guestService.isConnected();
        }
        return false;
    }
    initializePresenceProvider(presenceProvider) {
        this.presenceProvider = presenceProvider.provider;
        this.presenceProvider.onNotified(async ({ type, body }) => {
            if (type === vsls_contactprotocol_js_1.Methods.NotifyMessageReceivedName) {
                const { type, fromContactId, body: msgBody } = body;
                if (type === "vsls_dm") {
                    const { id: senderId, email: senderEmail } = msgBody.user;
                    // Check if this is a known IM channel (since we are building them on-the-fly)
                    let foundChannel = this.imChannels.find(channel => channel.id === senderId);
                    if (!foundChannel) {
                        // This is an IM channel we haven't seen before --> we want to update it in the store
                        // so we can get notifications etc. wired up for it.
                        const { contacts } = await this.liveshare.getContacts([senderEmail]);
                        await this.createIMChannel(utils_1.userFromContact(contacts[senderEmail]));
                        this.store.updateChannels("vsls", await this.fetchChannels({}));
                    }
                    this.updateDirectMessageUI(msgBody, senderId);
                }
                if (type === "vsls_typing") {
                    vscode.commands.executeCommand(constants_1.SelfCommands.SHOW_TYPING, {
                        provider: "vsls",
                        typingUserId: fromContactId,
                        channelId: fromContactId
                    });
                }
            }
        });
    }
    updateDirectMessageUI(newMessageBody, channelId) {
        let newMessages = {};
        const { timestamp } = newMessageBody;
        newMessages[timestamp] = utils_1.toDirectMessage(newMessageBody);
        vscode.commands.executeCommand(constants_1.SelfCommands.UPDATE_MESSAGES, {
            channelId,
            messages: newMessages,
            provider: "vsls"
        });
    }
    async sendDirectMessage(targetContactId, type, body = {}) {
        const message = { type, body, targetContactId };
        if (this.presenceProvider) {
            await this.presenceProvider.requestAsync(vsls_contactprotocol_js_1.Methods.RequestSendMessageName, message);
            if (type === "vsls_dm") {
                // Once the message is sent, we want to also update the UI
                // But not for typing messages
                this.updateDirectMessageUI(body, targetContactId);
            }
        }
    }
    liveShareUser(userInfo) {
        return {
            id: userInfo.id,
            email: userInfo.emailAddress,
            name: userInfo.displayName,
            fullName: userInfo.displayName,
            presence: "unknown" /* unknown */,
            // TODO: Instead of using default avatar, we can use the
            // avatar stored in the LS contact model. Unfortunately, the avatar
            // is not available in the LS user model, so we would need to
            // convert the user into the contact.
            imageUrl: utils_1.defaultAvatar(userInfo.emailAddress),
            smallImageUrl: utils_1.defaultAvatar(userInfo.emailAddress)
        };
    }
    userToCurrentUser(user) {
        return {
            id: user.id,
            name: user.name,
            teams: [
                {
                    id: utils_1.VSLS_CHAT_CHANNEL.id,
                    name: utils_1.VSLS_CHAT_CHANNEL.name
                }
            ],
            currentTeamId: utils_1.VSLS_CHAT_CHANNEL.id,
            provider: "vsls" /* vsls */
        };
    }
    async clearSession() {
        if (!!this.hostService) {
            await this.hostService.dispose();
        }
        if (!!this.guestService) {
            await this.guestService.dispose();
        }
        this.hostService = undefined;
        this.guestService = undefined;
    }
    async fetchUsers() {
        let currentUser = {};
        let serviceUsers = {};
        if (this.currentUser) {
            currentUser[this.currentUser.id] = Object.assign({}, this.currentUser);
        }
        if (!!this.hostService) {
            serviceUsers = await this.hostService.fetchUsers();
        }
        else if (!!this.guestService) {
            serviceUsers = await this.guestService.fetchUsers();
        }
        return Promise.resolve(Object.assign({}, currentUser, serviceUsers));
    }
    async fetchUserInfo(userId) {
        if (!!this.hostService) {
            return this.hostService.fetchUserInfo(userId);
        }
        else if (!!this.guestService) {
            return this.guestService.fetchUserInfo(userId);
        }
    }
    sendMessage(text, currentUserId, channelId) {
        const isChannelMessage = channelId === utils_1.VSLS_CHAT_CHANNEL.id;
        if (!isChannelMessage) {
            // This is a direct message -> sent via presence provider
            // channelId is the user id on the LS contact model
            const body = {
                user: {
                    id: currentUserId,
                    email: this.currentUser ? this.currentUser.email : undefined
                },
                text,
                timestamp: (+new Date() / 1000.0).toString()
            };
            return this.sendDirectMessage(channelId, "vsls_dm", body);
        }
        else {
            // This is a channel message -> sent via host/guest services
            if (!!this.hostService) {
                return this.hostService.sendMessage(text, currentUserId, channelId);
            }
            else if (!!this.guestService) {
                return this.guestService.sendMessage(text, currentUserId, channelId);
            }
        }
        return Promise.resolve();
    }
    async sendTyping(currentUserId, channelId) {
        const isSessionChannel = channelId === utils_1.VSLS_CHAT_CHANNEL.id;
        if (isSessionChannel && this.currentUser) {
            if (this.hostService) {
                this.hostService.sendTyping(this.currentUser.id);
            }
            else if (this.guestService) {
                this.guestService.sendTyping(this.currentUser.id);
            }
        }
        else {
            // This is in a DM, will only go to one contact
            return this.sendDirectMessage(channelId, "vsls_typing");
        }
    }
    async loadChannelHistory(channelId) {
        const isSessionChannel = channelId === utils_1.VSLS_CHAT_CHANNEL.id;
        if (isSessionChannel) {
            if (!!this.hostService) {
                return this.hostService.fetchMessagesHistory();
            }
            else if (!!this.guestService) {
                return this.guestService.fetchMessagesHistory();
            }
        }
        else {
            return this.store.getMessageHistoryForChannel(channelId);
        }
        return Promise.resolve({});
    }
    async destroy() {
        if (!!this.hostService) {
            await this.hostService.dispose();
        }
    }
    getUserPreferences() {
        return Promise.resolve({});
    }
    async fetchChannels(users) {
        if (this.liveshare && this.liveshare.session.id) {
            const defaultChannel = {
                id: utils_1.VSLS_CHAT_CHANNEL.id,
                name: utils_1.VSLS_CHAT_CHANNEL.name,
                type: "channel" /* channel */,
                readTimestamp: (+new Date() / 1000.0).toString(),
                unreadCount: 0
            };
            return [defaultChannel, ...this.imChannels];
        }
        else {
            return [...this.imChannels];
        }
    }
    fetchChannelInfo(channel) {
        return Promise.resolve(Object.assign({}, channel));
    }
    subscribePresence(users) { }
    markChannel(channel, ts) {
        return Promise.resolve(Object.assign({}, channel, { readTimestamp: ts, unreadCount: 0 }));
    }
    async validateToken() {
        // This will never be called, since vsls does not have a token configuration step
        return undefined;
    }
    async fetchThreadReplies(channelId, ts) {
        return {
            timestamp: ts,
            userId: "",
            text: "",
            content: undefined,
            reactions: [],
            replies: {}
        };
    }
    sendThreadReply(text, currentUserId, channelId, parentTimestamp) {
        return Promise.resolve();
    }
    async createIMChannel(user) {
        // We are saving a slightly old readTimestamp, so that the unread
        // notification can be triggered correctly. As the IM channels can be created
        // at the same time as the message is received, we don't want to simply do a now()
        const oneMinuteAgo = +new Date() / 1000.0 - 60;
        const channel = {
            id: user.id,
            name: user.fullName,
            type: "im" /* im */,
            readTimestamp: oneMinuteAgo.toString(),
            unreadCount: 0,
            contactMetadata: {
                id: user.id,
                email: user.email // Ugh, email might be undefined
            }
        };
        // Save imChannels so fetchChannels can return them
        if (!this.imChannels.find(item => item.id === user.id)) {
            this.imChannels = [...this.imChannels, channel];
        }
        return channel;
    }
    updateSelfPresence() {
        // no-op
    }
}
exports.VslsChatProvider = VslsChatProvider;
//# sourceMappingURL=index.js.map