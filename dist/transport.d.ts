import type { MutationOptions, RequestOptions, UploadSource } from './types/index.js';
export interface AutoContentOptions {
    apiKey?: string | undefined;
    getAccessToken?: (() => string | Promise<string>) | undefined;
    baseUrl?: string | undefined;
    requestTimeoutMs?: number | undefined;
    fetch?: typeof globalThis.fetch | undefined;
}
export interface MultipartInput {
    file: UploadSource;
    filename?: string;
    contentType?: string;
    fields?: Record<string, string | boolean | undefined>;
}
interface TransportRequest {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    query?: object;
    json?: unknown;
    multipart?: MultipartInput;
    mutation?: boolean;
    naturallyIdempotent?: boolean;
    options?: MutationOptions;
}
export declare class Transport {
    readonly authKind: 'apiKey' | 'oauth';
    readonly baseUrl: string;
    private readonly apiKey;
    private readonly getAccessToken;
    private readonly defaultRequestTimeoutMs;
    private readonly fetchFn;
    constructor(options: AutoContentOptions);
    request<T>(request: TransportRequest): Promise<T>;
    download(url: string, options?: RequestOptions): Promise<Response>;
    private accessToken;
}
export {};
//# sourceMappingURL=transport.d.ts.map