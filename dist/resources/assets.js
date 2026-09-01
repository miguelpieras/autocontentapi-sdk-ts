export class AssetsResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    list(options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/assets',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    get(assetId, options = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/assets/${encodeURIComponent(assetId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    feedback(assetId, input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/assets/${encodeURIComponent(assetId)}/feedback`,
            json: input,
            naturallyIdempotent: true,
            options
        });
    }
}
//# sourceMappingURL=assets.js.map