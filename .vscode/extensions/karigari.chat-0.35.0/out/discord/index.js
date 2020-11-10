"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Discord = require("discord.js");
const rp = require("request-promise-native");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const logger_1 = require("../logger");
const HISTORY_LIMIT = 50;
const MEMBER_LIMIT = 500;
const getPresence = (presence) => {
    const { status } = presence;
    switch (status) {
        case "online":
            return "available" /* available */;
        case "dnd":
            return "doNotDisturb" /* doNotDisturb */;
        case "idle":
            return "idle" /* idle */;
        case "offline":
            return "offline" /* offline */;
    }
};
const getMessageContent = (raw) => {
    const { embeds } = raw;
    if (!!embeds && embeds.length > 0) {
        const firstEmbed = embeds[0];
        return {
            author: ``,
            pretext: ``,
            title: firstEmbed.title,
            titleLink: firstEmbed.url,
            text: firstEmbed.description,
            footer: ``
        };
    }
};
const getMessage = (raw) => {
    const { author, createdTimestamp, content, reactions, editedTimestamp } = raw;
    const timestamp = (createdTimestamp / 1000).toString();
    let attachment = undefined;
    const attachments = raw.attachments.array();
    if (attachments.length > 0) {
        // This only shows the first attachment
        const selected = attachments[0];
        attachment = {
            name: selected.filename,
            permalink: selected.url
        };
    }
    return {
        timestamp,
        userId: author.id,
        text: content,
        isEdited: !!editedTimestamp,
        content: getMessageContent(raw),
        replies: {},
        attachment,
        reactions: reactions.map(rxn => ({
            name: rxn.emoji.name,
            count: rxn.count,
            userIds: rxn.users.map(user => user.id)
        }))
    };
};
const getUser = (raw) => {
    const { id: userId, username, avatar, presence } = raw;
    return {
        id: userId,
        name: username,
        fullName: username,
        imageUrl: getImageUrl(userId, avatar),
        smallImageUrl: getSmallImageUrl(userId, avatar),
        presence: getPresence(presence)
    };
};
const DEFAULT_AVATARS = [
    "https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png",
    "https://discordapp.com/assets/0e291f67c9274a1abdddeb3fd919cbaa.png",
    "https://discordapp.com/assets/6debd47ed13483642cf09e832ed0bc1b.png",
    "https://discordapp.com/assets/322c936a8c8be1b803cd94861bdfa868.png",
    "https://discordapp.com/assets/1cbd08c76f8af6dddce02c5138971129.png"
];
const getAvatarUrl = (userId, avatar, size) => {
    if (!avatar) {
        return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    }
    else {
        // size can be any power of two between 16 and 2048
        return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=${size}`;
    }
};
const getImageUrl = (userId, avatar) => getAvatarUrl(userId, avatar, 128);
const getSmallImageUrl = (userId, avatar) => getAvatarUrl(userId, avatar, 32);
class DiscordChatProvider {
    constructor(token, manager) {
        this.token = token;
        this.manager = manager;
        this.mutedChannels = new Set([]);
        this.imChannels = [];
        this.client = new Discord.Client();
    }
    async validateToken() {
        const response = await rp({
            baseUrl: `https://discordapp.com/api/v6`,
            uri: `/users/@me`,
            json: true,
            headers: {
                Authorization: `${this.token}`
            }
        });
        const { id, username: name } = response;
        return {
            id,
            name,
            teams: [],
            currentTeamId: undefined,
            provider: "discord" /* discord */
        };
    }
    connect() {
        return new Promise(resolve => {
            this.client.on("ready", () => {
                const { id, username: name } = this.client.user;
                const teams = this.client.guilds.array().map(guild => ({
                    id: guild.id,
                    name: guild.name
                }));
                const currentUser = {
                    id,
                    name,
                    teams,
                    currentTeamId: undefined,
                    provider: "discord" /* discord */
                };
                resolve(currentUser);
            });
            if (process.env.IS_DEBUG === "true") {
                // Debug logs for local testing
                this.client.on("debug", info => console.log("Discord client log:", info));
            }
            this.client.on("presenceUpdate", (_, newMember) => {
                const { id: userId, presence } = newMember;
                vscode.commands.executeCommand(constants_1.SelfCommands.UPDATE_PRESENCE_STATUSES, {
                    userId,
                    presence: getPresence(presence),
                    provider: "discord"
                });
            });
            this.client.on("message", msg => {
                this.handleIncomingMessage(msg);
                this.handleIncomingLinks(msg);
            });
            this.client.on("messageUpdate", (_, msg) => {
                this.handleIncomingMessage(msg);
            });
            this.client.on("error", error => {
                logger_1.default.log(`[ERROR] Discord: ${error.message}`);
            });
            this.client.login(this.token);
        });
    }
    handleIncomingMessage(msg) {
        // If message has guild, we check for current guild
        // Else, message is from a DM or group DM
        const currentGuild = this.getCurrentGuild();
        const { guild } = msg;
        if (!currentGuild) {
            return;
        }
        if (!guild || guild.id === currentGuild.id) {
            let newMessages = {};
            const channelId = msg.channel.id;
            const parsed = getMessage(msg);
            const { timestamp } = parsed;
            newMessages[timestamp] = parsed;
            vscode.commands.executeCommand(constants_1.SelfCommands.UPDATE_MESSAGES, {
                channelId,
                messages: newMessages,
                provider: "discord"
            });
        }
    }
    handleIncomingLinks(msg) {
        // For vsls invitations
        const currentGuild = this.getCurrentGuild();
        const { guild } = msg;
        if (!currentGuild) {
            return;
        }
        if (!guild || guild.id === currentGuild.id) {
            const parsed = getMessage(msg);
            let uri;
            try {
                const { text } = parsed;
                if (text.startsWith("http")) {
                    uri = vscode.Uri.parse(parsed.text);
                    vscode.commands.executeCommand(constants_1.SelfCommands.HANDLE_INCOMING_LINKS, {
                        provider: "discord",
                        senderId: parsed.userId,
                        uri
                    });
                }
            }
            catch (e) { }
        }
    }
    isConnected() {
        return !!this.client && !!this.client.readyTimestamp;
    }
    getUserPreferences() {
        const mutedChannels = Array.from(this.mutedChannels);
        return Promise.resolve({ mutedChannels });
    }
    getCurrentGuild() {
        const currentUserInfo = this.manager.store.getCurrentUser("discord");
        if (!!currentUserInfo) {
            const { currentTeamId } = currentUserInfo;
            return this.client.guilds.find(guild => guild.id === currentTeamId);
        }
    }
    async fetchUsers() {
        const guild = this.getCurrentGuild();
        const readyTimestamp = (this.client.readyTimestamp / 1000.0).toString();
        let users = {};
        // We first build users from IM channels, and then from the guild members
        this.imChannels = this.client.channels
            .filter(channel => channel.type === "dm")
            .map(channel => {
            const dmChannel = channel;
            const { id, recipient } = dmChannel;
            const user = getUser(recipient);
            users[user.id] = user;
            return {
                id,
                name: recipient.username,
                type: "im" /* im */,
                readTimestamp: readyTimestamp,
                unreadCount: 0
            };
        });
        if (!!guild) {
            // Getting guild members requires knowing the guild
            const response = await guild.fetchMembers("", MEMBER_LIMIT);
            response.members.forEach(member => {
                const { user: discordUser, roles } = member;
                const hoistedRole = roles.find(role => role.hoist);
                let roleName = undefined;
                if (!!hoistedRole) {
                    roleName = utils_1.toTitleCase(hoistedRole.name);
                }
                const user = getUser(discordUser);
                users[user.id] = Object.assign({}, user, { roleName });
            });
        }
        return users;
    }
    async fetchUserInfo(userId) {
        const discordUser = await this.client.fetchUser(userId);
        return getUser(discordUser);
    }
    fetchChannels(users) {
        // This fetches channels of the current guild, and (group) DMs.
        // For unreads, we are not retrieving historical unreads, not clear if API supports that.
        const readyTimestamp = (this.client.readyTimestamp / 1000.0).toString();
        const guild = this.getCurrentGuild();
        let categories = {};
        if (!!guild) {
            guild.channels
                .filter(channel => channel.type === "category")
                .forEach(channel => {
                const { id: channelId, name, muted } = channel;
                categories[channelId] = name;
                if (muted) {
                    this.mutedChannels.add(channelId);
                }
            });
            const currentUserInfo = this.manager.store.getCurrentUser("discord");
            const guildChannels = guild.channels
                .filter(channel => channel.type !== "category")
                .filter(channel => {
                if (!!currentUserInfo) {
                    const userId = currentUserInfo.id;
                    const permissions = channel.permissionsFor(userId);
                    const permissionFlag = Discord.Permissions.FLAGS.VIEW_CHANNEL;
                    if (!!permissions && permissionFlag) {
                        return permissions.has(permissionFlag);
                    }
                }
                return false;
            })
                .map(channel => {
                const { name, id, parentID } = channel;
                return {
                    id,
                    name,
                    categoryName: categories[parentID],
                    type: "channel" /* channel */,
                    readTimestamp: readyTimestamp,
                    unreadCount: 0
                };
            });
            const groupChannels = this.client.channels
                .filter(channel => channel.type === "group")
                .map(channel => {
                const groupChannel = channel;
                const { id, recipients } = groupChannel;
                return {
                    id,
                    name: recipients.map(recipient => recipient.username).join(", "),
                    type: "group" /* group */,
                    readTimestamp: readyTimestamp,
                    unreadCount: 0
                };
            });
            return Promise.resolve([
                ...guildChannels,
                ...this.imChannels,
                ...groupChannels
            ]);
        }
        return Promise.resolve([]);
    }
    async loadChannelHistory(channelId) {
        const channel = this.client.channels.find(channel => channel.id === channelId);
        // channel.fetchMessages will break for voice channels
        const messages = await channel.fetchMessages({
            limit: HISTORY_LIMIT
        });
        let result = {};
        messages.forEach(message => {
            const parsed = getMessage(message);
            const { timestamp } = parsed;
            result[timestamp] = parsed;
        });
        return result;
    }
    sendMessage(text, currentUserId, channelId) {
        const channel = this.client.channels.find(channel => channel.id === channelId);
        return channel.send(text);
    }
    fetchChannelInfo(channel) {
        return Promise.resolve(channel);
    }
    subscribePresence(users) { }
    sendThreadReply() {
        return Promise.resolve();
    }
    async updateSelfPresence(presence) {
        let status;
        switch (presence) {
            case "available" /* available */:
                status = "online";
                break;
            case "doNotDisturb" /* doNotDisturb */:
                status = "dnd";
                break;
            case "idle" /* idle */:
                status = "idle";
                break;
            case "invisible" /* invisible */:
                status = "invisible";
                break;
            default:
                throw new Error("status not supported by discord");
        }
        const response = await this.client.user.setPresence({ status });
        // response.presence.status is always `invisible`
        // Hence we return the original presence input as success
        return presence;
    }
    destroy() {
        if (!!this.client) {
            return this.client.destroy();
        }
        return Promise.resolve();
    }
    async markChannel(channel, ts) {
        // Discord does not have a concept of timestamp, it will acknowledge everything
        // return Promise.resolve(channel);
        const { id: channelId } = channel;
        const discordChannel = this.client.channels.find(channel => channel.id === channelId);
        await discordChannel.acknowledge();
        return Object.assign({}, channel, { readTimestamp: ts });
    }
    fetchThreadReplies(channelId, ts) {
        // Never called. Discord has no threads.
        return Promise.resolve();
    }
    createIMChannel(user) {
        // This is required to share vsls links with users that
        // do not have corresponding DM channels
        return Promise.resolve(undefined);
    }
    async sendTyping(currentUserId, channelId) { }
}
exports.DiscordChatProvider = DiscordChatProvider;
//# sourceMappingURL=index.js.map