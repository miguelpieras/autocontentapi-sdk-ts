import type { Transport } from '../transport.js';
import type { AgentBrowserResultInput, AgentConversation, AgentEvents, AgentPlan, AgentPlanAcceptInput, AgentPlanInput, AgentSettingsInput, AgentTurn, AgentTurnInput, KnowledgeChunk, KnowledgeMatches, KnowledgeReadInput, KnowledgeSearchInput, MutationOptions, RequestOptions } from '../types/index.js';
/** Output plans and knowledge calls are deterministic; only send() requests managed inference. */
export declare class AgentResource {
    private readonly transport;
    constructor(transport: Transport);
    conversation(options?: RequestOptions): Promise<AgentConversation>;
    settings(input: AgentSettingsInput, options?: RequestOptions): Promise<Pick<AgentConversation, 'revision' | 'settings' | 'preferences'>>;
    send(input: AgentTurnInput, options?: MutationOptions): Promise<AgentTurn>;
    stop(turnId: string, options?: RequestOptions): Promise<AgentTurn>;
    events(after?: string, options?: RequestOptions): Promise<AgentEvents>;
    acknowledgeBrowserAction(input: AgentBrowserResultInput, options?: RequestOptions): Promise<{
        status: AgentBrowserResultInput['status'];
    }>;
    prepareOutputs(input: AgentPlanInput, options?: RequestOptions): Promise<AgentPlan>;
    getOutputs(planId: string, options?: RequestOptions): Promise<AgentPlan>;
    acceptOutputs(planId: string, input: AgentPlanAcceptInput, options?: RequestOptions): Promise<AgentPlan>;
    cancelOutputs(planId: string, options?: RequestOptions): Promise<AgentPlan>;
    searchKnowledge(input: KnowledgeSearchInput, options?: RequestOptions): Promise<KnowledgeMatches>;
    readSourceChunk(input: KnowledgeReadInput, options?: RequestOptions): Promise<KnowledgeChunk>;
}
//# sourceMappingURL=agent.d.ts.map