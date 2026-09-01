import type { Transport } from '../transport.js';
import type {
  Asset,
  AssetFeedback,
  AssetFeedbackInput,
  AssetListOptions,
  Page,
  RequestOptions
} from '../types/index.js';

export class AssetsResource {
  constructor(private readonly transport: Transport) {}

  list(options: AssetListOptions = {}, requestOptions: RequestOptions = {}): Promise<Page<Asset>> {
    return this.transport.request({
      method: 'GET',
      path: '/assets',
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  get(assetId: string, options: RequestOptions = {}): Promise<Asset> {
    return this.transport.request({
      method: 'GET',
      path: `/assets/${encodeURIComponent(assetId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  feedback(assetId: string, input: AssetFeedbackInput, options: RequestOptions = {}): Promise<AssetFeedback> {
    return this.transport.request({
      method: 'POST',
      path: `/assets/${encodeURIComponent(assetId)}/feedback`,
      json: input,
      naturallyIdempotent: true,
      options
    });
  }
}
