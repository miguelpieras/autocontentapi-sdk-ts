import { waitForResource } from '../polling.js';
export class GenerationsResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    preview(input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: '/generations/preview',
            json: input,
            naturallyIdempotent: true,
            options
        });
    }
    create(input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: '/generations',
            json: input,
            mutation: true,
            options
        });
    }
    list(options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/generations',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    get(generationId, options = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/generations/${encodeURIComponent(generationId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    wait(generationId, options = {}) {
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
    cancel(generationId, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/generations/${encodeURIComponent(generationId)}/cancel`,
            naturallyIdempotent: true,
            options
        });
    }
    previewEdit(generationId, input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/generations/${encodeURIComponent(generationId)}/edit/preview`,
            json: input,
            naturallyIdempotent: true,
            options
        });
    }
    edit(generationId, input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/generations/${encodeURIComponent(generationId)}/edit`,
            json: input,
            mutation: true,
            options
        });
    }
}
const requestOptions = (options) => ({
    ...(options.requestTimeoutMs === undefined ? {} : { requestTimeoutMs: options.requestTimeoutMs }),
    ...(options.signal === undefined ? {} : { signal: options.signal })
});
//# sourceMappingURL=generations.js.map