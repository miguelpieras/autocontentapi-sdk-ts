export class ContentLoopsResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    create(input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: '/content-loops',
            json: input,
            mutation: true,
            options
        });
    }
    list(options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/content-loops',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    get(loopId, options = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/content-loops/${encodeURIComponent(loopId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    update(loopId, patch, options = {}) {
        return this.transport.request({
            method: 'PATCH',
            path: `/content-loops/${encodeURIComponent(loopId)}`,
            json: patch,
            mutation: true,
            options
        });
    }
    pause(loopId, options = {}) {
        return this.update(loopId, { status: 'paused' }, options);
    }
    resume(loopId, options = {}) {
        return this.update(loopId, { status: 'active' }, options);
    }
    run(loopId, input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/content-loops/${encodeURIComponent(loopId)}/run`,
            json: input,
            mutation: true,
            options
        });
    }
    runs(loopId, options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/content-loops/${encodeURIComponent(loopId)}/runs`,
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    getRun(runId, options = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/content-loop-runs/${encodeURIComponent(runId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    feedback(runId, input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/content-loop-runs/${encodeURIComponent(runId)}/feedback`,
            json: input,
            naturallyIdempotent: true,
            options
        });
    }
    archive(loopId, options = {}) {
        return this.transport.request({
            method: 'DELETE',
            path: `/content-loops/${encodeURIComponent(loopId)}`,
            mutation: true,
            options
        });
    }
}
//# sourceMappingURL=contentLoops.js.map