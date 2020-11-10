"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Mixpanel = require("mixpanel");
const constants_1 = require("./constants");
const config_1 = require("./config");
const utils_1 = require("./utils");
const BATCH_SIZE = 10;
const INTERVAL_TIMEOUT = 30 * 60 * 1000; // 30 mins in ms
class TelemetryReporter {
    constructor(manager) {
        this.manager = manager;
        this.hasUserOptIn = false;
        this.pendingEvents = [];
        const { installationId } = this.manager.store;
        this.uniqueId = installationId;
        this.versions = utils_1.getVersions();
        if (process.env.IS_DEBUG !== "true") {
            this.hasUserOptIn = config_1.ConfigHelper.hasTelemetry();
        }
        if (this.hasUserOptIn) {
            this.mixpanel = Mixpanel.init(constants_1.MIXPANEL_TOKEN);
            this.interval = setInterval(() => {
                if (this.pendingEvents.length > 0) {
                    return this.flushBatch();
                }
            }, INTERVAL_TIMEOUT);
        }
        this.hasExtensionPack = utils_1.hasVslsExtensionPack();
    }
    setUniqueId(uniqueId) {
        this.uniqueId = uniqueId;
    }
    dispose() {
        if (!!this.interval) {
            clearInterval(this.interval);
        }
        if (this.pendingEvents.length > 0) {
            return this.flushBatch();
        }
        return Promise.resolve();
    }
    record(name, source, channelId, // TODO: change this to channelType
    provider) {
        let channelType = undefined;
        if (!!channelId && !!provider) {
            const channel = this.manager.getChannel(provider, channelId);
            channelType = !!channel ? channel.type : undefined;
        }
        const event = {
            type: name,
            time: new Date(),
            properties: {
                provider,
                source: source,
                channel_type: channelType
            }
        };
        if (this.hasUserOptIn) {
            this.pendingEvents.push(event);
            const hasActivationEvents = name === "activation_ended" /* activationEnded */ || name === "activation_started" /* activationStarted */;
            if (this.pendingEvents.length >= BATCH_SIZE || hasActivationEvents) {
                this.flushBatch();
            }
        }
    }
    getMxEvent(event) {
        const { os, extension, editor } = this.versions;
        const { type: name, properties, time } = event;
        const { provider } = properties;
        return {
            event: name,
            properties: Object.assign({ distinct_id: this.uniqueId, extension_version: extension, os_version: os, editor_version: editor, has_extension_pack: this.hasExtensionPack, is_authenticated: this.manager.isAuthenticated(provider) }, properties, { time })
        };
    }
    flushBatch() {
        const copy = [...this.pendingEvents];
        const events = copy.map(event => this.getMxEvent(event));
        this.pendingEvents = [];
        return new Promise((resolve, reject) => {
            if (!this.mixpanel) {
                resolve();
            }
            else {
                this.mixpanel.track_batch(events, error => {
                    if (!error) {
                        resolve();
                    }
                    else {
                        // We are not going to retry with `copy`
                        reject();
                    }
                });
            }
        });
    }
}
exports.default = TelemetryReporter;
//# sourceMappingURL=telemetry.js.map