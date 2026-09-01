import type { Transport } from '../transport.js';
import type {
  AssetTypeDefinition,
  Avatar,
  AvatarCreateInput,
  AvatarListOptions,
  CatalogPage,
  Model,
  ModelListOptions,
  MutationOptions,
  Page,
  PageOptions,
  RequestOptions,
  Voice,
  VoiceCreateInput,
  VoiceListOptions
} from '../types/index.js';

export class AssetTypesResource {
  constructor(private readonly transport: Transport) {}

  list(options: PageOptions = {}, requestOptions: RequestOptions = {}): Promise<CatalogPage<AssetTypeDefinition>> {
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
  constructor(private readonly transport: Transport) {}

  list(options: ModelListOptions, requestOptions: RequestOptions = {}): Promise<CatalogPage<Model>> {
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
  constructor(private readonly transport: Transport) {}

  list(options: VoiceListOptions, requestOptions: RequestOptions = {}): Promise<Page<Voice>> {
    return this.transport.request({
      method: 'GET',
      path: '/voices',
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  create(projectId: string, input: VoiceCreateInput, options: MutationOptions = {}): Promise<Voice> {
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

  get(voiceId: string, options: RequestOptions = {}): Promise<Voice> {
    return this.transport.request({
      method: 'GET',
      path: `/voices/${encodeURIComponent(voiceId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  delete(voiceId: string, options: RequestOptions = {}): Promise<Voice> {
    return this.transport.request({
      method: 'DELETE',
      path: `/voices/${encodeURIComponent(voiceId)}`,
      naturallyIdempotent: true,
      options
    });
  }
}

export class AvatarsResource {
  constructor(private readonly transport: Transport) {}

  list(options: AvatarListOptions, requestOptions: RequestOptions = {}): Promise<Page<Avatar>> {
    return this.transport.request({
      method: 'GET',
      path: '/avatars',
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  create(projectId: string, input: AvatarCreateInput, options: MutationOptions = {}): Promise<Avatar> {
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

  get(avatarId: string, options: RequestOptions = {}): Promise<Avatar> {
    return this.transport.request({
      method: 'GET',
      path: `/avatars/${encodeURIComponent(avatarId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  delete(avatarId: string, options: RequestOptions = {}): Promise<Avatar> {
    return this.transport.request({
      method: 'DELETE',
      path: `/avatars/${encodeURIComponent(avatarId)}`,
      naturallyIdempotent: true,
      options
    });
  }
}

const uploadMultipart = (input: VoiceCreateInput | AvatarCreateInput) => {
  if (!('file' in input)) throw new TypeError('Expected a file upload.');
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
