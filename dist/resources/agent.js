/** Output plans and knowledge calls are deterministic; only send() requests managed inference. */
export class AgentResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    conversation(options = {}) {
        return this.transport.request({ method: 'GET', path: '/agent/conversation', naturallyIdempotent: true, options });
    }
    settings(input, options = {}) {
        return this.transport.request({ method: 'PATCH', path: '/agent/settings', json: input, options });
    }
    send(input, options = {}) {
        return this.transport.request({ method: 'POST', path: '/agent/turns', json: input, mutation: true, options });
    }
    stop(turnId, options = {}) {
        return this.transport.request({ method: 'POST', path: `/agent/turns/${encodeURIComponent(turnId)}/cancel`, naturallyIdempotent: true, options });
    }
    events(after = '0', options = {}) {
        return this.transport.request({ method: 'GET', path: '/agent/events', query: { after }, naturallyIdempotent: true, options });
    }
    acknowledgeBrowserAction(input, options = {}) {
        return this.transport.request({ method: 'POST', path: '/agent/browser-actions/result', json: input, naturallyIdempotent: true, options });
    }
    prepareOutputs(input, options = {}) {
        return this.transport.request({ method: 'POST', path: '/agent/plans/preview', json: input, options });
    }
    getOutputs(planId, options = {}) {
        return this.transport.request({ method: 'GET', path: `/agent/plans/${encodeURIComponent(planId)}`, naturallyIdempotent: true, options });
    }
    acceptOutputs(planId, input, options = {}) {
        return this.transport.request({ method: 'POST', path: `/agent/plans/${encodeURIComponent(planId)}/accept`, json: input, naturallyIdempotent: true, options });
    }
    cancelOutputs(planId, options = {}) {
        return this.transport.request({ method: 'POST', path: `/agent/plans/${encodeURIComponent(planId)}/cancel`, naturallyIdempotent: true, options });
    }
    searchKnowledge(input, options = {}) {
        return this.transport.request({ method: 'POST', path: '/agent/knowledge/search', json: input, naturallyIdempotent: true, options });
    }
    readSourceChunk(input, options = {}) {
        return this.transport.request({ method: 'POST', path: '/agent/knowledge/read', json: input, naturallyIdempotent: true, options });
    }
}
//# sourceMappingURL=agent.js.map