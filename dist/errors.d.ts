export type ErrorDetails = Record<string, unknown> | Array<{
    field?: string;
    reason: string;
}>;
export interface APIErrorInput {
    code: string;
    message: string;
    status: number;
    correlation_id?: string | null;
    doc_url?: string | null;
    details?: ErrorDetails;
    idempotency_key?: string | null;
}
export declare class APIError extends Error {
    readonly code: string;
    readonly status: number;
    readonly correlation_id: string | null;
    readonly doc_url: string | null;
    readonly details: ErrorDetails | undefined;
    readonly idempotency_key: string | null;
    constructor(input: APIErrorInput);
}
export declare class InvalidRequestError extends APIError {
}
export declare class UnknownAssetTypeError extends APIError {
}
export declare class InvalidAssetOptionsError extends APIError {
}
export declare class InvalidModelOptionsError extends APIError {
}
export declare class ModelNotSupportedError extends APIError {
}
export declare class ModelRetiredError extends APIError {
}
export declare class VoiceNotFoundError extends APIError {
}
export declare class VoiceNotReadyError extends APIError {
}
export declare class VoiceNotSupportedError extends APIError {
}
export declare class AvatarNotFoundError extends APIError {
}
export declare class AvatarNotReadyError extends APIError {
}
export declare class AvatarNotSupportedError extends APIError {
}
export declare class ProductVisualRequiredError extends APIError {
}
export declare class MaxCostExceededError extends APIError {
    readonly current_cost_usd: string | undefined;
    readonly required_usd: string | undefined;
    readonly max_cost_usd: string | undefined;
    constructor(input: APIErrorInput);
}
export type PaymentRequiredDetails = {
    reason: 'insufficient_prepaid_funds';
    required_usd: string;
    available_usd: string;
    action: 'add_funds';
} | {
    reason: 'billing_restricted';
    action: 'contact_support';
};
export declare class PaymentRequiredError extends APIError {
    readonly details: PaymentRequiredDetails;
    constructor(input: APIErrorInput);
}
export declare class ProjectNotReadyError extends APIError {
}
export declare class SourceNotReadyError extends APIError {
}
export declare class SourceUnreachableError extends APIError {
}
export declare class SourcePaywalledError extends APIError {
}
export declare class RateLimitError extends APIError {
    readonly retry_after_seconds: number | null;
    constructor(input: APIErrorInput & {
        retry_after_seconds?: number | null;
    });
}
export declare class ProviderOperationLimitExceededError extends APIError {
    readonly resource: string | undefined;
    readonly limit: number | undefined;
    readonly reset_at: string | null | undefined;
    readonly action: string | undefined;
    constructor(input: APIErrorInput);
}
export declare class IdempotencyConflictError extends APIError {
}
export declare class IdempotencyInProgressError extends APIError {
    readonly may_have_been_accepted = true;
    readonly recovery_action: RecoveryAction;
    constructor(input: APIErrorInput & {
        recovery_action: RecoveryAction;
    });
}
export type RecoveryAction = 'retry_same_request_with_same_idempotency_key' | 'retry_same_key_with_identical_replayable_body';
export interface TransportErrorInput {
    message: string;
    cause?: unknown;
    idempotency_key?: string | null;
    may_have_been_accepted?: boolean;
    recovery_action?: RecoveryAction | null;
}
export declare class TransportError extends Error {
    readonly code: string;
    readonly idempotency_key: string | null;
    readonly may_have_been_accepted: boolean;
    readonly recovery_action: RecoveryAction | null;
    constructor(input: TransportErrorInput);
}
export declare class RequestTimeoutError extends TransportError {
    readonly code = "request_timeout";
    readonly timeout_ms: number;
    constructor(input: TransportErrorInput & {
        timeout_ms: number;
    });
}
export declare class WaitTimeoutError extends Error {
    readonly code = "wait_timeout";
    readonly timeout_ms: number;
    readonly resource_type: 'project' | 'generation';
    readonly resource_id: string;
    constructor(input: {
        timeout_ms: number;
        resource_type: 'project' | 'generation';
        resource_id: string;
    });
}
export declare class AmbiguousUploadError extends TransportError {
    readonly code = "ambiguous_upload";
    readonly idempotency_key: string;
    readonly may_have_been_accepted: true;
    readonly recovery_action: 'retry_same_key_with_identical_replayable_body';
    constructor(input: Omit<TransportErrorInput, 'idempotency_key' | 'may_have_been_accepted' | 'recovery_action'> & {
        idempotency_key: string;
    });
}
export declare const createAPIError: (input: APIErrorInput & {
    retry_after_seconds?: number | null;
}) => APIError;
//# sourceMappingURL=errors.d.ts.map