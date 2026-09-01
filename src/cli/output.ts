import {
  AmbiguousUploadError,
  APIError,
  RequestTimeoutError,
  TransportError,
  WaitTimeoutError
} from '../errors.js';
import { CLIUsageError } from './requestBuilder.js';

export interface OutputMode {
  json: boolean;
  quiet: boolean;
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
}

const moneyCodes = new Set([
  'max_cost_exceeded',
  'payment_required',
  'content_loop_budget_exceeded',
  'project_limit_exceeded',
  'content_loop_limit_exceeded',
  'webhook_limit_exceeded',
  'provider_operation_limit_exceeded'
]);

const authCodes = new Set(['unauthorized', 'forbidden']);
const transientCodes = new Set(['rate_limited', 'idempotency_in_progress', 'internal_error']);

export const writeResult = (value: unknown, mode: OutputMode, createdId?: string): void => {
  if (mode.quiet && createdId !== undefined) {
    mode.stdout.write(`${createdId}\n`);
    return;
  }
  mode.stdout.write(`${JSON.stringify(value, null, mode.json ? 0 : 2)}\n`);
};

export const writeError = (error: unknown, mode: OutputMode): number => {
  const envelope = errorEnvelope(error);
  if (mode.json) {
    mode.stderr.write(`${JSON.stringify(envelope)}\n`);
  } else {
    mode.stderr.write(`Error: ${envelope.error.message}\n`);
    const key = envelope.error.idempotency_key;
    if (typeof key === 'string') mode.stderr.write(`Idempotency key: ${key}\n`);
    const action = envelope.error.recovery_action;
    if (typeof action === 'string') mode.stderr.write(`Recovery: ${action}\n`);
  }
  return exitCodeForError(error);
};

export const exitCodeForError = (error: unknown): number => {
  if (error instanceof CLIUsageError) return 2;
  if (error instanceof AmbiguousUploadError
    || error instanceof RequestTimeoutError
    || error instanceof WaitTimeoutError
    || error instanceof TransportError) return 6;
  if (error instanceof APIError) {
    if (moneyCodes.has(error.code)) return 4;
    if (authCodes.has(error.code)) return 5;
    if (transientCodes.has(error.code) || error.status >= 500) return 6;
    return 2;
  }
  return 2;
};

export const generationExitCode = (status: string): number =>
  status === 'succeeded' ? 0 : ['partially_succeeded', 'failed', 'cancelled'].includes(status) ? 3 : 0;

export const loopRunExitCode = (status: string): number =>
  status === 'budget_blocked'
    ? 4
    : ['partially_succeeded', 'failed', 'cancelled'].includes(status)
      ? 3
      : status === 'configuration_blocked'
        ? 2
        : 0;

const errorEnvelope = (error: unknown): { error: Record<string, unknown> } => {
  if (error instanceof APIError) {
    return {
      error: compact({
        code: error.code,
        message: error.message,
        details: error.details,
        correlation_id: error.correlation_id,
        doc_url: error.doc_url,
        idempotency_key: error.idempotency_key,
        may_have_been_accepted: 'may_have_been_accepted' in error ? error.may_have_been_accepted : undefined,
        recovery_action: 'recovery_action' in error ? error.recovery_action : undefined
      })
    };
  }
  if (error instanceof WaitTimeoutError) {
    return { error: {
      code: error.code,
      message: error.message,
      timeout_ms: error.timeout_ms,
      resource_type: error.resource_type,
      resource_id: error.resource_id
    } };
  }
  if (error instanceof TransportError) {
    return { error: compact({
      code: error.code,
      message: error.message,
      idempotency_key: error.idempotency_key,
      may_have_been_accepted: error.may_have_been_accepted,
      recovery_action: error.recovery_action,
      timeout_ms: error instanceof RequestTimeoutError ? error.timeout_ms : undefined
    }) };
  }
  return { error: {
    code: error instanceof CLIUsageError ? error.code : 'invalid_request',
    message: error instanceof Error ? error.message : String(error)
  } };
};

const compact = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined && nested !== null));
