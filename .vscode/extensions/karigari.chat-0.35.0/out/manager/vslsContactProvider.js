"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_1 = require("vscode");
const vsls = require("vsls");
const constants_1 = require("../constants");
const vsls_contactprotocol_js_1 = require("vsls/vsls-contactprotocol.js");
class VslsContactProvider {
    constructor(presenceProviderName, manager) {
        this.presenceProviderName = presenceProviderName;
        this.manager = manager;
        this.isInitialized = false;
        this.matchedContacts = {};
        this._onNotified = new vscode_1.EventEmitter();
        this.publishPresenceHandler = async (params) => {
            const { status } = params;
            let presence = "unknown" /* unknown */;
            switch (status) {
                case vsls_contactprotocol_js_1.PresenceStatus.Available:
                    presence = "available" /* available */;
                    break;
                case vsls_contactprotocol_js_1.PresenceStatus.Away:
                    presence = "invisible" /* invisible */; // This could be `idle` as well
                    break;
                case vsls_contactprotocol_js_1.PresenceStatus.Busy:
                    presence = "doNotDisturb" /* doNotDisturb */;
                    break;
                case vsls_contactprotocol_js_1.PresenceStatus.DoNotDisturb:
                    presence = "doNotDisturb" /* doNotDisturb */;
                    break;
                case vsls_contactprotocol_js_1.PresenceStatus.Invisible:
                    presence = "invisible" /* invisible */;
                    break;
                case vsls_contactprotocol_js_1.PresenceStatus.Offline:
                    presence = "offline" /* offline */;
                    break;
                case vsls_contactprotocol_js_1.PresenceStatus.Unknown:
                    presence = "unknown" /* unknown */;
                    break;
            }
            vscode.commands.executeCommand(constants_1.SelfCommands.UPDATE_SELF_PRESENCE_VIA_VSLS, {
                presence,
                provider: this.presenceProviderName
            });
        };
        this.getUserPresence = (user) => {
            switch (user.presence) {
                case "available" /* available */:
                    return vsls_contactprotocol_js_1.PresenceStatus.Available;
                case "doNotDisturb" /* doNotDisturb */:
                    return vsls_contactprotocol_js_1.PresenceStatus.DoNotDisturb;
                case "idle" /* idle */:
                    return vsls_contactprotocol_js_1.PresenceStatus.Away;
                case "invisible" /* invisible */:
                    return vsls_contactprotocol_js_1.PresenceStatus.Invisible;
                case "offline" /* offline */:
                    return vsls_contactprotocol_js_1.PresenceStatus.Offline;
                case "unknown" /* unknown */:
                    return vsls_contactprotocol_js_1.PresenceStatus.Unknown;
            }
        };
        this.getContact = (user) => {
            const contact = {
                id: user.id,
                displayName: user.fullName,
                email: user.email,
                status: this.getUserPresence(user)
            };
            return contact;
        };
    }
    async register() {
        const liveshare = await vsls.getApiAsync();
        if (!!liveshare) {
            liveshare.registerContactServiceProvider(this.presenceProviderName, this);
        }
    }
    get onNotified() {
        return this._onNotified.event;
    }
    async requestAsync(type, parameters, cancellationToken) {
        let result = {};
        switch (type) {
            case vsls_contactprotocol_js_1.Methods.RequestInitializeName:
                // Request for initialization
                result = await this.initializeHandler();
                break;
            case vsls_contactprotocol_js_1.Methods.RequestInviteName:
                // Request for sending invitation link
                await this.sendInviteLinkHandler(parameters);
                break;
            case vsls_contactprotocol_js_1.Methods.RequestContactPresenceName:
                // Request for presence query of the user
                result = await this.presenceRequestHandler(parameters);
                break;
            case vsls_contactprotocol_js_1.Methods.RequestPublishPresenceName:
                await this.publishPresenceHandler(parameters);
                break;
            default:
                throw new Error(`type:${type} not supported`);
        }
        return result;
    }
    notify(type, body) {
        this._onNotified.fire({
            type,
            body
        });
    }
    notifySelfContact(user) {
        if (!!user) {
            const contact = this.getContact(user);
            this.notify(vsls_contactprotocol_js_1.Methods.NotifySelfContactName, {
                contact
            });
        }
    }
    notifyAvailableUsers(selfUserId, users) {
        const contacts = Object.keys(users)
            .filter(key => key !== selfUserId)
            .map(key => this.getContact(users[key]));
        this.notify(vsls_contactprotocol_js_1.Methods.NotifyAvailableUsersName, {
            contacts
        });
    }
    notifyPresenceChanged(user) {
        const contact = this.getContact(user);
        const notification = {
            changes: [
                {
                    contactId: contact.id,
                    status: contact.status
                }
            ]
        };
        this.notify(vsls_contactprotocol_js_1.Methods.NotifyPresenceChangedName, notification);
        // This user might also have a matched contact, and if so,
        // we will send a presence changed notification for them.
        const matchedContact = this.matchedContacts[user.id];
        if (!!matchedContact) {
            const notification = {
                changes: [
                    {
                        contactId: matchedContact.id,
                        status: contact.status
                    }
                ]
            };
            this.notify(vsls_contactprotocol_js_1.Methods.NotifyPresenceChangedName, notification);
        }
    }
    notifyInviteReceived(fromUserId, uri) {
        this.notify(vsls_contactprotocol_js_1.Methods.NotifyInviteReceivedName, {
            fromContactId: fromUserId,
            link: uri.toString()
        });
    }
    getMatchedUserId(contactId) {
        const userIds = Object.keys(this.matchedContacts);
        return userIds.find(userId => this.matchedContacts[userId].id === contactId);
    }
    async initializeHandler() {
        this.isInitialized = true;
        return {
            description: this.presenceProviderName,
            capabilities: {
                supportsDispose: false,
                supportsInviteLink: true,
                supportsPresence: true,
                supportsContactPresenceRequest: true,
                supportsPublishPresence: true,
                supportsSelfContact: true,
                supportsAvailableContacts: true
            }
        };
    }
    async sendInviteLinkHandler(params) {
        const { link, targetContactId } = params;
        // targetContactId can be one of slack/discord users, or
        // a matched contact.
        const matchedUserIds = Object.keys(this.matchedContacts);
        const targetMatchedUserId = matchedUserIds.find(userId => this.matchedContacts[userId].id === targetContactId);
        const userIdToInvite = targetMatchedUserId || targetContactId;
        const userToInvite = this.manager.store.getUser(this.presenceProviderName, userIdToInvite);
        if (!!userToInvite) {
            let imChannel = this.manager.getIMChannel(this.presenceProviderName, userToInvite);
            if (!imChannel) {
                imChannel = await this.manager.createIMChannel(this.presenceProviderName, userToInvite);
            }
            if (!!imChannel) {
                this.manager.sendMessage(this.presenceProviderName, link, imChannel.id, undefined);
            }
        }
    }
    async presenceRequestHandler(params) {
        const { contacts } = params;
        const knownUsers = this.manager.store.getUsers(this.presenceProviderName);
        const knownUserIds = Object.keys(knownUsers);
        // The response can only have contacts matched in this
        // request. Hence, we maintain a list of matched ids.
        let matchedUserIds = [];
        // Attempting to match contacts with known users
        contacts.forEach(contact => {
            const { email, displayName } = contact;
            const matchByEmail = knownUserIds.find(userId => knownUsers[userId].email === email);
            const matchByName = knownUserIds.find(
            // Since discord does not have a full name, we will
            // need to do something else here.
            userId => knownUsers[userId].fullName === displayName);
            const matchedUserId = matchByEmail || matchByName;
            if (!!matchedUserId) {
                this.matchedContacts[matchedUserId] = contact;
                matchedUserIds.push(matchedUserId);
            }
        });
        let result = {
            contacts: matchedUserIds.map(userId => {
                const contact = this.matchedContacts[userId];
                const user = knownUsers[userId];
                return {
                    contactId: contact.id,
                    contact: Object.assign({}, contact, { status: this.getUserPresence(user) })
                };
            })
        };
        return result;
    }
}
exports.VslsContactProvider = VslsContactProvider;
//# sourceMappingURL=vslsContactProvider.js.map