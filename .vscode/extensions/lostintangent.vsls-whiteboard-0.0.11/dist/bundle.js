module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/extension.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/vsls/package.json":
/*!****************************************!*\
  !*** ./node_modules/vsls/package.json ***!
  \****************************************/
/*! exports provided: _args, _from, _id, _inBundle, _integrity, _location, _phantomChildren, _requested, _requiredBy, _resolved, _spec, _where, author, bugs, categories, description, displayName, homepage, keywords, license, main, name, preview, publisher, repository, version, default */
/***/ (function(module) {

module.exports = {"_args":[["vsls@1.0.1830","/Users/joncart/Desktop/whiteboard"]],"_from":"vsls@1.0.1830","_id":"vsls@1.0.1830","_inBundle":false,"_integrity":"sha512-3WXK/1lddglH+0eGo6A99So+23Gr/vw0SVItijrCFBNUtCDhn5DWFQ3M75Voi78UQyjHg2G1KPjvu09dx56YXA==","_location":"/vsls","_phantomChildren":{},"_requested":{"type":"version","registry":true,"raw":"vsls@1.0.1830","name":"vsls","escapedName":"vsls","rawSpec":"1.0.1830","saveSpec":null,"fetchSpec":"1.0.1830"},"_requiredBy":["/"],"_resolved":"https://registry.npmjs.org/vsls/-/vsls-1.0.1830.tgz","_spec":"1.0.1830","_where":"/Users/joncart/Desktop/whiteboard","author":{"name":"Microsoft"},"bugs":{"url":"https://aka.ms/vsls-issues","email":"vsls-feedback@microsoft.com"},"categories":["Other"],"description":"Enables VS Code extensions to access Live Share capabilities.","displayName":"VS Live Share extension API","homepage":"https://aka.ms/vsls","keywords":["Live Share"],"license":"SEE LICENSE IN LICENSE.txt","main":"vscode.js","name":"vsls","preview":true,"publisher":"ms-vsliveshare","repository":{"url":"git+https://github.com/MicrosoftDocs/live-share.git"},"version":"1.0.1830"};

/***/ }),

/***/ "./node_modules/vsls/vscode.js":
/*!*************************************!*\
  !*** ./node_modules/vsls/vscode.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Entrypoint and type definitions for Live Share for VS Code extension API
 */
const vscode = __webpack_require__(/*! vscode */ "vscode");
const liveShareApiVersion = __webpack_require__(/*! ./package.json */ "./node_modules/vsls/package.json").version;
/**
 * Extension ID of the Live Share extension for VS Code.
 */
exports.extensionId = 'ms-vsliveshare.vsliveshare';
/**
 * Entrypoint for access to the Live Share API.
 *
 * @returns an instance of the Live Share API, or `null` if the Live Share extension
 * is not installed or failed to activate.
 *
 * @example To access the Live Share API from another extension:
 *
 *     import * as vsls from 'vsls/vscode';
 *     const liveshare = await vsls.getApi();
 */
async function getApi(callingExtensionId) {
    const liveshareExtension = vscode.extensions.getExtension(exports.extensionId);
    if (!liveshareExtension) {
        // The extension is not installed.
        return null;
    }
    const extensionApi = liveshareExtension.isActive ?
        liveshareExtension.exports : await liveshareExtension.activate();
    if (!extensionApi) {
        // The extensibility API is not enabled.
        return null;
    }
    // Support deprecated function name to preserve compatibility with older versions of VSLS.
    if (!extensionApi.getApi)
        return extensionApi.getApiAsync(liveShareApiVersion);
    return extensionApi.getApi(liveShareApiVersion, callingExtensionId);
}
exports.getApi = getApi;
/** @deprecated */
function getApiAsync() { return getApi(); }
exports.getApiAsync = getApiAsync;
var Role;
(function (Role) {
    Role[Role["None"] = 0] = "None";
    Role[Role["Host"] = 1] = "Host";
    Role[Role["Guest"] = 2] = "Guest";
})(Role = exports.Role || (exports.Role = {}));
/** This is just a placeholder for a richer access control model to be added later. */
var Access;
(function (Access) {
    Access[Access["None"] = 0] = "None";
    Access[Access["ReadOnly"] = 1] = "ReadOnly";
    Access[Access["ReadWrite"] = 3] = "ReadWrite";
    Access[Access["Owner"] = 255] = "Owner";
})(Access = exports.Access || (exports.Access = {}));
/**
 * Identifiers for Live Share tree views. These identifiers may be used by other extensions
 * to extend Live Share tree views with additional nodes via the `registerTreeDataProvider()`
 * API.
 */
