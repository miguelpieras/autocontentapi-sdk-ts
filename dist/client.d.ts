import { AccountResource, ApiKeysResource, BillingResource, WebhooksResource } from './resources/account.js';
import { AssetsResource } from './resources/assets.js';
import { ContentLoopsResource } from './resources/contentLoops.js';
import { AssetTypesResource, AvatarsResource, ModelsResource, VoicesResource } from './resources/discovery.js';
import { GenerationsResource } from './resources/generations.js';
import { CollectionsResource, SourcesResource } from './resources/knowledge.js';
import { ProjectsResource } from './resources/projects.js';
import { type AutoContentOptions } from './transport.js';
import type { RequestOptions } from './types/index.js';
export default class AutoContent {
    static readonly webhooks: Readonly<{
        constructEvent: (input: import("./webhooks.js").ConstructWebhookEventInput) => import("./types/index.js").WebhookEvent;
    }>;
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
    private readonly transport;
    constructor(options: AutoContentOptions);
    downloadArtifact(artifact: string | {
        url: string;
    }, options?: RequestOptions): Promise<Response>;
}
export type { AutoContentOptions } from './transport.js';
//# sourceMappingURL=client.d.ts.map