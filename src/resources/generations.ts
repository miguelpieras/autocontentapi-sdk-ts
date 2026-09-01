import { waitForResource } from '../polling.js';
import type { Transport } from '../transport.js';
import type {
  Generation,
  GenerationCreateRequest,
  GenerationDraft,
  GenerationEditDraft,
  GenerationEditPreview,
  GenerationEditRequest,
  GenerationListOptions,
  GenerationPreview,
  MutationOptions,
  Page,
  RequestOptions,
  WaitOptions
} from '../types/index.js';

export class GenerationsResource {
  constructor(private readonly transport: Transport) {}

  preview(input: GenerationDraft, options: RequestOptions = {}): Promise<GenerationPreview> {
    return this.transport.request({
      method: 'POST',
      path: '/generations/preview',
      json: input,
      naturallyIdempotent: true,
      options
    });
  }

  create(input: GenerationCreateRequest, options: MutationOptions = {}): Promise<Generation> {
    return this.transport.request({
      method: 'POST',
      path: '/generations',
      json: input,
      mutation: true,
      options
    });
  }

  list(options: GenerationListOptions = {}, requestOptions: RequestOptions = {}): Promise<Page<Generation>> {
    return this.transport.request({
      method: 'GET',
      path: '/generations',
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  get(generationId: string, options: RequestOptions = {}): Promise<Generation> {
    return this.transport.request({
      method: 'GET',
      path: `/generations/${encodeURIComponent(generationId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  wait(generationId: string, options: WaitOptions = {}): Promise<Generation> {
    return waitForResource({
      resourceType: 'generation',
      resourceId: generationId,
      get: () => this.get(generationId, requestOptions(options)),
      isTerminal: generation => [
        'succeeded',
        'partially_succeeded',
        'failed',
        'cancelled'
      ].includes(generation.status),
      options
    });
  }

  cancel(generationId: string, options: RequestOptions = {}): Promise<Generation> {
    return this.transport.request({
      method: 'POST',
      path: `/generations/${encodeURIComponent(generationId)}/cancel`,
      naturallyIdempotent: true,
      options
    });
  }

  previewEdit(
    generationId: string,
    input: GenerationEditDraft,
    options: RequestOptions = {}
  ): Promise<GenerationEditPreview> {
    return this.transport.request({
      method: 'POST',
      path: `/generations/${encodeURIComponent(generationId)}/edit/preview`,
      json: input,
      naturallyIdempotent: true,
      options
    });
  }

  edit(
    generationId: string,
    input: GenerationEditRequest,
    options: MutationOptions = {}
  ): Promise<Generation> {
    return this.transport.request({
      method: 'POST',
      path: `/generations/${encodeURIComponent(generationId)}/edit`,
      json: input,
      mutation: true,
      options
    });
  }
}

const requestOptions = (options: WaitOptions): RequestOptions => ({
  ...(options.requestTimeoutMs === undefined ? {} : { requestTimeoutMs: options.requestTimeoutMs }),
  ...(options.signal === undefined ? {} : { signal: options.signal })
});
