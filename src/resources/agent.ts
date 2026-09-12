import type { Transport } from '../transport.js';
import { InvalidRequestError } from '../errors.js';
import type {
  AgentBrowserResultInput, AgentConversation, AgentEvents, AgentPlan, AgentPlanAcceptInput,
  AgentNativeConnection, AgentNativeProvider, AgentNativeConnectInput, AgentNativeInput,
  AgentPlanInput, AgentSettingsInput, AgentTurn, AgentTurnInput, KnowledgeChunk, KnowledgeMatches,
  KnowledgeReadInput, KnowledgeSearchInput, MutationOptions, RequestOptions
} from '../types/index.js';

/** Output plans and knowledge calls are deterministic. send() uses the explicitly selected funding route. */
export class AgentResource {
  constructor(private readonly transport: Transport) {}
  conversation(options: RequestOptions = {}): Promise<AgentConversation> {
    return this.transport.request({ method: 'GET', path: '/agent/conversation', naturallyIdempotent: true, options });
  }
  connection(provider: AgentNativeProvider, options: RequestOptions = {}): Promise<AgentNativeConnection> {
    this.requireNativeOAuth();
    return this.transport.request({ method: 'GET', path: `/agent/connections/${encodeURIComponent(provider)}`, naturallyIdempotent: true, options });
  }
  connect(provider: AgentNativeProvider, input: AgentNativeConnectInput = {}, options: RequestOptions = {}): Promise<AgentNativeConnection> {
    this.requireNativeOAuth();
    return this.transport.request({ method: 'POST', path: `/agent/connections/${encodeURIComponent(provider)}/connect`, json: input, options });
  }
  connectionInput(provider: AgentNativeProvider, input: AgentNativeInput, options: RequestOptions = {}): Promise<AgentNativeConnection> {
    this.requireNativeOAuth();
    return this.transport.request({ method: 'POST', path: `/agent/connections/${encodeURIComponent(provider)}/input`, json: input, options });
  }
  disconnect(provider: AgentNativeProvider, revision: number, options: RequestOptions = {}): Promise<AgentNativeConnection> {
    this.requireNativeOAuth();
    return this.transport.request({ method: 'POST', path: `/agent/connections/${encodeURIComponent(provider)}/disconnect`, json: { expected_revision: revision }, options });
  }
  settings(input: AgentSettingsInput, options: RequestOptions = {}): Promise<Pick<AgentConversation, 'revision' | 'settings' | 'preferences'>> {
    return this.transport.request({ method: 'PATCH', path: '/agent/settings', json: input, options });
  }
  send(input: AgentTurnInput, options: MutationOptions = {}): Promise<AgentTurn> {
    return this.transport.request({ method: 'POST', path: '/agent/turns', json: input, mutation: true, options });
  }
  stop(turnId: string, options: RequestOptions = {}): Promise<AgentTurn> {
    return this.transport.request({ method: 'POST', path: `/agent/turns/${encodeURIComponent(turnId)}/cancel`, naturallyIdempotent: true, options });
  }
  events(after = '0', options: RequestOptions = {}): Promise<AgentEvents> {
    return this.transport.request({ method: 'GET', path: '/agent/events', query: { after }, naturallyIdempotent: true, options });
  }
  acknowledgeBrowserAction(input: AgentBrowserResultInput, options: RequestOptions = {}): Promise<{ status: AgentBrowserResultInput['status'] }> {
    return this.transport.request({ method: 'POST', path: '/agent/browser-actions/result', json: input, naturallyIdempotent: true, options });
  }
  prepareOutputs(input: AgentPlanInput, options: RequestOptions = {}): Promise<AgentPlan> {
    return this.transport.request({ method: 'POST', path: '/agent/plans/preview', json: input, options });
  }
  getOutputs(planId: string, options: RequestOptions = {}): Promise<AgentPlan> {
    return this.transport.request({ method: 'GET', path: `/agent/plans/${encodeURIComponent(planId)}`, naturallyIdempotent: true, options });
  }
  acceptOutputs(planId: string, input: AgentPlanAcceptInput, options: RequestOptions = {}): Promise<AgentPlan> {
    return this.transport.request({ method: 'POST', path: `/agent/plans/${encodeURIComponent(planId)}/accept`, json: input, naturallyIdempotent: true, options });
  }
  cancelOutputs(planId: string, options: RequestOptions = {}): Promise<AgentPlan> {
    return this.transport.request({ method: 'POST', path: `/agent/plans/${encodeURIComponent(planId)}/cancel`, naturallyIdempotent: true, options });
  }
  searchKnowledge(input: KnowledgeSearchInput, options: RequestOptions = {}): Promise<KnowledgeMatches> {
    return this.transport.request({ method: 'POST', path: '/agent/knowledge/search', json: input, naturallyIdempotent: true, options });
  }
  readSourceChunk(input: KnowledgeReadInput, options: RequestOptions = {}): Promise<KnowledgeChunk> {
    return this.transport.request({ method: 'POST', path: '/agent/knowledge/read', json: input, naturallyIdempotent: true, options });
  }
  private requireNativeOAuth(): void {
    if (this.transport.authKind === 'oauth') return;
    throw new InvalidRequestError({ code: 'invalid_request', status: 0, correlation_id: null, doc_url: null,
      message: 'Native provider connections require the owning user’s OAuth session.' });
  }

}
