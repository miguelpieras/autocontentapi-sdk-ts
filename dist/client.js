import { AccountResource, ApiKeysResource, BillingResource, WebhooksResource } from './resources/account.js';
import { AssetsResource } from './resources/assets.js';
import { ContentLoopsResource } from './resources/contentLoops.js';
import { AssetTypesResource, AvatarsResource, ModelsResource, VoicesResource } from './resources/discovery.js';
import { GenerationsResource } from './resources/generations.js';
import { CollectionsResource, SourcesResource } from './resources/knowledge.js';
import { ProjectsResource } from './resources/projects.js';
import { Transport } from './transport.js';
import { webhooks as webhookVerification } from './webhooks.js';
export default class AutoContent {
    static webhooks = webhookVerification;
    projects;
    collections;
    sources;
    assetTypes;
    models;
    voices;
    avatars;
    generations;
    assets;
    contentLoops;
    account;
    apiKeys;
    billing;
    webhooks;
    transport;
    constructor(options) {
        this.transport = new Transport(options);
        this.projects = new ProjectsResource(this.transport);
        this.collections = new CollectionsResource(this.transport);
        this.sources = new SourcesResource(this.transport);
        this.assetTypes = new AssetTypesResource(this.transport);
        this.models = new ModelsResource(this.transport);
        this.voices = new VoicesResource(this.transport);
        this.avatars = new AvatarsResource(this.transport);
        this.generations = new GenerationsResource(this.transport);
        this.assets = new AssetsResource(this.transport);
        this.contentLoops = new ContentLoopsResource(this.transport);
        this.account = new AccountResource(this.transport);
        this.apiKeys = new ApiKeysResource(this.transport);
        this.billing = new BillingResource(this.transport);
        this.webhooks = new WebhooksResource(this.transport);
    }
    downloadArtifact(artifact, options = {}) {
        const url = typeof artifact === 'string' ? artifact : artifact.url;
        return this.transport.download(url, options);
    }
}
//# sourceMappingURL=client.js.map