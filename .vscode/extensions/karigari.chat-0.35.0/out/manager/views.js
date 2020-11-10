"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const treeView_1 = require("./treeView");
const status_1 = require("../status");
const onboarding_1 = require("../onboarding");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const PROVIDERS_WITH_TREE = ["slack", "discord"];
const getStatusItemKey = (provider, team) => {
    return `${provider}:${team.id}`;
};
class ViewsManager {
    constructor(parentManager) {
        this.parentManager = parentManager;
        this.statusItems = new Map();
        this.treeViews = new Map();
    }
    initialize(enabledProviders, providerTeams) {
        const statusItemKeys = new Map();
        enabledProviders.forEach(provider => {
            const teams = providerTeams[provider];
            teams.forEach(team => {
                statusItemKeys.set(getStatusItemKey(provider, team), {
                    provider,
                    team
                });
            });
        });
        this.initializeStatusItems(statusItemKeys);
        this.initializeTreeViews(enabledProviders);
        const showOnboarding = false;
        // Overriding showOnboarding to be always false, so that vsls extension
        // pack users don't see a slack icon in the activity bar.
        // const showOnboarding = nonVslsProviders.length === 0;
        if (showOnboarding && !this.onboardingTree) {
            // We need to initialize the tree here
            this.onboardingTree = new onboarding_1.OnboardingTreeProvider();
        }
        else if (!showOnboarding && !!this.onboardingTree) {
            // Dispose the tree as we don't need it anymore
            this.onboardingTree.dispose();
            this.onboardingTree = undefined;
        }
    }
    initializeStatusItems(newKeyMap) {
        // Ensure new keys have status items in the map and
        // no longer used keys are removed.
        const existingKeysSet = new Set(Array.from(this.statusItems.keys()));
        const newKeysSet = new Set(Array.from(newKeyMap.keys()));
        const keysToRemove = utils_1.difference(existingKeysSet, newKeysSet);
        const keysToAdd = utils_1.difference(newKeysSet, existingKeysSet);
        keysToRemove.forEach(key => {
            const statusItem = this.statusItems.get(key);
            if (!!statusItem) {
                statusItem.dispose();
                this.statusItems.delete(key);
            }
        });
        keysToAdd.forEach(key => {
            const providerAndTeam = newKeyMap.get(key);
            if (!!providerAndTeam) {
                const { provider, team } = providerAndTeam;
                this.statusItems.set(key, new status_1.UnreadsStatusItem(provider, team));
            }
        });
    }
    initializeTreeViews(enabledProviders) {
        PROVIDERS_WITH_TREE.forEach(provider => {
            const hasProviderEnabled = enabledProviders.indexOf(provider) >= 0;
            utils_1.setVsContext(`chat:${provider}`, hasProviderEnabled);
        });
        const enabledTreeProviders = new Set(enabledProviders.filter(p => PROVIDERS_WITH_TREE.indexOf(p) >= 0));
        const existingTreeProviders = new Set(Array.from(this.treeViews.keys()));
        const treesToAdd = utils_1.difference(enabledTreeProviders, existingTreeProviders);
        const treesToRemove = utils_1.difference(existingTreeProviders, enabledTreeProviders);
        treesToRemove.forEach(treeProvider => {
            const treeView = this.treeViews.get(treeProvider);
            if (!!treeView) {
                treeView.dispose();
                this.treeViews.delete(treeProvider);
            }
        });
        treesToAdd.forEach(treeProvider => {
            this.treeViews.set(treeProvider, new treeView_1.TreeViewManager(treeProvider));
        });
    }
    updateStatusItem(provider, team) {
        const statusItem = this.statusItems.get(getStatusItemKey(provider, team));
        if (statusItem) {
            const channels = this.parentManager.store.getChannels(provider);
            const unreads = channels.map(channel => {
                return this.parentManager.getUnreadCount(provider, channel);
            });
            const totalUnreads = unreads.reduce((a, b) => a + b, 0);
            statusItem.updateCount(totalUnreads);
        }
    }
    updateTreeViews(provider) {
        const treeViewForProvider = this.treeViews.get(provider);
        if (!!treeViewForProvider && this.parentManager.isAuthenticated(provider)) {
            const channelLabels = this.parentManager.getChannelLabels(provider);
            const currentUserInfo = this.parentManager.getCurrentUserFor(provider);
            if (!!currentUserInfo) {
                treeViewForProvider.updateData(currentUserInfo, channelLabels);
            }
        }
    }
    updateWebview(currentUser, provider, users, channel, messages, typingUser) {
        const { fontFamily, fontSize } = vscode.workspace.getConfiguration("editor");
        let statusText = ``;
        if (typingUser) {
            statusText = `${typingUser.name} is typing...`;
        }
        let uiMessage = {
            fontFamily,
            fontSize,
            provider,
            messages,
            users,
            currentUser,
            channel,
            statusText
            // atMentions: Object.values(users)
        };
        vscode.commands.executeCommand(constants_1.SelfCommands.SEND_TO_WEBVIEW, {
            uiMessage
        });
    }
    dispose() {
        for (let entry of Array.from(this.statusItems.entries())) {
            let statusItem = entry[1];
            statusItem.dispose();
        }
        for (let entry of Array.from(this.treeViews.entries())) {
            let treeView = entry[1];
            treeView.dispose();
        }
        if (!!this.onboardingTree) {
            this.onboardingTree.dispose();
        }
    }
}
exports.ViewsManager = ViewsManager;
//# sourceMappingURL=views.js.map