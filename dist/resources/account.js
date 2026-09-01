import { InvalidRequestError } from '../errors.js';
export class AccountResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    get(options = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/account',
            naturallyIdempotent: true,
            options
        });
    }
}
export class ApiKeysResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    create(input, options = {}) {
        this.requireOAuth();
        return this.transport.request({
            method: 'POST',
            path: '/api-keys',
            json: input,
            mutation: true,
            options
        });
    }
    list(options = {}, requestOptions = {}) {
        this.requireOAuth();
        return this.transport.request({
            method: 'GET',
            path: '/api-keys',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    revoke(keyId, options = {}) {
        this.requireOAuth();
        return this.transport.request({
            method: 'DELETE',
            path: `/api-keys/${encodeURIComponent(keyId)}`,
            naturallyIdempotent: true,
            options
        });
    }
    requireOAuth() {
        if (this.transport.authKind === 'oauth')
            return;
        throw localOAuthError('API-key administration');
    }
}
export class BillingResource {
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    getUsage(options = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/billing/usage',
            naturallyIdempotent: true,
            options
        });
    }
    createPrepaymentSession(input, options = {}) {
        if (this.transport.authKind !== 'oauth')
            throw localOAuthError('Prepaid funding');
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
    transport;
    constructor(transport) {
        this.transport = transport;
    }
    create(input, options = {}) {
        return this.transport.request({
            method: 'POST',
            path: '/webhooks',
            json: input,
            mutation: true,
            options
        });
    }
    list(options = {}, requestOptions = {}) {
        return this.transport.request({
            method: 'GET',
            path: '/webhooks',
            query: options,
            naturallyIdempotent: true,
            options: requestOptions
        });
    }
    delete(webhookId, options = {}) {
        return this.transport.request({
            method: 'DELETE',
            path: `/webhooks/${encodeURIComponent(webhookId)}`,
            naturallyIdempotent: true,
            options
        });
    }
}
const localOAuthError = (subject) => new InvalidRequestError({
    code: 'invalid_request',
    message: `${subject} requires an OAuth bearer; this client was configured with an API key.`,
    status: 0,
    correlation_id: null,
    doc_url: null
});
//# sourceMappingURL=account.js.map