import type { Transport } from '../transport.js';
import type { Account, ApiKey, ApiKeyCreateInput, ApiKeyRevocation, BillingUsage, MutationOptions, Page, PageOptions, PrepaymentSession, PrepaymentSessionCreateInput, RequestOptions, Webhook, WebhookCreateInput } from '../types/index.js';
export declare class AccountResource {
    private readonly transport;
    constructor(transport: Transport);
    get(options?: RequestOptions): Promise<Account>;
}
export declare class ApiKeysResource {
    private readonly transport;
    constructor(transport: Transport);
    create(input: ApiKeyCreateInput, options?: MutationOptions): Promise<ApiKey>;
    list(options?: PageOptions, requestOptions?: RequestOptions): Promise<Page<ApiKey>>;
    revoke(keyId: string, options?: RequestOptions): Promise<ApiKeyRevocation>;
    private requireOAuth;
}
export declare class BillingResource {
    private readonly transport;
    constructor(transport: Transport);
    getUsage(options?: RequestOptions): Promise<BillingUsage>;
    createPrepaymentSession(input: PrepaymentSessionCreateInput, options?: MutationOptions): Promise<PrepaymentSession>;
}
export declare class WebhooksResource {
    private readonly transport;
    constructor(transport: Transport);
    create(input: WebhookCreateInput, options?: MutationOptions): Promise<Webhook>;
    list(options?: PageOptions, requestOptions?: RequestOptions): Promise<Page<Webhook>>;
    delete(webhookId: string, options?: RequestOptions): Promise<Webhook>;
}
//# sourceMappingURL=account.d.ts.map