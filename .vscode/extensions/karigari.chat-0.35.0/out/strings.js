"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHANGE_CHANNEL_TITLE = "Select a channel";
exports.CHANGE_WORKSPACE_TITLE = "Select a workspace";
exports.CHANGE_PROVIDER_TITLE = "Select a provider";
exports.RELOAD_CHANNELS = "Reload Channels...";
exports.TOKEN_NOT_FOUND = "Setup Team Chat to work for your account.";
exports.SETUP_SLACK = "Set up Slack";
exports.SETUP_DISCORD = "Set up Discord";
exports.REPORT_ISSUE = "Report issue";
exports.RETRY = "Retry";
exports.KEYCHAIN_ERROR = "The Team Chat extension is unable to access the system keychain.";
exports.TOKEN_PLACEHOLDER = "Paste token here";
exports.AUTH_FAILED_MESSAGE = "Sign in failed. Help us get better by reporting an issue.";
exports.INVALID_TOKEN = (provider) => `The ${provider} token cannot be validated. Please enter a valid token.`;
exports.INVALID_COMMAND = (text) => `${text} is not a recognised command.`;
exports.UPLOADED_FILE = (link) => `uploaded a file: ${link}`;
exports.LIVE_REQUEST_MESSAGE = "wants to start a Live Share session";
exports.LIVE_SHARE_INVITE = (name) => `${name} has invited you to a Live Share collaboration session.`;
exports.LIVE_SHARE_CHAT_NO_SESSION = "Chat requires an active Live Share collaboration session.";
exports.LIVE_SHARE_INFO_MESSAGES = {
    started: "_has started the Live Share session_",
    ended: "_has ended the Live Share session_",
    joined: "_has joined the Live Share session_",
    left: "_has left the Live Share session_"
};
exports.LIVE_SHARE_CONFIRM_SIGN_OUT = (provider) => `To use chat over VS Live Share, you need to sign out of your ${provider} account.`;
exports.SIGN_OUT = "Sign out";
exports.SELECT_SELF_PRESENCE = "Select your presence status";
exports.SELECT_DND_DURATION = "Select snooze duration for Slack";
exports.UNABLE_TO_MATCH_CONTACT = "Could not start chat: unable to match this contact.";
exports.NO_LIVE_SHARE_CHAT_ON_HOST = "Live Share Chat is unavailable for this session, since the host does not have it.";
//# sourceMappingURL=strings.js.map