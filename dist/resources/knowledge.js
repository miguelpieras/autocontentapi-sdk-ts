export class CollectionsResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    create(projectId, input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/projects/${encodeURIComponent(projectId)}/collections`,
            json: input,
            mutation: true,
            options
        });
    }
    list(projectId, options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/projects/${encodeURIComponent(projectId)}/collections`,
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    update(collectionId, patch, options = {}) {
        return this.transport.request({
            method: 'PATCH',
            path: `/collections/${encodeURIComponent(collectionId)}`,
            json: patch,
            naturallyIdempotent: true,
            options
        });
    }
    delete(collectionId, options = {}) {
        return this.transport.request({
            method: 'DELETE',
            path: `/collections/${encodeURIComponent(collectionId)}`,
            naturallyIdempotent: true,
            options
        });
    }
}
export class SourcesResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    create(projectId, input, options = {}) {
        const path = `/projects/${encodeURIComponent(projectId)}/sources`;
        if ('file' in input) {
            return this.transport.request({
                method: 'POST',
                path,
                multipart: {
                    file: input.file,
                    ...(input.filename === undefined ? {} : { filename: input.filename }),
                    ...(input.content_type === undefined ? {} : { contentType: input.content_type }),
                    fields: {
                        collection_id: input.collection_id,
                        title: input.title,
                        keep_as_project_asset: input.keep_as_project_asset
                    }
                },
                mutation: true,
                options
            });
        }
        return this.transport.request({ method: 'POST', path, json: input, mutation: true, options });
    }
    list(projectId, options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/projects/${encodeURIComponent(projectId)}/sources`,
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    get(sourceId, options = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/sources/${encodeURIComponent(sourceId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    refresh(sourceId, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/sources/${encodeURIComponent(sourceId)}/refresh`,
            mutation: true,
            options
        });
    }
    delete(sourceId, options = {}) {
        return this.transport.request({
            method: 'DELETE',
            path: `/sources/${encodeURIComponent(sourceId)}`,
            naturallyIdempotent: true,
            options
        });
    }
}
//# sourceMappingURL=knowledge.js.map