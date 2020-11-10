"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vsls = require("vsls");
const constants_1 = require("../constants");
const travis_1 = require("../bots/travis");
const config_1 = require("../config");
class VscodeCommandHandler {
    constructor() {
        this.execute = (command, ...rest) => {
            // Wraps the executeCommand thenable into a promise
            // https://github.com/Microsoft/vscode/issues/11693#issuecomment-247495996
            return new Promise((resolve, reject) => {
                vscode.commands.executeCommand(command, ...rest).then(result => {
                    return resolve(result);
                }, error => {
                    vscode.window.showErrorMessage(error.toString());
                    return reject(error);
                });
            });
        };
        this.handle = (cmd) => {
            const { namespace, subcommand } = cmd;
            const commands = constants_1.SLASH_COMMANDS[namespace];
            const { action, options } = commands[subcommand];
            return this.execute(action, options).then((response) => {
                // We append </> to the URL so our link parsing works
                // TODO(arjun) Uri is only valid for `/live share` command
                const responseString = response ? `<${response.toString()}>` : "";
                const sendToSlack = namespace === "live" && subcommand === "share";
                return { sendToSlack, response: responseString };
            });
        };
    }
}
class OpenCommandHandler extends VscodeCommandHandler {
    constructor() {
        super(...arguments);
        this.handle = async (cmd) => {
            const { subcommand } = cmd;
            let uri;
            try {
                uri = vscode.Uri.parse(subcommand);
                switch (uri.authority) {
                    case constants_1.LIVE_SHARE_BASE_URL:
                        const liveshare = await vsls.getApi();
                        const opts = { newWindow: false };
                        if (liveshare) {
                            await liveshare.join(uri, opts);
                        }
                        break;
                    case constants_1.TRAVIS_BASE_URL:
                        if (config_1.ConfigHelper.hasTravisProvider()) {
                            const travisHandler = new travis_1.TravisLinkHandler();
                            return travisHandler.handle(cmd);
                        }
                    default:
                        return this.execute(constants_1.VSCodeCommands.OPEN, uri);
                }
            }
            catch (err) {
                // return new Promise((_, reject) => reject());
            }
        };
    }
}
/**
 * Finds the correct command handler for the given command
 * and runs it
 */
class CommandDispatch {
    constructor() {
        this.handle = (message) => {
            const { namespace, subcommand } = message;
            if (namespace === "open") {
                // We might have to convert this into
                const openHandler = new OpenCommandHandler();
                return openHandler.handle(message);
            }
            else {
                // Others are all vs code commands
                const vscodeHandler = new VscodeCommandHandler();
                return vscodeHandler.handle(message);
            }
        };
    }
}
exports.default = CommandDispatch;
//# sourceMappingURL=commands.js.map