var View;
(function (View) {
    View["Session"] = "liveshare.session";
    View["ExplorerSession"] = "liveshare.session.explorer";
    View["PlannedSessions"] = "liveshare.plannedSessions";
    View["Contacts"] = "liveshare.contacts";
    View["Help"] = "liveshare.help";
})(View = exports.View || (exports.View = {}));
/**
 * Identifiers for Live Share tree view items. These identifiers may be used by other
 * extensions to extend Live Share tree items with additional commands using conditional
 * expressions in the `view/item/context` section of their own package.json.
 */
var ViewItem;
(function (ViewItem) {
    // session item groups
    ViewItem["Participants"] = "participants";
    ViewItem["Servers"] = "servers";
    ViewItem["Terminals"] = "terminals";
    ViewItem["Comments"] = "comments";
    ViewItem["Chat"] = "chat";
    // participants
    ViewItem["CurrentUser"] = "participants.currentuser";
    ViewItem["Guest"] = "participants.guest";
    ViewItem["FollowedGuest"] = "participants.guest.followed";
    ViewItem["Participant"] = "participants.participant";
    ViewItem["FollowedParticipant"] = "participants.participant.followed";
    ViewItem["GuestAnonymous"] = "participants.guest.anonymous";
    ViewItem["FollowedGuestAnonymous"] = "participants.guest.followed.anonymous";
    ViewItem["GuestElevated"] = "participants.guest.elevated";
    ViewItem["FollowedGuestElevated"] = "participants.guest.followed.elevated";
    // servers
    ViewItem["LocalServer"] = "servers.local";
    ViewItem["RemoteServer"] = "servers.remote";
    // terminals
    ViewItem["LocalTerminalReadOnly"] = "terminals.local.readonly";
    ViewItem["LocalTerminalReadWrite"] = "terminals.local.readwrite";
    ViewItem["RemoteTerminal"] = "terminals.remote";
    // contacts
    ViewItem["SuggestedContacts"] = "contacts.suggested";
    ViewItem["AvailableContacts"] = "contacts.available";
    ViewItem["ContactsProvider"] = "contacts.provider";
    ViewItem["SelfContact"] = "contacts.selfContact";
    ViewItem["Contact"] = "contacts.contact";
    ViewItem["ContactInvited"] = "contacts.contact.invited";
    ViewItem["ContactOffline"] = "contacts.contact.offline";
    ViewItem["RecentContact"] = "contacts.recentContact";
    ViewItem["RecentContactOffline"] = "contacts.recentContact.offline";
    ViewItem["RecentContactInvited"] = "contacts.recentContact.invited";
    ViewItem["NoContact"] = "contacts.noContact";
    ViewItem["RecentContacts"] = "contacts.RecentContacts";
    ViewItem["NoSuggestedContacts"] = "contacts.NoSuggestedUsers";
    ViewItem["NoRecentContacts"] = "contacts.NoRecentContacts";
    ViewItem["InvitedContact"] = "contacts.invited";
    // help
    ViewItem["SessionFeedbackQuestion"] = "help.sessionFeedback";
    ViewItem["ReportAProblem"] = "help.reportAProblem";
    ViewItem["TweetUsYourFeedback"] = "help.tweetUsYourFeedback";
    ViewItem["Survey"] = "help.survey";
    ViewItem["GoodFeedback"] = "help.goodFeedback";
    ViewItem["BadFeedback"] = "help.badFeedback";
    ViewItem["DontAskAgain"] = "help.dontAskAgain";
    ViewItem["Thankyou"] = "help.thankyou";
    ViewItem["MoreInfo"] = "help.moreinfo";
    ViewItem["ConfigureSettings"] = "help.configureSettings";
    // Shown while session sharing / joining is in progress
    ViewItem["Loading"] = "loading";
    // Other / unspecified item type
    ViewItem["Other"] = "other";
})(ViewItem = exports.ViewItem || (exports.ViewItem = {}));
//# sourceMappingURL=liveShare.js.map

/***/ }),

/***/ "./src/abstractions/node/fileAccess.ts":
/*!*********************************************!*\
  !*** ./src/abstractions/node/fileAccess.ts ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const fs = __webpack_require__(/*! fs */ "fs");
