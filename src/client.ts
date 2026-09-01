import { AccountResource, ApiKeysResource, BillingResource, WebhooksResource } from './resources/account.js';
import { AssetsResource } from './resources/assets.js';
import { ContentLoopsResource } from './resources/contentLoops.js';
import { AssetTypesResource, AvatarsResource, ModelsResource, VoicesResource } from './resources/discovery.js';
import { GenerationsResource } from './resources/generations.js';
import { CollectionsResource, SourcesResource } from './resources/knowledge.js';
import { ProjectsResource } from './resources/projects.js';
import { Transport, type AutoContentOptions } from './transport.js';
import type { RequestOptions } from './types/index.js';
import { webhooks as webhookVerification } from './webhooks.js';

export default class AutoContent {
  static readonly webhooks = webhookVerification;

  readonly projects: ProjectsResource;
  readonly collections: CollectionsResource;
  readonly sources: SourcesResource;
  readonly assetTypes: AssetTypesResource;
  readonly models: ModelsResource;
  readonly voices: VoicesResource;
  readonly avatars: AvatarsResource;
  readonly generations: GenerationsResource;
  readonly assets: AssetsResource;
  readonly contentLoops: ContentLoopsResource;
  readonly account: AccountResource;
  readonly apiKeys: ApiKeysResource;
  readonly billing: BillingResource;
  readonly webhooks: WebhooksResource;

  private readonly transport: Transport;

  constructor(options: AutoContentOptions) {
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

  downloadArtifact(artifact: string | { url: string }, options: RequestOptions = {}): Promise<Response> {
    const url = typeof artifact === 'string' ? artifact : artifact.url;
    return this.transport.download(url, options);
  }
}

export type { AutoContentOptions } from './transport.js';
