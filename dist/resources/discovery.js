export class AssetTypesResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    list(options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/asset-types',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
}
export class ModelsResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    list(options, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/models',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
}
export class VoicesResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    list(options, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/voices',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    create(projectId, input, options = {}) {
        const path = `/projects/${encodeURIComponent(projectId)}/voices`;
        if ('file' in input) {
            return this.transport.request({
                method: 'POST',
                path,
                multipart: uploadMultipart(input),
                mutation: true,
                options
            });
        }
        return this.transport.request({ method: 'POST', path, json: input, mutation: true, options });
    }
    get(voiceId, options = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/voices/${encodeURIComponent(voiceId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    delete(voiceId, options = {}) {
        return this.transport.request({
            method: 'DELETE',
            path: `/voices/${encodeURIComponent(voiceId)}`,
            naturallyIdempotent: true,
            options
        });
    }
}
export class AvatarsResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    list(options, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/avatars',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    create(projectId, input, options = {}) {
        const path = `/projects/${encodeURIComponent(projectId)}/avatars`;
        if ('file' in input) {
            return this.transport.request({
                method: 'POST',
                path,
                multipart: uploadMultipart(input),
                mutation: true,
                options
            });
        }
        return this.transport.request({ method: 'POST', path, json: input, mutation: true, options });
    }
    get(avatarId, options = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/avatars/${encodeURIComponent(avatarId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    delete(avatarId, options = {}) {
        return this.transport.request({
            method: 'DELETE',
            path: `/avatars/${encodeURIComponent(avatarId)}`,
            naturallyIdempotent: true,
            options
        });
    }
}
const uploadMultipart = (input) => {
    if (!('file' in input))
        throw new TypeError('Expected a file upload.');
    return {
        file: input.file,
        ...(input.filename === undefined ? {} : { filename: input.filename }),
        ...(input.content_type === undefined ? {} : { contentType: input.content_type }),
        fields: {
            display_name: input.display_name,
            consent_attested: input.consent_attested,
            ownership_attested: input.ownership_attested
        }
    };
};
//# sourceMappingURL=discovery.js.map