class FileAccess {
    writeFile(uri, data) {
        return new Promise(function (resolve, reject) {
            fs.writeFile(uri.toString().replace("file://", ""), data, function (err) {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
exports.fileAccess = new FileAccess();


/***/ }),

/***/ "./src/extension.ts":
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __webpack_require__(/*! vscode */ "vscode");
const vsls = __webpack_require__(/*! vsls */ "./node_modules/vsls/vscode.js");
const fileAccess_1 = __webpack_require__(/*! @file-abstractions/fileAccess */ "./src/abstractions/node/fileAccess.ts");
const webView_1 = __webpack_require__(/*! ./webView */ "./src/webView.ts");
const treeDataProvider_1 = __webpack_require__(/*! ./treeDataProvider */ "./src/treeDataProvider.ts");
const extensionId = 'lostintangent.vsls-whiteboard';
async function activate(context) {
    const vslsApi = (await vsls.getApi(extensionId));
    const treeDataProvider = treeDataProvider_1.default(vslsApi);
    let webviewPanel;
    context.subscriptions.push(vscode.commands.registerCommand("liveshare.openWhiteboard", async () => {
        if (webviewPanel) {
            return webviewPanel.reveal();
        }
        else {
            webviewPanel = webView_1.createWebView(context);
            // If the end-user closes the whiteboard, then we
            // need to ensure we re-created it on the next click.
            webviewPanel.onDidDispose(() => (webviewPanel = null));
        }
        let { default: initializeService } = (vslsApi.session.role === vsls.Role.None || vslsApi.session.role === vsls.Role.Host)
            ? __webpack_require__(/*! ./service/hostService */ "./src/service/hostService.ts")
            : __webpack_require__(/*! ./service/guestService */ "./src/service/guestService.ts");
        await initializeService(vslsApi, webviewPanel, treeDataProvider);
    }));
    vslsApi.onDidChangeSession(e => {
        // If there isn't a session ID, then that
        // means the session has been ended.
        if (!e.session.id && webviewPanel) {
            webviewPanel.dispose();
        }
    });
    context.subscriptions.push(vscode.commands.registerCommand("liveshare.saveWhiteboard", async () => {
        if (webviewPanel) {
            const uri = await vscode.window.showSaveDialog({
                filters: {
                    SVG: ["svg"]
                }
            });
            if (!uri)
                return;
            webviewPanel.webview.onDidReceiveMessage(async ({ command, data }) => {
                if (command === "snapshotSVGResponse") {
                    await fileAccess_1.fileAccess.writeFile(uri, data);
                }
            });
            await webviewPanel.webview.postMessage({ command: "getSnapshotSVG" });
        }
    }));
}
exports.activate = activate;


/***/ }),

/***/ "./src/service/guestService.ts":
/*!*************************************!*\
  !*** ./src/service/guestService.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = __webpack_require__(/*! ./service */ "./src/service/service.ts");
async function default_1(vslsApi, webviewPanel, treeDataProvider) {
    const service = await vslsApi.getSharedService(service_1.SERVICE_NAME);
    if (!service)
        return;
    setTimeout(async () => {
        const { data } = await service.request("getSnapshot", []);
        webviewPanel.webview.postMessage({ command: "loadSnapshot", data });
    }, 500);
    service_1.default(vslsApi.session.peerNumber, service, webviewPanel, treeDataProvider);
}
exports.default = default_1;


/***/ }),

/***/ "./src/service/hostService.ts":
/*!************************************!*\
  !*** ./src/service/hostService.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = __webpack_require__(/*! ./service */ "./src/service/service.ts");
async function default_1(vslsApi, webviewPanel, treeDataProvider) {
    const service = await vslsApi.shareService(service_1.SERVICE_NAME);
    if (!service)
        return;
    let getSnapshotResolve;
    service.onRequest("getSnapshot", () => {
        return new Promise(resolve => {
            getSnapshotResolve = resolve;
            webviewPanel.webview.postMessage({ command: "getSnapshot" });
        });
    });
    const baseService = service_1.default(vslsApi.session.peerNumber, service, webviewPanel, treeDataProvider, true);
    baseService.setCustomWebviewHandler((command, data) => {
        if (command === "snapshotResponse") {
            getSnapshotResolve({ data });
            return true;
        }
        else {
            return false;
        }
    });
}
exports.default = default_1;


/***/ }),

