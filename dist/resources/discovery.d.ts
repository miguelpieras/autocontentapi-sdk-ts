import type { Transport } from '../transport.js';
import type { AssetTypeDefinition, Avatar, AvatarCreateInput, AvatarListOptions, CatalogPage, Model, ModelListOptions, MutationOptions, Page, PageOptions, RequestOptions, Voice, VoiceCreateInput, VoiceListOptions } from '../types/index.js';
export declare class AssetTypesResource {
    private readonly transport;
    constructor(transport: Transport);
    list(options?: PageOptions, requestOptions?: RequestOptions): Promise<CatalogPage<AssetTypeDefinition>>;
}
export declare class ModelsResource {
    private readonly transport;
    constructor(transport: Transport);
    list(options: ModelListOptions, requestOptions?: RequestOptions): Promise<CatalogPage<Model>>;
}
export declare class VoicesResource {
    private readonly transport;
    constructor(transport: Transport);
    list(options: VoiceListOptions, requestOptions?: RequestOptions): Promise<Page<Voice>>;
    create(projectId: string, input: VoiceCreateInput, options?: MutationOptions): Promise<Voice>;
    get(voiceId: string, options?: RequestOptions): Promise<Voice>;
    delete(voiceId: string, options?: RequestOptions): Promise<Voice>;
}
export declare class AvatarsResource {
    private readonly transport;
    constructor(transport: Transport);
    list(options: AvatarListOptions, requestOptions?: RequestOptions): Promise<Page<Avatar>>;
    create(projectId: string, input: AvatarCreateInput, options?: MutationOptions): Promise<Avatar>;
    get(avatarId: string, options?: RequestOptions): Promise<Avatar>;
    delete(avatarId: string, options?: RequestOptions): Promise<Avatar>;
}
//# sourceMappingURL=discovery.d.ts.map