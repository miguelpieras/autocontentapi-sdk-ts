import type { Transport } from '../transport.js';
import type { Asset, AssetFeedback, AssetFeedbackInput, AssetListOptions, Page, RequestOptions } from '../types/index.js';
export declare class AssetsResource {
    private readonly transport;
    constructor(transport: Transport);
    list(options?: AssetListOptions, requestOptions?: RequestOptions): Promise<Page<Asset>>;
    get(assetId: string, options?: RequestOptions): Promise<Asset>;
    feedback(assetId: string, input: AssetFeedbackInput, options?: RequestOptions): Promise<AssetFeedback>;
}
//# sourceMappingURL=assets.d.ts.map