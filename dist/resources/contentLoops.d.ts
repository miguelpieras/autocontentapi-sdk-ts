import type { Transport } from '../transport.js';
import type { ContentLoop, ContentLoopCreateInput, ContentLoopListOptions, ContentLoopRun, ContentLoopRunFeedback, ContentLoopRunFeedbackInput, ContentLoopRunInput, ContentLoopRunListOptions, ContentLoopUpdateInput, MutationOptions, Page, RequestOptions } from '../types/index.js';
export declare class ContentLoopsResource {
    private readonly transport;
    constructor(transport: Transport);
    create(input: ContentLoopCreateInput, options?: MutationOptions): Promise<ContentLoop>;
    list(options?: ContentLoopListOptions, requestOptions?: RequestOptions): Promise<Page<ContentLoop>>;
    get(loopId: string, options?: RequestOptions): Promise<ContentLoop>;
    update(loopId: string, patch: ContentLoopUpdateInput, options?: MutationOptions): Promise<ContentLoop>;
    pause(loopId: string, options?: MutationOptions): Promise<ContentLoop>;
    resume(loopId: string, options?: MutationOptions): Promise<ContentLoop>;
    run(loopId: string, input: ContentLoopRunInput, options?: MutationOptions): Promise<ContentLoopRun>;
    runs(loopId: string, options?: ContentLoopRunListOptions, requestOptions?: RequestOptions): Promise<Page<ContentLoopRun>>;
    getRun(runId: string, options?: RequestOptions): Promise<ContentLoopRun>;
    feedback(runId: string, input: ContentLoopRunFeedbackInput, options?: RequestOptions): Promise<ContentLoopRunFeedback>;
    archive(loopId: string, options?: MutationOptions): Promise<ContentLoop>;
}
//# sourceMappingURL=contentLoops.d.ts.map