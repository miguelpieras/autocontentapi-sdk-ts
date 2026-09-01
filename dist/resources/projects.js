import { waitForResource } from '../polling.js';
export class ProjectsResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    create(input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: '/projects',
            json: input,
            mutation: true,
            options
        });
    }
    list(options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/projects',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    get(projectId, options = {}) {
        return this.transport.request({
            method: 'GET',
            path: `/projects/${encodeURIComponent(projectId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    wait(projectId, options = {}) {
        return waitForResource({
            resourceType: 'project',
            resourceId: projectId,
            get: () => this.get(projectId, requestOptions(options)),
            isTerminal: project => ['needs_review', 'ready', 'failed', 'archived'].includes(project.status),
            options
        });
    }
    update(projectId, patch, options = {}) {
        return this.transport.request({
            method: 'PATCH',
            path: `/projects/${encodeURIComponent(projectId)}`,
            json: patch,
            mutation: true,
            options
        });
    }
    refresh(projectId, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: `/projects/${encodeURIComponent(projectId)}/refresh`,
            mutation: true,
            options
        });
    }
    archive(projectId, options = {}) {
        return this.transport.request({
            method: 'DELETE',
            path: `/projects/${encodeURIComponent(projectId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    setLogo(projectId, input, options = {}) {
        const path = `/projects/${encodeURIComponent(projectId)}/logo`;
        if ('file' in input) {
            return this.transport.request({
                method: 'PUT',
                path,
                multipart: {
                    file: input.file,
                    ...(input.filename === undefined ? {} : { filename: input.filename }),
                    ...(input.content_type === undefined ? {} : { contentType: input.content_type })
                },
                mutation: true,
                options
            });
        }
        return this.transport.request({ method: 'PUT', path, json: input, mutation: true, options });
    }
    deleteLogo(projectId, options = {}) {
        return this.transport.request({
            method: 'DELETE',
            path: `/projects/${encodeURIComponent(projectId)}/logo`,
            naturallyIdempotent: true,
            options
        });
    }
}
const requestOptions = (options) => ({
    ...(options.requestTimeoutMs === undefined ? {} : { requestTimeoutMs: options.requestTimeoutMs }),
    ...(options.signal === undefined ? {} : { signal: options.signal })
});
//# sourceMappingURL=projects.js.map