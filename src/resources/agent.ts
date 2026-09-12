import type { Transport } from '../transport.js';
import type {
  AgentBrowserResultInput, AgentConversation, AgentEvents, AgentPlan, AgentPlanAcceptInput,
  AgentPlanInput, AgentSettingsInput, AgentTurn, AgentTurnInput, KnowledgeChunk, KnowledgeMatches,
  KnowledgeReadInput, KnowledgeSearchInput, MutationOptions, RequestOptions
} from '../types/index.js';

/** Output plans and knowledge calls are deterministic; only send() requests managed inference. */
export class AgentResource {
  constructor(private readonly transport: Transport) {}
  conversation(options: RequestOptions = {}): Promise<AgentConversation> {
    return this.transport.request({ method: 'GET', path: '/agent/conversation', naturallyIdempotent: true, options });
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
}
