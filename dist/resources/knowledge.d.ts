import type { Transport } from '../transport.js';
import type { Collection, CollectionCreateInput, CollectionUpdateInput, MutationOptions, Page, PageOptions, RequestOptions, Source, SourceCreateInput, SourceListOptions } from '../types/index.js';
export declare class CollectionsResource {
    private readonly transport;
    constructor(transport: Transport);
    create(projectId: string, input: CollectionCreateInput, options?: MutationOptions): Promise<Collection>;
    list(projectId: string, options?: PageOptions, requestOptions?: RequestOptions): Promise<Page<Collection>>;
    update(collectionId: string, patch: CollectionUpdateInput, options?: RequestOptions): Promise<Collection>;
    delete(collectionId: string, options?: RequestOptions): Promise<void>;
}
export declare class SourcesResource {
    private readonly transport;
    constructor(transport: Transport);
    create(projectId: string, input: SourceCreateInput, options?: MutationOptions): Promise<Source>;
    list(projectId: string, options?: SourceListOptions, requestOptions?: RequestOptions): Promise<Page<Source>>;
    get(sourceId: string, options?: RequestOptions): Promise<Source>;
    refresh(sourceId: string, options?: MutationOptions): Promise<Source>;
    delete(sourceId: string, options?: RequestOptions): Promise<Source>;
}
//# sourceMappingURL=knowledge.d.ts.map