import { InvalidRequestError } from '../errors.js';
import type { Transport } from '../transport.js';
import type {
  Account,
  ApiKey,
  ApiKeyCreateInput,
  ApiKeyRevocation,
  BillingUsage,
  MutationOptions,
  Page,
  PageOptions,
  PrepaymentSession,
  PrepaymentSessionCreateInput,
  RequestOptions,
  Webhook,
  WebhookCreateInput
} from '../types/index.js';

export class AccountResource {
  constructor(private readonly transport: Transport) {}

  get(options: RequestOptions = {}): Promise<Account> {
    return this.transport.request({
      method: 'GET',
      path: '/account',
      naturallyIdempotent: true,
      options
    });
  }
}

export class ApiKeysResource {
  constructor(private readonly transport: Transport) {}

  create(input: ApiKeyCreateInput, options: MutationOptions = {}): Promise<ApiKey> {
    this.requireOAuth();
    return this.transport.request({
      method: 'POST',
      path: '/api-keys',
      json: input,
      mutation: true,
      options
    });
  }

  list(options: PageOptions = {}, requestOptions: RequestOptions = {}): Promise<Page<ApiKey>> {
    this.requireOAuth();
    return this.transport.request({
      method: 'GET',
      path: '/api-keys',
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  revoke(keyId: string, options: RequestOptions = {}): Promise<ApiKeyRevocation> {
    this.requireOAuth();
    return this.transport.request({
      method: 'DELETE',
      path: `/api-keys/${encodeURIComponent(keyId)}`,
      naturallyIdempotent: true,
      options
    });
  }

  private requireOAuth(): void {
    if (this.transport.authKind === 'oauth') return;
    throw localOAuthError('API-key administration');
  }
}

export class BillingResource {
  constructor(private readonly transport: Transport) {}

  getUsage(options: RequestOptions = {}): Promise<BillingUsage> {
    return this.transport.request({
      method: 'GET',
      path: '/billing/usage',
      naturallyIdempotent: true,
      options
    });
  }

  createPrepaymentSession(
    input: PrepaymentSessionCreateInput,
    options: MutationOptions = {}
  ): Promise<PrepaymentSession> {
    if (this.transport.authKind !== 'oauth') throw localOAuthError('Prepaid funding');
    return this.transport.request({
      method: 'POST',
      path: '/billing/prepayment-session',
      json: input,
      mutation: true,
      options
    });
  }
}

export class WebhooksResource {
  constructor(private readonly transport: Transport) {}

  create(input: WebhookCreateInput, options: MutationOptions = {}): Promise<Webhook> {
    return this.transport.request({
      method: 'POST',
      path: '/webhooks',
      json: input,
      mutation: true,
      options
    });
  }

  list(options: PageOptions = {}, requestOptions: RequestOptions = {}): Promise<Page<Webhook>> {
    return this.transport.request({
      method: 'GET',
      path: '/webhooks',
      query: options,
      naturallyIdempotent: true,
      options: requestOptions
    });
  }

  delete(webhookId: string, options: RequestOptions = {}): Promise<Webhook> {
    return this.transport.request({
      method: 'DELETE',
      path: `/webhooks/${encodeURIComponent(webhookId)}`,
      naturallyIdempotent: true,
      options
    });
  }
}

const localOAuthError = (subject: string): InvalidRequestError => new InvalidRequestError({
  code: 'invalid_request',
  message: `${subject} requires an OAuth bearer; this client was configured with an API key.`,
  status: 0,
  correlation_id: null,
  doc_url: null
});