/***/ "./src/service/service.ts":
/*!********************************!*\
  !*** ./src/service/service.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const NOTIFICATIONS = [
    "backgroundColorChange",
    "clear",
    "undo",
    "shapeSaved",
    "redo"
];
exports.SERVICE_NAME = "whiteboard";
const pendingWebviewMessages = [];
function default_1(peer, service, webviewPanel, treeDataProvider, broadcastNotifications = false) {
    NOTIFICATIONS.forEach(commandName => {
        service.onNotify(commandName, (message) => {
            if (message.peer === peer)
                return;
            const webviewMessage = {
                command: commandName,
                data: message.data
            };
            if (webviewPanel.visible) {
                webviewPanel.webview.postMessage(webviewMessage);
            }
            else {
                treeDataProvider.updateWhiteboardState(true);
                pendingWebviewMessages.push(webviewMessage);
            }
            if (broadcastNotifications) {
                service.notify(commandName, message);
            }
        });
    });
    webviewPanel.onDidChangeViewState(e => {
        if (e.webviewPanel.visible) {
            let message;
            while ((message = pendingWebviewMessages.shift())) {
                webviewPanel.webview.postMessage(message);
            }
            treeDataProvider.updateWhiteboardState(false);
        }
    });
    let handler;
    webviewPanel.webview.onDidReceiveMessage(({ command, data }) => {
        if (handler && handler(command, data))
            return;
        service.notify(command, { peer, data });
    });
    return {
        setCustomWebviewHandler(customHandler) {
            handler = customHandler;
        }
    };
}
exports.default = default_1;


/***/ }),

/***/ "./src/treeDataProvider.ts":
/*!*********************************!*\
  !*** ./src/treeDataProvider.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = __webpack_require__(/*! vscode */ "vscode");
const vsls_1 = __webpack_require__(/*! vsls */ "./node_modules/vsls/vscode.js");
const LABEL_PREFIX = "Whiteboard";
class WhiteboardTreeDataProvider {
    constructor() {
        this._treeCommand = {
            command: "liveshare.openWhiteboard",
            title: LABEL_PREFIX
        };
        this._isDirty = false;
        this._onDidChangeTreeData = new vscode_1.EventEmitter();
        this.onDidChangeTreeData = this
            ._onDidChangeTreeData.event;
    }
    getChildren(element) {
        return Promise.resolve([this._treeCommand]);
    }
    getTreeItem(element) {
        const treeItem = new vscode_1.TreeItem(LABEL_PREFIX);
        treeItem.label = element.title;
        treeItem.contextValue = LABEL_PREFIX;
        treeItem.command = element;
        return treeItem;
    }
    updateWhiteboardState(isDirty) {
        if (this._isDirty !== isDirty) {
            this._isDirty = isDirty;
            const suffix = isDirty ? " (*)" : "";
            this._treeCommand.title = `${LABEL_PREFIX}${suffix}`;
            this._onDidChangeTreeData.fire(this._treeCommand);
        }
    }
}
function default_1(vslsApi) {
    const treeDataProvider = new WhiteboardTreeDataProvider();
    vslsApi.registerTreeDataProvider(vsls_1.View.Session, treeDataProvider);
    vslsApi.registerTreeDataProvider(vsls_1.View.ExplorerSession, treeDataProvider);
    return treeDataProvider;
}
exports.default = default_1;


/***/ }),

/***/ "./src/webView.ts":
/*!************************!*\
  !*** ./src/webView.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __webpack_require__(/*! vscode */ "vscode");
function isNode() {
    return (typeof process !== 'undefined') && (typeof process.release !== 'undefined') && (process.release.name === 'node');
}
function getExtensionUri(context, relativePath) {
    // Returns extension uri if this method is supported by VS Code.
    // Otherwise returns the absolute path as a Uri
    return context.asExtensionUri ?
        context.asExtensionUri(relativePath) :
        vscode.Uri.file(context.asAbsolutePath(relativePath));
}
function createWebView(context) {
    let staticResourcePathUri = getExtensionUri(context, 'static');
    if (isNode()) {
        staticResourcePathUri = staticResourcePathUri.with({
            scheme: "vscode-resource"
        });
    }
    const panel = vscode.window.createWebviewPanel("vsls-whiteboard", "Live Share Whiteboard", vscode.ViewColumn.Active, {
        enableScripts: true,
        localResourceRoots: [staticResourcePathUri],
        retainContextWhenHidden: true
    });
    panel.webview.html = getWebViewContents(staticResourcePathUri);
    return panel;
}
exports.createWebView = createWebView;
function getWebViewContents(webViewBaseUri) {
    return `<!DOCTYPE html>
<html>
	<head>
		<base href="${webViewBaseUri.toString()}/" />
        <link href="literallycanvas/literallycanvas.css" rel="stylesheet" />
        <link href="index.css" rel="stylesheet" />

		<script src="https://cdnjs.cloudflare.com/ajax/libs/react/0.14.7/react-with-addons.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/react/0.14.7/react-dom.js"></script>
		<script src="literallycanvas/literallycanvas.js"></script>
	</head>
	<body>
		<div id="whiteboard"></div>
		<script src="index.js"></script>
	</body>
</html>`;
}


/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("vscode");

/***/ })

/******/ });
//# sourceMappingURL=bundle.js.map