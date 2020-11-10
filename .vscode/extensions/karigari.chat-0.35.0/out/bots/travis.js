"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const rp = require("request-promise-native");
const constants_1 = require("../constants");
function getTravisBuild(username, reponame, build) {
    return rp({
        baseUrl: "https://api.travis-ci.org/",
        uri: `repos/${username}/${reponame}/builds/${build}`,
        json: true,
        headers: {
            Accept: "application/vnd.travis-ci.2.1+json"
        }
    }).then(response => {
        const { jobs } = response;
        if (jobs) {
            return rp({
                baseUrl: "https://api.travis-ci.org/",
                uri: `jobs/${jobs[0].id}/log`
            });
        }
    });
}
function stripAnsiEscapes(input) {
    // Credits: https://stackoverflow.com/a/29497680/1469222
    return input.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}
class TravisLinkHandler {
    handle(cmd) {
        const { subcommand } = cmd;
        const { path } = vscode.Uri.parse(subcommand);
        const matched = path.match(/^\/(.+)\/(.+)\/(.+)\/(.+)$/);
        if (!!matched && matched.length) {
            const user = matched[1];
            const repo = matched[2];
            const buildId = matched[4];
            vscode.window.showTextDocument(vscode.Uri.parse(`${constants_1.TRAVIS_SCHEME}://${user}/${repo}/${buildId}`), { viewColumn: vscode.ViewColumn.One });
        }
        const response = { sendToSlack: false, response: "" };
        return Promise.resolve(response);
    }
}
exports.TravisLinkHandler = TravisLinkHandler;
class TravisDocumentContentProvider {
    provideTextDocumentContent(uri) {
        const { authority, path } = uri;
        const splitPath = path.split("/");
        return getTravisBuild(authority, splitPath[1], splitPath[2]).then(response => stripAnsiEscapes(response));
    }
}
exports.default = new TravisDocumentContentProvider();
//# sourceMappingURL=travis.js.map