"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const str = require("../strings");
const keychain_1 = require("../utils/keychain");
const issues_1 = require("../issues");
const logger_1 = require("../logger");
const UNDEFINED_ERROR = "System keychain is undefined";
class KeychainHelper {
    // Adds retry to keychain operations if we are denied access
    static async handleException(error, retryCall) {
        logger_1.default.log(`Keychain access: ${error}`);
        const actionItems = [str.RETRY, str.REPORT_ISSUE];
        const action = await vscode.window.showInformationMessage(str.KEYCHAIN_ERROR, ...actionItems);
        switch (action) {
            case str.RETRY:
                return retryCall();
            case str.REPORT_ISSUE:
                const title = "Unable to access keychain";
                return issues_1.default.openNewIssue(title, `${error}`);
        }
    }
    static async get(service, account) {
        try {
            if (!keychain_1.keychain) {
                throw new Error(UNDEFINED_ERROR);
            }
            const password = await keychain_1.keychain.getPassword(service, account);
            return password;
        }
        catch (error) {
            // If user denies, we can catch the error
            // On Mac, this looks like `Error: User canceled the operation.`
            return this.handleException(error, () => this.get(service, account));
        }
    }
    static async set(service, account, password) {
        try {
            if (!keychain_1.keychain) {
                throw new Error(UNDEFINED_ERROR);
            }
            await keychain_1.keychain.setPassword(service, account, password);
        }
        catch (error) {
            return this.handleException(error, () => this.set(service, account, password));
        }
    }
    static async clear(service, account) {
        try {
            if (!keychain_1.keychain) {
                throw new Error(UNDEFINED_ERROR);
            }
            await keychain_1.keychain.deletePassword(service, account);
        }
        catch (error) {
            return this.handleException(error, () => this.clear(service, account));
        }
    }
}
exports.KeychainHelper = KeychainHelper;
//# sourceMappingURL=keychain.js.map