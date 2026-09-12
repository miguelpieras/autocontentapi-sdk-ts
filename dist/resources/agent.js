import { InvalidRequestError } from '../errors.js';
/** Output plans and knowledge calls are deterministic. send() uses the explicitly selected funding route. */
export class AgentResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    conversation(options = {}) {
        return this.transport.request({ method: 'GET', path: '/agent/conversation', naturallyIdempotent: true, options });
    }
    connection(provider, options = {}) {
        this.requireNativeOAuth();
        return this.transport.request({ method: 'GET', path: `/agent/connections/${encodeURIComponent(provider)}`, naturallyIdempotent: true, options });
    }
    connect(provider, input = {}, options = {}) {
        this.requireNativeOAuth();
        return this.transport.request({ method: 'POST', path: `/agent/connections/${encodeURIComponent(provider)}/connect`, json: input, options });
    }
    connectionInput(provider, input, options = {}) {
        this.requireNativeOAuth();
        return this.transport.request({ method: 'POST', path: `/agent/connections/${encodeURIComponent(provider)}/input`, json: input, options });
    }
    disconnect(provider, revision, options = {}) {
        this.requireNativeOAuth();
        return this.transport.request({ method: 'POST', path: `/agent/connections/${encodeURIComponent(provider)}/disconnect`, json: { expected_revision: revision }, options });
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
    requireNativeOAuth() {
        if (this.transport.authKind === 'oauth')
            return;
        throw new InvalidRequestError({ code: 'invalid_request', status: 0, correlation_id: null, doc_url: null,
            message: 'Native provider connections require the owning user’s OAuth session.' });
    }
}
//# sourceMappingURL=agent.js.map