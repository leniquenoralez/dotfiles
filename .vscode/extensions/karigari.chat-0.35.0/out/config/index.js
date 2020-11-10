"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const https = require("https");
const HttpsProxyAgent = require("https-proxy-agent");
const constants_1 = require("../constants");
const keychain_1 = require("./keychain");
const TOKEN_CONFIG_KEY = "slack.legacyToken";
const TELEMETRY_CONFIG_ROOT = "telemetry";
const TELEMETRY_CONFIG_KEY = "enableTelemetry";
const CREDENTIAL_SERVICE_NAME = "vscode-chat";
const VSLS_CHAT_TOKEN = "vsls-placeholder-token";
const getAccountName = (provider, teamId) => {
    return !!teamId ? `${provider} (${teamId})` : provider;
};
class ConfigHelper {
    static getRootConfig() {
        return vscode.workspace.getConfiguration(constants_1.CONFIG_ROOT);
    }
    static updateRootConfig(section, value) {
        // Convert Thenable to Promise to be able to use Promise.all
        const rootConfig = this.getRootConfig();
        return new Promise((resolve, reject) => {
            rootConfig.update(section, value, vscode.ConfigurationTarget.Global).then(result => {
                return resolve(result);
            }, error => {
                return reject(error);
            });
        });
    }
    static async getToken(service, teamId) {
        if (service === "vslsSpaces") {
            return VSLS_CHAT_TOKEN;
        }
        const accountName = getAccountName(service, teamId);
        const keychainToken = await keychain_1.KeychainHelper.get(CREDENTIAL_SERVICE_NAME, accountName);
        return keychainToken;
    }
    static clearTokenFromSettings() {
        this.updateRootConfig(TOKEN_CONFIG_KEY, undefined);
    }
    static async setToken(token, providerName, teamId) {
        // TODO: it is possible that the keychain will fail
        // See https://github.com/Microsoft/vscode-pull-request-github/commit/306dc5d27460599f3402f4b9e01d97bf638c639f
        const accountName = getAccountName(providerName, teamId);
        await keychain_1.KeychainHelper.set(CREDENTIAL_SERVICE_NAME, accountName, token);
        // When token is set, we need to call reset
        vscode.commands.executeCommand(constants_1.SelfCommands.SETUP_NEW_PROVIDER, {
            newInitialState: { provider: providerName, teamId }
        });
    }
    static async clearToken(provider, teamId) {
        await keychain_1.KeychainHelper.clear(CREDENTIAL_SERVICE_NAME, getAccountName(provider, teamId));
    }
    static getProxyUrl() {
        // Stored under CONFIG_ROOT.proxyUrl
        const { proxyUrl } = this.getRootConfig();
        return proxyUrl;
    }
    static getTlsRejectUnauthorized() {
        const { rejectTlsUnauthorized } = this.getRootConfig();
        return rejectTlsUnauthorized;
    }
    static getAutoLaunchLiveShareChat() {
        const { autoLaunchLiveShareChat } = this.getRootConfig();
        return autoLaunchLiveShareChat;
    }
    static hasTelemetry() {
        const config = vscode.workspace.getConfiguration(TELEMETRY_CONFIG_ROOT);
        return !!config.get(TELEMETRY_CONFIG_KEY);
    }
    static hasTravisProvider() {
        // Stored under CONFIG_ROOT.providers, which is string[]
        const { providers } = this.getRootConfig();
        return providers && providers.indexOf("travis") >= 0;
    }
    static getCustomAgent() {
        const proxyUrl = this.getProxyUrl();
        if (!!proxyUrl) {
            return new HttpsProxyAgent(proxyUrl);
        }
        const rejectUnauthorized = this.getTlsRejectUnauthorized();
        if (!rejectUnauthorized) {
            return new https.Agent({
                rejectUnauthorized: false
            });
        }
    }
}
exports.ConfigHelper = ConfigHelper;
//# sourceMappingURL=index.js.map