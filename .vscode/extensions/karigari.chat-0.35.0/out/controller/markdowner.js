"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EmojiConvertor = require("emoji-js");
exports.parseUsernames = (uiMessage) => {
    // Find and replace names like <@UBCQ8LF28>
    // TODO: fix this for channel names, which show up as <#C8A187ZRQ|general>
    const { messages, users } = uiMessage;
    let newMessages = {};
    Object.keys(messages).map(ts => {
        const message = messages[ts];
        let { text } = message;
        const matched = text.match(/<@([A-Z0-9]+)>/);
        if (matched && matched.length > 0) {
            const userId = matched[1];
            if (userId in users) {
                const { name } = users[userId];
                text = text.replace(matched[0], `@${name}`);
            }
        }
        newMessages[ts] = Object.assign({}, message, { text });
    });
    return Object.assign({}, uiMessage, { messages: newMessages });
};
exports.emojify = (messages) => {
    // Even though we are using markdown-it-slack, it does not support
    // emoji skin tones. If that changes, we can remove this method.
    const emoji = new EmojiConvertor();
    emoji.allow_native = true;
    // We have added node_modules/emoji-datasource to vscodeignore since we use
    // allow_native. If this changes, we might have to use emoji sheets (through CDN?)
    emoji.replace_mode = "unified";
    let emojifiedMessages = {};
    Object.keys(messages).forEach(key => {
        const message = messages[key];
        const { text, reactions } = message;
        emojifiedMessages[key] = Object.assign({}, message, { reactions: reactions
                ? reactions.map(reaction => (Object.assign({}, reaction, { name: emoji.replace_colons(reaction.name) })))
                : [], text: emoji.replace_colons(text ? text : "") });
    });
    return emojifiedMessages;
};
const parseSimpleLinks = (messages) => {
    let parsed = {};
    Object.keys(messages).forEach(key => {
        const { content, text } = messages[key];
        let newContent = undefined;
        const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=;\^]*)/;
        const re = new RegExp(`${URL_REGEX.source}`, "g");
        if (!!content) {
            newContent = Object.assign({}, content, { text: content.text
                    ? content.text.replace(re, function (a, b, c, d, e) {
                        return `[${a}](${a})`;
                    })
                    : "", footer: content.footer
                    ? content.footer.replace(re, function (a, b, c, d, e) {
                        return `[${a}](${a})`;
                    })
                    : "" });
        }
        parsed[key] = Object.assign({}, messages[key], { text: text
                ? text.replace(re, function (a, b, c, d, e) {
                    return `[${a}](${a})`;
                })
                : "", content: newContent });
    });
    return parsed;
};
exports.parseSlackLinks = (messages) => {
    // Looks for <url|title> pattern, and replaces them with normal markdown
    // The |pattern can be optional
    let parsed = {};
    Object.keys(messages).forEach(key => {
        const { content, text } = messages[key];
        let newContent = undefined;
        const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=;\^]*)/;
        const SLACK_MODIFIER = /(|.[^><]+)/;
        const re = new RegExp(`<(${URL_REGEX.source})(${SLACK_MODIFIER.source})>`, "g");
        if (!!content) {
            newContent = Object.assign({}, content, { text: content.text
                    ? content.text.replace(re, function (a, b, c, d, e) {
                        return e ? `[${e.substr(1)}](${b})` : `[${b}](${b})`;
                    })
                    : "", footer: content.footer
                    ? content.footer.replace(re, function (a, b, c, d, e) {
                        return e ? `[${e.substr(1)}](${b})` : `[${b}](${b})`;
                    })
                    : "" });
        }
        parsed[key] = Object.assign({}, messages[key], { text: text
                ? text.replace(re, function (a, b, c, d, e) {
                    return e ? `[${e.substr(1)}](${b})` : `[${b}](${b})`;
                })
                : "", content: newContent });
    });
    return parsed;
};
const transformChain = (uiMessage) => {
    const { messages } = exports.parseUsernames(uiMessage);
    const linkParser = uiMessage.provider === "vslsSpaces" ? parseSimpleLinks : exports.parseSlackLinks;
    return Object.assign({}, uiMessage, { messages: linkParser(exports.emojify(messages)) });
};
exports.default = transformChain;
//# sourceMappingURL=markdowner.js.map