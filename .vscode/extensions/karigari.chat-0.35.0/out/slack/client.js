"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@slack/client");
const config_1 = require("../config");
const logger_1 = require("../logger");
const CHANNEL_HISTORY_LIMIT = 50;
const USER_LIST_LIMIT = 1000;
// User-defined type guard
// https://github.com/Microsoft/TypeScript/issues/20707#issuecomment-351874491
function notUndefined(x) {
    return x !== undefined;
}
const getFile = (rawFile) => {
    return { name: rawFile.name, permalink: rawFile.permalink };
};
const getContent = (attachment) => {
    return {
        author: attachment.author_name,
        authorIcon: attachment.author_icon,
        pretext: attachment.pretext,
        title: attachment.title,
        titleLink: attachment.title_link,
        text: attachment.text,
        footer: attachment.footer,
        borderColor: attachment.color
    };
};
const getReaction = (reaction) => ({
    name: `:${reaction.name}:`,
    count: reaction.count,
    userIds: reaction.users
});
const getUser = (member) => {
    const { id, profile, real_name, name, deleted } = member;
    const { display_name, image_72, image_24 } = profile;
    return {
        id,
        // Conditional required for bots like @paperbot
        name: display_name ? display_name : name,
        email: profile.email,
        fullName: real_name,
        internalName: name,
        imageUrl: image_72,
        smallImageUrl: image_24,
        presence: "unknown" /* unknown */,
        isDeleted: deleted
    };
};
exports.getMessage = (raw) => {
    const { files, ts, user, text, edited, bot_id } = raw;
    const { attachments, reactions, replies } = raw;
    let parsed = {};
    parsed[ts] = {
        userId: user ? user : bot_id,
        timestamp: ts,
        isEdited: !!edited,
        text: text,
        attachment: files ? getFile(files[0]) : undefined,
        reactions: reactions
            ? reactions.map((reaction) => getReaction(reaction))
            : [],
        content: attachments ? getContent(attachments[0]) : undefined,
        replies: replies
            ? replies.map((reply) => ({
                userId: reply.user,
                timestamp: reply.ts
            }))
            : []
    };
    return parsed;
};
class SlackAPIClient {
    constructor(token) {
        this.token = token;
        this.authTest = async () => {
            const response = await this.client.auth.test();
            const { ok } = response;
            if (ok) {
                const { team, user, user_id, team_id } = response;
                return {
                    id: user_id,
                    name: user,
                    teams: [{ id: team_id, name: team }],
                    currentTeamId: team_id,
                    provider: "slack" /* slack */
                };
            }
        };
        this.getConversationHistory = async (channel) => {
            const response = await this.client.apiCall("conversations.history", {
                channel,
                limit: CHANNEL_HISTORY_LIMIT
            });
            const { messages, ok } = response;
            let result = {};
            if (ok) {
                messages.forEach((rawMessage) => {
                    result = Object.assign({}, result, exports.getMessage(rawMessage));
                });
            }
            return result;
        };
        this.getChannelInfo = async (originalChannel) => {
            const { id, type } = originalChannel;
            let response;
            let channel;
            try {
                switch (type) {
                    case "group":
                        response = await this.client.groups.info({ channel: id });
                        channel = response.group;
                        break;
                    case "channel":
                        response = await this.client.channels.info({ channel: id });
                        channel = response.channel;
                        break;
                    case "im":
                        response = await this.client.conversations.info({
                            channel: id
                        });
                        channel = response.channel;
                        break;
                }
                const { unread_count_display, last_read } = channel;
                return Object.assign({}, originalChannel, { unreadCount: unread_count_display, readTimestamp: last_read });
            }
            catch (error) {
                // TODO: this is failing for private groups -> need to investigate why
                console.log("Error fetching channel:", originalChannel.name);
            }
        };
        this.sendMessage = (channelId, text, threadTs) => {
            return this.client.chat.postMessage({
                channel: channelId,
                text,
                thread_ts: threadTs,
                as_user: true
            });
        };
        this.markChannel = async (channel, ts) => {
            const { id, type } = channel;
            let response;
            switch (type) {
                case "channel" /* channel */:
                    response = await this.client.channels.mark({ channel: id, ts });
                    break;
                case "group" /* group */:
                    response = await this.client.groups.mark({ channel: id, ts });
                    break;
                case "im" /* im */:
                    response = await this.client.im.mark({ channel: id, ts });
                    break;
            }
            const { ok } = response;
            if (ok) {
                return Object.assign({}, channel, { readTimestamp: ts, unreadCount: 0 });
            }
        };
        this.openIMChannel = async (user) => {
            const { id, name } = user;
            let response = await this.client.im.open({
                user: id,
                return_im: true
            });
            const { ok, channel } = response;
            if (ok) {
                return {
                    id: channel.id,
                    name: `@${name}`,
                    type: "im" /* im */,
                    unreadCount: 0,
                    readTimestamp: undefined
                };
            }
        };
        this.getUserPrefs = async () => {
            // Undocumented API: https://github.com/ErikKalkoken/slackApiDoc/blob/master/users.prefs.get.md
            let response = await this.client.apiCall("users.prefs.get");
            const { ok, prefs } = response;
            if (ok) {
                const { muted_channels } = prefs;
                return {
                    mutedChannels: muted_channels.split(",")
                };
            }
        };
        this.getReplies = async (channelId, messageTimestamp) => {
            // https://api.slack.com/methods/conversations.replies
            let response = await this.client.conversations.replies({
                channel: channelId,
                ts: messageTimestamp
            });
            // Does not handle has_more in the response yet, could break
            // for large threads
            const { ok, messages } = response;
            if (ok) {
                const parent = messages.find((msg) => msg.thread_ts === msg.ts);
                const replies = messages.filter((msg) => msg.thread_ts !== msg.ts);
                const parentMessage = exports.getMessage(parent);
                return Object.assign({}, parentMessage[messageTimestamp], { replies: replies.map((reply) => ({
                        userId: reply.user,
                        timestamp: reply.ts,
                        text: reply.text,
                        attachment: !!reply.files ? getFile(reply.files[0]) : null
                    })) });
            }
        };
        this.setUserPresence = async (presence) => {
            const response = await this.client.users.setPresence({ presence });
            return response.ok;
        };
        this.setUserSnooze = async (durationInMinutes) => {
            const response = (await this.client.dnd.setSnooze({
                num_minutes: durationInMinutes
            }));
            return response.ok && response.snooze_enabled;
        };
        this.endUserSnooze = async () => {
            const response = await this.client.dnd.endSnooze();
            return response.ok;
        };
        this.endUserDnd = async () => {
            const response = await this.client.dnd.endDnd();
            return response.ok;
        };
        this.getDndTeamInfo = async () => {
            const response = await this.client.dnd.teamInfo();
            const users = response.users;
            let result = {};
            const userIds = Object.keys(users);
            userIds.forEach(userId => {
                const { dnd_enabled } = users[userId];
                if (!!dnd_enabled) {
                    result[userId] = users[userId];
                }
            });
            return result;
        };
        let options = { retryConfig: { retries: 1 } };
        const customAgent = config_1.ConfigHelper.getCustomAgent();
        if (!!customAgent) {
            options.agent = customAgent;
        }
        this.client = new client_1.WebClient(token, options);
        this.client.on("rate_limited", retryAfter => {
            logger_1.default.log(`Slack client rate limited: paused for ${retryAfter} seconds`);
        });
    }
    async getUsers() {
        const response = await this.client.apiCall("users.list", {
            limit: USER_LIST_LIMIT
        });
        const { members, ok } = response;
        let users = {};
        if (ok) {
            members.forEach((member) => {
                const user = getUser(member);
                const { id } = user;
                users[id] = user;
            });
            return users;
        }
        return {};
    }
    async getBotInfo(botId) {
        const response = await this.client.bots.info({
            bot: botId
        });
        const { bot, ok } = response;
        if (ok) {
            const { id, name, icons } = bot;
            return {
                id,
                name,
                fullName: name,
                imageUrl: icons.image_72,
                smallImageUrl: icons.image_24,
                presence: "unknown" /* unknown */,
                isBot: true
            };
        }
    }
    async getUserInfo(userId) {
        const response = await this.client.users.info({ user: userId });
        const { ok, user } = response;
        if (ok) {
            return getUser(user);
        }
    }
    async getChannels(users) {
        const response = await this.client.conversations.list({
            exclude_archived: true,
            types: "public_channel, private_channel, mpim, im"
        });
        const { ok, channels } = response;
        const userValues = Object.keys(users).map(key => users[key]);
        if (ok) {
            return channels
                .map((channel) => {
                const { is_channel, is_mpim, is_im, is_group, is_member } = channel;
                if (is_channel && is_member) {
                    // Public channels
                    return {
                        id: channel.id,
                        name: channel.name,
                        type: "channel" /* channel */
                    };
                }
                if (is_group && !is_mpim) {
                    // Private channels
                    return {
                        id: channel.id,
                        name: channel.name,
                        type: "channel" /* channel */
                    };
                }
                if (is_group && is_mpim) {
                    // Groups (multi-party direct messages)
                    // Example name: mpdm-user.name--username2--user3-1
                    let { id, name } = channel;
                    const matched = name.match(/mpdm-([^-]+)((--[^-]+)*)-\d+/);
                    if (matched) {
                        const first = matched[1];
                        const rest = matched[2]
                            .split("--")
                            .filter((element) => !!element);
                        const members = [first, ...rest];
                        const memberUsers = members
                            .map(memberName => userValues.find(({ internalName }) => internalName === memberName))
                            .filter(notUndefined);
                        const isAnyUserDeleted = memberUsers.filter(({ isDeleted }) => isDeleted);
                        if (isAnyUserDeleted.length > 0) {
                            return null;
                        }
                        else {
                            name = memberUsers.map(({ name }) => name).join(", ");
                            return {
                                id: id,
                                name: name,
                                type: "group" /* group */
                            };
                        }
                    }
                }
                if (is_im) {
                    // Direct messages
                    const { id, user: userId } = channel;
                    if (userId in users) {
                        const user = users[userId];
                        if (!user.isDeleted) {
                            const name = user.name;
                            return {
                                id,
                                name,
                                type: "im" /* im */
                            };
                        }
                    }
                }
            })
                .filter(Boolean);
        }
        return [];
    }
}
exports.default = SlackAPIClient;
//# sourceMappingURL=client.js.map