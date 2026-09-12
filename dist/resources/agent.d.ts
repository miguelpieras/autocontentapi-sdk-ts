import type { Transport } from '../transport.js';
import type { AgentBrowserResultInput, AgentConversation, AgentEvents, AgentPlan, AgentPlanAcceptInput, AgentNativeConnection, AgentNativeProvider, AgentNativeConnectInput, AgentNativeInput, AgentPlanInput, AgentSettingsInput, AgentTurn, AgentTurnInput, KnowledgeChunk, KnowledgeMatches, KnowledgeReadInput, KnowledgeSearchInput, MutationOptions, RequestOptions } from '../types/index.js';
/** Output plans and knowledge calls are deterministic. send() uses the explicitly selected funding route. */
export declare class AgentResource {
    private readonly transport;
    constructor(transport: Transport);
    conversation(options?: RequestOptions): Promise<AgentConversation>;
    connection(provider: AgentNativeProvider, options?: RequestOptions): Promise<AgentNativeConnection>;
    connect(provider: AgentNativeProvider, input?: AgentNativeConnectInput, options?: RequestOptions): Promise<AgentNativeConnection>;
    connectionInput(provider: AgentNativeProvider, input: AgentNativeInput, options?: RequestOptions): Promise<AgentNativeConnection>;
    disconnect(provider: AgentNativeProvider, revision: number, options?: RequestOptions): Promise<AgentNativeConnection>;
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
    private requireNativeOAuth;
}
//# sourceMappingURL=agent.d.ts.map