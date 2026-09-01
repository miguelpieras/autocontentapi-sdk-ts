export class APIError extends Error {
    code;
    status;
    correlation_id;
    doc_url;
    details;
    idempotency_key;
    constructor(input) {
        super(input.message);
        this.name = new.target.name;
        this.code = input.code;
        this.status = input.status;
        this.correlation_id = input.correlation_id ?? null;
        this.doc_url = input.doc_url ?? null;
        this.details = input.details;
        this.idempotency_key = input.idempotency_key ?? null;
    }
}
export class InvalidRequestError extends APIError {
}
export class UnknownAssetTypeError extends APIError {
}
export class InvalidAssetOptionsError extends APIError {
}
export class InvalidModelOptionsError extends APIError {
}
export class ModelNotSupportedError extends APIError {
}
export class ModelRetiredError extends APIError {
}
export class VoiceNotFoundError extends APIError {
}
export class VoiceNotReadyError extends APIError {
}
export class VoiceNotSupportedError extends APIError {
}
export class AvatarNotFoundError extends APIError {
}
export class AvatarNotReadyError extends APIError {
}
export class AvatarNotSupportedError extends APIError {
}
export class ProductVisualRequiredError extends APIError {
}
export class MaxCostExceededError extends APIError {
    current_cost_usd;
    required_usd;
    max_cost_usd;
    constructor(input) {
        super(input);
        const details = objectDetails(input.details);
        this.current_cost_usd = stringDetail(details, 'current_cost_usd') ?? stringDetail(details, 'required_usd');
        this.required_usd = stringDetail(details, 'required_usd');
        this.max_cost_usd = stringDetail(details, 'max_cost_usd');
    }
}
export class PaymentRequiredError extends APIError {
    constructor(input) {
        super(input);
        this.details = input.details;
    }
}
export class ProjectNotReadyError extends APIError {
}
export class SourceNotReadyError extends APIError {
}
export class SourceUnreachableError extends APIError {
}
export class SourcePaywalledError extends APIError {
}
export class RateLimitError extends APIError {
    retry_after_seconds;
    constructor(input) {
        super(input);
        this.retry_after_seconds = input.retry_after_seconds ?? null;
    }
}
export class ProviderOperationLimitExceededError extends APIError {
    resource;
    limit;
    reset_at;
    action;
    constructor(input) {
        super(input);
        const details = objectDetails(input.details);
        this.resource = stringDetail(details, 'resource');
        this.limit = numberDetail(details, 'limit');
        this.reset_at = nullableStringDetail(details, 'reset_at');
        this.action = stringDetail(details, 'action');
    }
}
export class IdempotencyConflictError extends APIError {
}
export class IdempotencyInProgressError extends APIError {
    may_have_been_accepted = true;
    recovery_action;
    constructor(input) {
        super(input);
        this.recovery_action = input.recovery_action;
    }
}
export class TransportError extends Error {
    code = 'transport_error';
    idempotency_key;
    may_have_been_accepted;
    recovery_action;
    constructor(input) {
        super(input.message, input.cause === undefined ? undefined : { cause: input.cause });
        this.name = new.target.name;
        this.idempotency_key = input.idempotency_key ?? null;
        this.may_have_been_accepted = input.may_have_been_accepted ?? false;
        this.recovery_action = input.recovery_action ?? null;
    }
}
export class RequestTimeoutError extends TransportError {
    code = 'request_timeout';
    timeout_ms;
    constructor(input) {
        super(input);
        this.timeout_ms = input.timeout_ms;
    }
}
export class WaitTimeoutError extends Error {
    code = 'wait_timeout';
    timeout_ms;
    resource_type;
    resource_id;
    constructor(input) {
        super(`Timed out waiting for ${input.resource_type} ${input.resource_id} after ${input.timeout_ms}ms.`);
        this.name = 'WaitTimeoutError';
        this.timeout_ms = input.timeout_ms;
        this.resource_type = input.resource_type;
        this.resource_id = input.resource_id;
    }
}
export class AmbiguousUploadError extends TransportError {
    code = 'ambiguous_upload';
    constructor(input) {
        super({
            ...input,
            may_have_been_accepted: true,
            recovery_action: 'retry_same_key_with_identical_replayable_body'
        });
    }
}
const errorClasses = {
    invalid_request: InvalidRequestError,
    unknown_asset_type: UnknownAssetTypeError,
    invalid_asset_options: InvalidAssetOptionsError,
    invalid_model_options: InvalidModelOptionsError,
    model_not_supported: ModelNotSupportedError,
    model_retired: ModelRetiredError,
    voice_not_found: VoiceNotFoundError,
    voice_not_ready: VoiceNotReadyError,
    voice_not_supported: VoiceNotSupportedError,
    avatar_not_found: AvatarNotFoundError,
    avatar_not_ready: AvatarNotReadyError,
    avatar_not_supported: AvatarNotSupportedError,
    product_visual_required: ProductVisualRequiredError,
    max_cost_exceeded: MaxCostExceededError,
    payment_required: PaymentRequiredError,
    project_not_ready: ProjectNotReadyError,
    source_not_ready: SourceNotReadyError,
    source_unreachable: SourceUnreachableError,
    source_paywalled: SourcePaywalledError,
    provider_operation_limit_exceeded: ProviderOperationLimitExceededError,
    idempotency_conflict: IdempotencyConflictError
};
export const createAPIError = (input) => {
    if (input.code === 'rate_limited')
        return new RateLimitError(input);
    const ErrorClass = errorClasses[input.code] ?? APIError;
    return new ErrorClass(input);
};
const objectDetails = (details) => details !== undefined && !Array.isArray(details) ? details : {};
const stringDetail = (details, key) => typeof details[key] === 'string' ? details[key] : undefined;
const nullableStringDetail = (details, key) => details[key] === null ? null : stringDetail(details, key);
const numberDetail = (details, key) => typeof details[key] === 'number' ? details[key] : undefined;
//# sourceMappingURL=errors.js.map