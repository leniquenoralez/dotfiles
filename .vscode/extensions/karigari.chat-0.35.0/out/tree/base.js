"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const treeItem_1 = require("./treeItem");
const utils_1 = require("../utils");
class BaseChannelsListTreeProvider {
    constructor(providerName, viewId) {
        this.providerName = providerName;
        this.viewId = viewId;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this._disposables = [];
        this.sortingFn = (a, b) => a.label.localeCompare(b.label);
        this.filterFn = () => true;
        this.channelLabels = [];
        this.getParent = (element) => {
            const { channel } = element;
            if (!!channel && !!channel.categoryName) {
                return Promise.resolve(this.getItemForCategory(channel.categoryName));
            }
        };
        this.getChildren = (element) => {
            if (!element) {
                return this.getRootChildren();
            }
            if (!!element && element.isCategory) {
                return this.getChildrenForCategory(element);
            }
        };
        this.getChildrenForCategory = (element) => {
            const { label: category } = element;
            const channels = this.channelLabels
                .filter(channelLabel => {
                const { channel } = channelLabel;
                return channel.categoryName === category;
            })
                .map(this.getItemForChannel);
            return Promise.resolve(channels);
        };
        this.getRootChildren = () => {
            const channelsWithoutCategories = this.channelLabels
                .filter(channelLabel => !channelLabel.channel.categoryName)
                .map(this.getItemForChannel);
            const categories = this.channelLabels
                .map(channelLabel => channelLabel.channel.categoryName)
                .filter(utils_1.notUndefined);
            const uniqueCategories = categories
                .filter((item, pos) => categories.indexOf(item) === pos)
                .map(category => this.getItemForCategory(category));
            return Promise.resolve([...channelsWithoutCategories, ...uniqueCategories]);
        };
        this.getItemForChannel = (channelLabel) => {
            const { label, presence, channel } = channelLabel;
            return {
                label,
                presence,
                channel,
                isCategory: false,
                user: undefined,
                team: undefined,
                providerName: this.providerName
            };
        };
        this.getItemForCategory = (category) => {
            return {
                label: category,
                presence: "unknown" /* unknown */,
                isCategory: true,
                channel: undefined,
                user: undefined,
                team: undefined,
                providerName: this.providerName
            };
        };
        this.getTreeItem = (element) => {
            const { label, presence, isCategory, channel, user } = element;
            const treeItem = new treeItem_1.ChannelTreeItem(label, presence, isCategory, this.providerName, channel, user);
            return treeItem;
        };
        this._disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
    }
    dispose() {
        this._disposables.forEach(dispose => dispose.dispose());
    }
    async refresh(treeItem) {
        return treeItem
            ? this._onDidChangeTreeData.fire(treeItem)
            : this._onDidChangeTreeData.fire();
    }
    getLabelsObject(channeLabels) {
        let result = {};
        channeLabels.forEach(label => {
            const { channel } = label;
            result[channel.id] = label;
        });
        return result;
    }
    updateChannels(channelLabels) {
        const filtered = channelLabels.filter(this.filterFn).sort(this.sortingFn);
        const prevLabels = this.getLabelsObject(this.channelLabels);
        const newLabels = this.getLabelsObject(filtered);
        this.channelLabels = filtered;
        const prevKeys = new Set(Object.keys(prevLabels));
        const newKeys = new Set(Object.keys(newLabels));
        if (!utils_1.equals(prevKeys, newKeys)) {
            // We have new channels, so we are replacing everything
            // Can potentially optimize this
            return this.refresh();
        }
        // Looking for changes in presence and unread
        Object.keys(newLabels).forEach(channelId => {
            const newLabel = newLabels[channelId];
            const prevLabel = prevLabels[channelId];
            if (prevLabel.unread !== newLabel.unread) {
                // Can we send just this element?
                this.refresh();
            }
            if (prevLabel.presence !== newLabel.presence) {
                // Can we send just this element?
                this.refresh();
            }
        });
    }
}
exports.BaseChannelsListTreeProvider = BaseChannelsListTreeProvider;
//# sourceMappingURL=base.js.map