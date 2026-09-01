export type ErrorDetails = Record<string, unknown> | Array<{ field?: string; reason: string }>;

export interface APIErrorInput {
  code: string;
  message: string;
  status: number;
  correlation_id?: string | null;
  doc_url?: string | null;
  details?: ErrorDetails;
  idempotency_key?: string | null;
}

export class APIError extends Error {
  readonly code: string;
  readonly status: number;
  readonly correlation_id: string | null;
  readonly doc_url: string | null;
  readonly details: ErrorDetails | undefined;
  readonly idempotency_key: string | null;

  constructor(input: APIErrorInput) {
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

export class InvalidRequestError extends APIError {}
export class UnknownAssetTypeError extends APIError {}
export class InvalidAssetOptionsError extends APIError {}
export class InvalidModelOptionsError extends APIError {}
export class ModelNotSupportedError extends APIError {}
export class ModelRetiredError extends APIError {}
export class VoiceNotFoundError extends APIError {}
export class VoiceNotReadyError extends APIError {}
export class VoiceNotSupportedError extends APIError {}
export class AvatarNotFoundError extends APIError {}
export class AvatarNotReadyError extends APIError {}
export class AvatarNotSupportedError extends APIError {}
export class ProductVisualRequiredError extends APIError {}
export class MaxCostExceededError extends APIError {
  readonly current_cost_usd: string | undefined;
  readonly required_usd: string | undefined;
  readonly max_cost_usd: string | undefined;

  constructor(input: APIErrorInput) {
    super(input);
    const details = objectDetails(input.details);
    this.current_cost_usd = stringDetail(details, 'current_cost_usd') ?? stringDetail(details, 'required_usd');
    this.required_usd = stringDetail(details, 'required_usd');
    this.max_cost_usd = stringDetail(details, 'max_cost_usd');
  }
}

export type PaymentRequiredDetails =
  | {
      reason: 'insufficient_prepaid_funds';
      required_usd: string;
      available_usd: string;
      action: 'add_funds';
    }
  | { reason: 'billing_restricted'; action: 'contact_support' };

export class PaymentRequiredError extends APIError {
  declare readonly details: PaymentRequiredDetails;

  constructor(input: APIErrorInput) {
    super(input);
    this.details = input.details as PaymentRequiredDetails;
  }
}

export class ProjectNotReadyError extends APIError {}
export class SourceNotReadyError extends APIError {}
export class SourceUnreachableError extends APIError {}
export class SourcePaywalledError extends APIError {}
export class RateLimitError extends APIError {
  readonly retry_after_seconds: number | null;

  constructor(input: APIErrorInput & { retry_after_seconds?: number | null }) {
    super(input);
    this.retry_after_seconds = input.retry_after_seconds ?? null;
  }
}

export class ProviderOperationLimitExceededError extends APIError {
  readonly resource: string | undefined;
  readonly limit: number | undefined;
  readonly reset_at: string | null | undefined;
  readonly action: string | undefined;

  constructor(input: APIErrorInput) {
    super(input);
    const details = objectDetails(input.details);
    this.resource = stringDetail(details, 'resource');
    this.limit = numberDetail(details, 'limit');
    this.reset_at = nullableStringDetail(details, 'reset_at');
    this.action = stringDetail(details, 'action');
  }
}

export class IdempotencyConflictError extends APIError {}

export class IdempotencyInProgressError extends APIError {
  readonly may_have_been_accepted = true;
  readonly recovery_action: RecoveryAction;

  constructor(input: APIErrorInput & { recovery_action: RecoveryAction }) {
    super(input);
    this.recovery_action = input.recovery_action;
  }
}

export type RecoveryAction =
  | 'retry_same_request_with_same_idempotency_key'
  | 'retry_same_key_with_identical_replayable_body';

export interface TransportErrorInput {
  message: string;
  cause?: unknown;
  idempotency_key?: string | null;
  may_have_been_accepted?: boolean;
  recovery_action?: RecoveryAction | null;
}

export class TransportError extends Error {
  readonly code: string = 'transport_error';
  readonly idempotency_key: string | null;
  readonly may_have_been_accepted: boolean;
  readonly recovery_action: RecoveryAction | null;

  constructor(input: TransportErrorInput) {
    super(input.message, input.cause === undefined ? undefined : { cause: input.cause });
    this.name = new.target.name;
    this.idempotency_key = input.idempotency_key ?? null;
    this.may_have_been_accepted = input.may_have_been_accepted ?? false;
    this.recovery_action = input.recovery_action ?? null;
  }
}

export class RequestTimeoutError extends TransportError {
  readonly code = 'request_timeout';
  readonly timeout_ms: number;

  constructor(input: TransportErrorInput & { timeout_ms: number }) {
    super(input);
    this.timeout_ms = input.timeout_ms;
  }
}

export class WaitTimeoutError extends Error {
  readonly code = 'wait_timeout';
  readonly timeout_ms: number;
  readonly resource_type: 'project' | 'generation';
  readonly resource_id: string;

  constructor(input: {
    timeout_ms: number;
    resource_type: 'project' | 'generation';
    resource_id: string;
  }) {
    super(`Timed out waiting for ${input.resource_type} ${input.resource_id} after ${input.timeout_ms}ms.`);
    this.name = 'WaitTimeoutError';
    this.timeout_ms = input.timeout_ms;
    this.resource_type = input.resource_type;
    this.resource_id = input.resource_id;
  }
}

export class AmbiguousUploadError extends TransportError {
  readonly code = 'ambiguous_upload';
  declare readonly idempotency_key: string;
  declare readonly may_have_been_accepted: true;
  declare readonly recovery_action: 'retry_same_key_with_identical_replayable_body';

  constructor(input: Omit<TransportErrorInput, 'idempotency_key' | 'may_have_been_accepted' | 'recovery_action'> & {
    idempotency_key: string;
  }) {
    super({
      ...input,
      may_have_been_accepted: true,
      recovery_action: 'retry_same_key_with_identical_replayable_body'
    });
  }
}

const errorClasses: Record<string, new (input: APIErrorInput) => APIError> = {
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

export const createAPIError = (input: APIErrorInput & { retry_after_seconds?: number | null }): APIError => {
  if (input.code === 'rate_limited') return new RateLimitError(input);
  const ErrorClass = errorClasses[input.code] ?? APIError;
  return new ErrorClass(input);
};

const objectDetails = (details: ErrorDetails | undefined): Record<string, unknown> =>
  details !== undefined && !Array.isArray(details) ? details : {};

const stringDetail = (details: Record<string, unknown>, key: string): string | undefined =>
  typeof details[key] === 'string' ? details[key] : undefined;

const nullableStringDetail = (
  details: Record<string, unknown>,
  key: string
): string | null | undefined => details[key] === null ? null : stringDetail(details, key);

const numberDetail = (details: Record<string, unknown>, key: string): number | undefined =>
  typeof details[key] === 'number' ? details[key] : undefined;
