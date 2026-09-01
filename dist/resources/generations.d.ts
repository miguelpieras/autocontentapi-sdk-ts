import type { Transport } from '../transport.js';
import type { Generation, GenerationCreateRequest, GenerationDraft, GenerationEditDraft, GenerationEditPreview, GenerationEditRequest, GenerationListOptions, GenerationPreview, MutationOptions, Page, RequestOptions, WaitOptions } from '../types/index.js';
export declare class GenerationsResource {
    private readonly transport;
    constructor(transport: Transport);
    preview(input: GenerationDraft, options?: RequestOptions): Promise<GenerationPreview>;
    create(input: GenerationCreateRequest, options?: MutationOptions): Promise<Generation>;
    list(options?: GenerationListOptions, requestOptions?: RequestOptions): Promise<Page<Generation>>;
    get(generationId: string, options?: RequestOptions): Promise<Generation>;
    wait(generationId: string, options?: WaitOptions): Promise<Generation>;
    cancel(generationId: string, options?: RequestOptions): Promise<Generation>;
    previewEdit(generationId: string, input: GenerationEditDraft, options?: RequestOptions): Promise<GenerationEditPreview>;
    edit(generationId: string, input: GenerationEditRequest, options?: MutationOptions): Promise<Generation>;
}
//# sourceMappingURL=generations.d.ts.map