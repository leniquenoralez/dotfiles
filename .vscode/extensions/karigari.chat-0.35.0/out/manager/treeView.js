"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tree_1 = require("../tree");
class TreeViewManager {
    constructor(provider) {
        this.provider = provider;
        this.workspacesTreeProvider = new tree_1.WorkspacesTreeProvider(provider);
        this.unreadsTreeProvider = new tree_1.UnreadsTreeProvider(provider);
        this.channelsTreeProvider = new tree_1.ChannelTreeProvider(provider);
        this.groupsTreeProvider = new tree_1.GroupTreeProvider(provider);
        this.imsTreeProvider = new tree_1.IMsTreeProvider(provider);
    }
    updateData(currentUserInfo, channelLabels) {
        this.workspacesTreeProvider.updateCurrentUser(currentUserInfo);
        this.unreadsTreeProvider.updateChannels(channelLabels);
        this.channelsTreeProvider.updateChannels(channelLabels);
        this.groupsTreeProvider.updateChannels(channelLabels);
        this.imsTreeProvider.updateChannels(channelLabels);
    }
    dispose() {
        this.workspacesTreeProvider.dispose();
        this.unreadsTreeProvider.dispose();
        this.channelsTreeProvider.dispose();
        this.groupsTreeProvider.dispose();
        this.imsTreeProvider.dispose();
    }
}
exports.TreeViewManager = TreeViewManager;
//# sourceMappingURL=treeView.js.map