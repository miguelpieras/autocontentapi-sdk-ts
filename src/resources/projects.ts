import { waitForResource } from '../polling.js';
import type { Transport } from '../transport.js';
import type {
  LogoInput,
  MutationOptions,
  Page,
  Project,
  ProjectCreateAccepted,
  ProjectCreateInput,
  ProjectListOptions,
  ProjectUpdateInput,
  RequestOptions,
  WaitOptions
} from '../types/index.js';

export class ProjectsResource {
  constructor(private readonly transport: Transport) {}

  create(input: ProjectCreateInput, options: MutationOptions = {}): Promise<ProjectCreateAccepted> {
    return this.transport.request({
      method: 'POST',
      path: '/projects',
      json: input,
      mutation: true,
      options
    });
  }

  list(options: ProjectListOptions = {}, requestOptions: RequestOptions = {}): Promise<Page<Project>> {
    return this.transport.request({
      method: 'GET',
      path: '/projects',
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  get(projectId: string, options: RequestOptions = {}): Promise<Project> {
    return this.transport.request({
      method: 'GET',
      path: `/projects/${encodeURIComponent(projectId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  wait(projectId: string, options: WaitOptions = {}): Promise<Project> {
    return waitForResource({
      resourceType: 'project',
      resourceId: projectId,
      get: () => this.get(projectId, requestOptions(options)),
      isTerminal: project => ['needs_review', 'ready', 'failed', 'archived'].includes(project.status),
      options
    });
  }

  update(projectId: string, patch: ProjectUpdateInput, options: MutationOptions = {}): Promise<Project> {
    return this.transport.request({
      method: 'PATCH',
      path: `/projects/${encodeURIComponent(projectId)}`,
      json: patch,
      mutation: true,
      options
    });
  }

  refresh(projectId: string, options: MutationOptions = {}): Promise<Project> {
    return this.transport.request({
      method: 'POST',
      path: `/projects/${encodeURIComponent(projectId)}/refresh`,
      mutation: true,
      options
    });
  }

  archive(projectId: string, options: RequestOptions = {}): Promise<Project> {
    return this.transport.request({
      method: 'DELETE',
      path: `/projects/${encodeURIComponent(projectId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  setLogo(projectId: string, input: LogoInput, options: MutationOptions = {}): Promise<Project> {
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

  deleteLogo(projectId: string, options: RequestOptions = {}): Promise<Project> {
    return this.transport.request({
      method: 'DELETE',
      path: `/projects/${encodeURIComponent(projectId)}/logo`,
      naturallyIdempotent: true,
      options
    });
  }
}

const requestOptions = (options: WaitOptions): RequestOptions => ({
  ...(options.requestTimeoutMs === undefined ? {} : { requestTimeoutMs: options.requestTimeoutMs }),
  ...(options.signal === undefined ? {} : { signal: options.signal })
});
