"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const treeItem_1 = require("./treeItem");
const utils_1 = require("../utils");
class WorkspacesTreeProvider extends base_1.BaseChannelsListTreeProvider {
    constructor(provider) {
        super(provider, `chat.treeView.workspaces.${provider}`);
        this.filterFn = c => c.unread > 0;
        this.sortingFn = (a, b) => b.unread - a.unread;
        this.getChildren = (element) => {
            if (!element) {
                if (!!this.userInfo) {
                    const { teams } = this.userInfo;
                    return teams.map(this.getItemForTeam);
                }
            }
        };
        this.getItemForTeam = (team) => {
            let label = team.name;
            if (!!this.userInfo) {
                if (this.userInfo.currentTeamId === team.id) {
                    label = `${label} (active)`;
                }
            }
            return {
                label,
                presence: "unknown" /* unknown */,
                isCategory: false,
                channel: undefined,
                user: undefined,
                team: team,
                providerName: this.providerName
            };
        };
        this.getTreeItem = (element) => {
            const { label, team, providerName } = element;
            const treeItem = new treeItem_1.WorkspaceTreeItem(label, providerName, team);
            return treeItem;
        };
    }
    updateCurrentUser(userInfo) {
        if (!this.userInfo) {
            this.userInfo = userInfo;
            this.refresh();
        }
        else {
            const existingTeamIds = this.userInfo.teams.map(team => team.id);
            const newTeamIds = userInfo.teams.map(team => team.id);
            const hasTeamsChanged = !utils_1.equals(new Set(existingTeamIds), new Set(newTeamIds));
            const hasCurrentChanged = this.userInfo.currentTeamId !== userInfo.currentTeamId;
            if (hasCurrentChanged || hasTeamsChanged) {
                this.userInfo = userInfo;
                this.refresh();
            }
        }
    }
}
exports.WorkspacesTreeProvider = WorkspacesTreeProvider;
class UnreadsTreeProvider extends base_1.BaseChannelsListTreeProvider {
    constructor(provider) {
        super(provider, `chat.treeView.unreads.${provider}`);
        this.filterFn = c => c.unread > 0;
        this.sortingFn = (a, b) => b.unread - a.unread;
    }
}
exports.UnreadsTreeProvider = UnreadsTreeProvider;
class ChannelTreeProvider extends base_1.BaseChannelsListTreeProvider {
    constructor(provider) {
        super(provider, `chat.treeView.channels.${provider}`);
        this.filterFn = c => c.channel.type === "channel" /* channel */;
    }
}
exports.ChannelTreeProvider = ChannelTreeProvider;
class GroupTreeProvider extends base_1.BaseChannelsListTreeProvider {
    constructor(provider) {
        super(provider, `chat.treeView.groups.${provider}`);
        this.filterFn = c => c.channel.type === "group" /* group */;
    }
}
exports.GroupTreeProvider = GroupTreeProvider;
class IMsTreeProvider extends base_1.BaseChannelsListTreeProvider {
    constructor(provider) {
        super(provider, `chat.treeView.ims.${provider}`);
        this.filterFn = c => c.channel.type === "im" /* im */;
    }
}
exports.IMsTreeProvider = IMsTreeProvider;
class OnlineUsersTreeProvider extends base_1.BaseChannelsListTreeProvider {
    constructor(providerName) {
        super(providerName, `chat.treeView.onlineUsers.${providerName}`);
        this.users = [];
        this.imChannels = {};
        this.DM_ROLE_NAME = "Direct Messages";
        this.OTHERS_ROLE_NAME = "Others";
        this.getChildrenForCategory = (element) => {
            const { label: role } = element;
            if (role === this.DM_ROLE_NAME) {
                const dmUserIds = Object.keys(this.imChannels);
                return Promise.resolve(this.users
                    .filter(user => dmUserIds.indexOf(user.id) >= 0)
                    .map(user => this.getItemForUser(user)));
            }
            if (role === this.OTHERS_ROLE_NAME) {
                const usersWithoutRoles = this.users.filter(user => !user.roleName);
                return Promise.resolve(usersWithoutRoles.map(user => this.getItemForUser(user)));
            }
            const users = this.users
                .filter(user => user.roleName === role)
                .map(user => this.getItemForUser(user));
            return Promise.resolve(users);
        };
        this.getRootChildren = () => {
            if (this.providerName === "slack") {
                return Promise.resolve(this.users.map(user => this.getItemForUser(user)));
            }
            // Since Discord guilds can have lots of members, we want to ensure all
            // members are categorised for easy navigation.
            // For this, we introduced 2 roles: "Direct Messages" and "Others"
            // const dmRoles = this.
            let rootElements = [];
            const dmUserIds = Object.keys(this.imChannels);
            if (dmUserIds.length > 0) {
                rootElements.push(this.getItemForCategory(this.DM_ROLE_NAME));
            }
            const roles = this.users
                .filter(user => !!user.roleName)
                .map(user => user.roleName);
            const uniqueRoles = roles
                .filter((item, pos) => roles.indexOf(item) === pos)
                .filter(utils_1.notUndefined)
                .map(role => this.getItemForCategory(role));
            if (uniqueRoles.length > 0) {
                rootElements = [...rootElements, ...uniqueRoles];
            }
            const usersWithoutRoles = this.users.filter(user => !user.roleName);
            if (usersWithoutRoles.length > 0) {
                rootElements.push(this.getItemForCategory(this.OTHERS_ROLE_NAME));
            }
            return Promise.resolve(rootElements);
        };
        this.getParent = (element) => {
            return;
        };
    }
    updateData(currentUser, users, imChannels) {
        const { id: currentId } = currentUser;
        const ALLOWED_PRESENCE = [
            "available" /* available */,
            "doNotDisturb" /* doNotDisturb */,
            "idle" /* idle */
        ];
        const prevUserIds = new Set(this.users.map(user => user.id));
        this.users = Object.keys(users)
            .map(userId => users[userId])
            .filter(user => ALLOWED_PRESENCE.indexOf(user.presence) >= 0)
            .filter(user => user.id !== currentId); // Can't have the self user in this list
        const newUserIds = new Set(this.users.map(user => user.id));
        this.imChannels = imChannels;
        if (!utils_1.equals(prevUserIds, newUserIds)) {
            return this.refresh();
        }
    }
    getItemForUser(user) {
        return {
            label: user.name,
            presence: user.presence,
            isCategory: false,
            user,
            channel: this.imChannels[user.id],
            team: undefined,
            providerName: this.providerName
        };
    }
}
exports.OnlineUsersTreeProvider = OnlineUsersTreeProvider;
//# sourceMappingURL=index.js.map