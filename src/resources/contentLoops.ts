import type { Transport } from '../transport.js';
import type {
  ContentLoop,
  ContentLoopCreateInput,
  ContentLoopListOptions,
  ContentLoopRun,
  ContentLoopRunFeedback,
  ContentLoopRunFeedbackInput,
  ContentLoopRunInput,
  ContentLoopRunListOptions,
  ContentLoopUpdateInput,
  MutationOptions,
  Page,
  RequestOptions
} from '../types/index.js';

export class ContentLoopsResource {
  constructor(private readonly transport: Transport) {}

  create(input: ContentLoopCreateInput, options: MutationOptions = {}): Promise<ContentLoop> {
    return this.transport.request({
      method: 'POST',
      path: '/content-loops',
      json: input,
      mutation: true,
      options
    });
  }

  list(options: ContentLoopListOptions = {}, requestOptions: RequestOptions = {}): Promise<Page<ContentLoop>> {
    return this.transport.request({
      method: 'GET',
      path: '/content-loops',
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  get(loopId: string, options: RequestOptions = {}): Promise<ContentLoop> {
    return this.transport.request({
      method: 'GET',
      path: `/content-loops/${encodeURIComponent(loopId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  update(loopId: string, patch: ContentLoopUpdateInput, options: MutationOptions = {}): Promise<ContentLoop> {
    return this.transport.request({
      method: 'PATCH',
      path: `/content-loops/${encodeURIComponent(loopId)}`,
      json: patch,
      mutation: true,
      options
    });
  }

  pause(loopId: string, options: MutationOptions = {}): Promise<ContentLoop> {
    return this.update(loopId, { status: 'paused' }, options);
  }

  resume(loopId: string, options: MutationOptions = {}): Promise<ContentLoop> {
    return this.update(loopId, { status: 'active' }, options);
  }

  run(loopId: string, input: ContentLoopRunInput, options: MutationOptions = {}): Promise<ContentLoopRun> {
    return this.transport.request({
      method: 'POST',
      path: `/content-loops/${encodeURIComponent(loopId)}/run`,
      json: input,
      mutation: true,
      options
    });
  }

  runs(
    loopId: string,
    options: ContentLoopRunListOptions = {},
    requestOptions: RequestOptions = {}
  ): Promise<Page<ContentLoopRun>> {
    return this.transport.request({
      method: 'GET',
      path: `/content-loops/${encodeURIComponent(loopId)}/runs`,
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  getRun(runId: string, options: RequestOptions = {}): Promise<ContentLoopRun> {
    return this.transport.request({
      method: 'GET',
      path: `/content-loop-runs/${encodeURIComponent(runId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  feedback(
    runId: string,
    input: ContentLoopRunFeedbackInput,
    options: RequestOptions = {}
  ): Promise<ContentLoopRunFeedback> {
    return this.transport.request({
      method: 'POST',
      path: `/content-loop-runs/${encodeURIComponent(runId)}/feedback`,
      json: input,
      naturallyIdempotent: true,
      options
    });
  }

  archive(loopId: string, options: MutationOptions = {}): Promise<ContentLoop> {
    return this.transport.request({
      method: 'DELETE',
      path: `/content-loops/${encodeURIComponent(loopId)}`,
      mutation: true,
      options
    });
  }
}
