import type { Transport } from '../transport.js';
import type {
  Collection,
  CollectionCreateInput,
  CollectionUpdateInput,
  MutationOptions,
  Page,
  PageOptions,
  RequestOptions,
  Source,
  SourceCreateInput,
  SourceListOptions
} from '../types/index.js';

export class CollectionsResource {
  constructor(private readonly transport: Transport) {}

  create(projectId: string, input: CollectionCreateInput, options: MutationOptions = {}): Promise<Collection> {
    return this.transport.request({
      method: 'POST',
      path: `/projects/${encodeURIComponent(projectId)}/collections`,
      json: input,
      mutation: true,
      options
    });
  }

  list(projectId: string, options: PageOptions = {}, requestOptions: RequestOptions = {}): Promise<Page<Collection>> {
    return this.transport.request({
      method: 'GET',
      path: `/projects/${encodeURIComponent(projectId)}/collections`,
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  update(collectionId: string, patch: CollectionUpdateInput, options: RequestOptions = {}): Promise<Collection> {
    return this.transport.request({
      method: 'PATCH',
      path: `/collections/${encodeURIComponent(collectionId)}`,
      json: patch,
      naturallyIdempotent: true,
      options
    });
  }

  delete(collectionId: string, options: RequestOptions = {}): Promise<void> {
    return this.transport.request({
      method: 'DELETE',
      path: `/collections/${encodeURIComponent(collectionId)}`,
      naturallyIdempotent: true,
      options
    });
  }
}

export class SourcesResource {
  constructor(private readonly transport: Transport) {}

  create(projectId: string, input: SourceCreateInput, options: MutationOptions = {}): Promise<Source> {
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

  list(
    projectId: string,
    options: SourceListOptions = {},
    requestOptions: RequestOptions = {}
  ): Promise<Page<Source>> {
    return this.transport.request({
      method: 'GET',
      path: `/projects/${encodeURIComponent(projectId)}/sources`,
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  get(sourceId: string, options: RequestOptions = {}): Promise<Source> {
    return this.transport.request({
      method: 'GET',
      path: `/sources/${encodeURIComponent(sourceId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  refresh(sourceId: string, options: MutationOptions = {}): Promise<Source> {
    return this.transport.request({
      method: 'POST',
      path: `/sources/${encodeURIComponent(sourceId)}/refresh`,
      mutation: true,
      options
    });
  }

  delete(sourceId: string, options: RequestOptions = {}): Promise<Source> {
    return this.transport.request({
      method: 'DELETE',
      path: `/sources/${encodeURIComponent(sourceId)}`,
      naturallyIdempotent: true,
      options
    });
  }
}
