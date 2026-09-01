import {
  AmbiguousUploadError,
  APIError,
  createAPIError,
  IdempotencyInProgressError,
  RateLimitError,
  RequestTimeoutError,
  TransportError,
  type ErrorDetails
} from './errors.js';
import type { MutationOptions, RequestOptions, UploadData, UploadSource } from './types/index.js';

const DEFAULT_BASE_URL = 'https://api.autocontentapi.com/v1';
const DEFAULT_REQUEST_TIMEOUT_MS = 120_000;
const MIN_REQUEST_TIMEOUT_MS = 1_000;
const MAX_REQUEST_TIMEOUT_MS = 960_000;
const DEFAULT_ATTEMPTS = 3;

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

interface ParsedError {
  code: string;
  message: string;
  details?: ErrorDetails;
  correlation_id?: string | null;
  doc_url?: string | null;
}

interface PreparedBody {
  body: BodyInit | undefined;
  headers: Record<string, string>;
  duplex?: 'half';
}

export class Transport {
  readonly authKind: 'apiKey' | 'oauth';
  readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly getAccessToken: (() => string | Promise<string>) | undefined;
  private readonly defaultRequestTimeoutMs: number;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(options: AutoContentOptions) {
    const hasApiKey = typeof options.apiKey === 'string' && options.apiKey.trim().length > 0;
    const hasTokenCallback = typeof options.getAccessToken === 'function';
    if (hasApiKey === hasTokenCallback) {
      throw new TypeError('Provide exactly one of apiKey or getAccessToken.');
    }
    this.apiKey = hasApiKey ? options.apiKey?.trim() : undefined;
    this.getAccessToken = options.getAccessToken;
    this.authKind = hasApiKey ? 'apiKey' : 'oauth';
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.defaultRequestTimeoutMs = validateRequestTimeout(
      options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
    );
    this.fetchFn = options.fetch ?? globalThis.fetch;
    if (typeof this.fetchFn !== 'function') {
      throw new TypeError('This runtime does not provide fetch.');
    }
  }

  async request<T>(request: TransportRequest): Promise<T> {
    const timeoutMs = validateRequestTimeout(
      request.options?.requestTimeoutMs ?? this.defaultRequestTimeoutMs
    );
    if (request.options?.signal?.aborted) throw abortReason(request.options.signal);

    const deadline = Date.now() + timeoutMs;
    const idempotencyKey = request.mutation
      ? request.options?.idempotencyKey ?? crypto.randomUUID()
      : null;
    const replayable = request.multipart === undefined || isReplayableUpload(request.multipart.file);
    const retryableMethod = request.naturallyIdempotent === true || idempotencyKey !== null;
    let lastError: unknown;

    for (let attempt = 1; attempt <= DEFAULT_ATTEMPTS; attempt += 1) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        throw requestTimeout(timeoutMs, idempotencyKey, request.mutation === true, lastError);
      }

      const attemptSignal = createAttemptSignal(request.options?.signal, remainingMs);
      let requestStarted = false;
      try {
        const token = await withAbort(this.accessToken(), attemptSignal.signal);
        const prepared = await withAbort(prepareBody(request.json, request.multipart), attemptSignal.signal);
        const headers: Record<string, string> = {
          accept: 'application/json',
          authorization: `Bearer ${token}`,
          ...prepared.headers
        };
        if (idempotencyKey !== null) headers['idempotency-key'] = idempotencyKey;

        requestStarted = true;
        const response = await this.fetchFn(buildUrl(this.baseUrl, request.path, request.query), {
          method: request.method,
          headers,
          body: prepared.body,
          signal: attemptSignal.signal,
          ...(prepared.duplex === undefined ? {} : { duplex: prepared.duplex })
        } as RequestInit);

        if (response.ok) return await parseSuccess<T>(response);

        const parsed = await parseError(response);
        const retryAfterSeconds = retryDelaySeconds(response, parsed);
        const shouldRetry = shouldRetryResponse(response.status, parsed.code)
          && retryableMethod
          && replayable
          && attempt < DEFAULT_ATTEMPTS;
        if (shouldRetry) {
          const delayMs = retryAfterSeconds === null
            ? exponentialDelayMs(attempt)
            : Math.ceil(retryAfterSeconds * 1_000);
          if (delayMs < deadline - Date.now()) {
            await delay(delayMs, request.options?.signal);
            continue;
          }
        }

        const errorInput = {
          ...parsed,
          status: response.status,
          idempotency_key: idempotencyKey,
          retry_after_seconds: retryAfterSeconds
        };
        if (parsed.code === 'rate_limited') throw new RateLimitError(errorInput);
        if (parsed.code === 'idempotency_in_progress' && idempotencyKey !== null) {
          throw new IdempotencyInProgressError({
            ...errorInput,
            recovery_action: request.multipart !== undefined && !replayable
              ? 'retry_same_key_with_identical_replayable_body'
              : 'retry_same_request_with_same_idempotency_key'
          });
        }
        throw createAPIError(errorInput);
      } catch (error) {
        lastError = error;
        if (error instanceof APIError) throw error;

        const timedOut = attemptSignal.timedOut();
        attemptSignal.dispose();
        if (timedOut || Date.now() >= deadline) {
          throw requestTimeout(timeoutMs, idempotencyKey, requestStarted && request.mutation === true, error);
        }

        if (request.options?.signal?.aborted) {
          if (!requestStarted || idempotencyKey === null) throw abortReason(request.options.signal);
          if (request.multipart !== undefined && !replayable) {
            throw new AmbiguousUploadError({
              message: 'The upload was interrupted after it may have reached the server.',
              cause: error,
              idempotency_key: idempotencyKey
            });
          }
          throw keyedTransportError(error, idempotencyKey);
        }

        if (request.multipart !== undefined && !replayable && requestStarted) {
          if (idempotencyKey === null) {
            throw new TransportError({
              message: 'The one-shot upload failed and cannot be replayed safely.',
              cause: error,
              may_have_been_accepted: true
            });
          }
          throw new AmbiguousUploadError({
            message: 'The one-shot upload may have been accepted; replay identical bytes with the same key.',
            cause: error,
            idempotency_key: idempotencyKey
          });
        }

        if (retryableMethod && replayable && attempt < DEFAULT_ATTEMPTS) {
          const delayMs = exponentialDelayMs(attempt);
          if (delayMs < deadline - Date.now()) {
            await delay(delayMs, request.options?.signal);
            continue;
          }
        }

        if (idempotencyKey !== null) throw keyedTransportError(error, idempotencyKey);
        throw new TransportError({ message: 'The request failed after transport retries.', cause: error });
      } finally {
        attemptSignal.dispose();
      }
    }

    throw new TransportError({ message: 'The request failed after transport retries.', cause: lastError });
  }

  async download(url: string, options: RequestOptions = {}): Promise<Response> {
    const timeoutMs = validateRequestTimeout(options.requestTimeoutMs ?? this.defaultRequestTimeoutMs);
    if (options.signal?.aborted) throw abortReason(options.signal);
    const attemptSignal = createAttemptSignal(options.signal, timeoutMs);
    try {
      const response = await this.fetchFn(url, { method: 'GET', signal: attemptSignal.signal });
      if (!response.ok) {
        throw new TransportError({ message: `Artifact download failed with HTTP ${response.status}.` });
      }
      return response;
    } catch (error) {
      if (attemptSignal.timedOut()) {
        throw requestTimeout(timeoutMs, null, false, error);
      }
      if (options.signal?.aborted) throw abortReason(options.signal);
      if (error instanceof TransportError) throw error;
      throw new TransportError({ message: 'Artifact download failed.', cause: error });
    } finally {
      attemptSignal.dispose();
    }
  }

  private async accessToken(): Promise<string> {
    const token = this.apiKey ?? await this.getAccessToken?.();
    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new TypeError('The access-token callback returned an empty token.');
    }
    return token.trim();
  }
}

const prepareBody = async (json: unknown, multipart: MultipartInput | undefined): Promise<PreparedBody> => {
  if (multipart === undefined) {
    if (json === undefined) return { body: undefined, headers: {} };
    return {
      body: JSON.stringify(json),
      headers: { 'content-type': 'application/json' }
    };
  }

  const source = typeof multipart.file === 'function' ? await multipart.file() : multipart.file;
  const filename = multipart.filename ?? inferFilename(source) ?? 'upload.bin';
  const contentType = multipart.contentType ?? inferContentType(source) ?? 'application/octet-stream';
  if (isBlob(source)) {
    const form = new FormData();
    form.append('file', source, filename);
    appendFields(form, multipart.fields);
    return { body: form, headers: {} };
  }

  const boundary = `autocontent-${crypto.randomUUID()}`;
  const body = multipartBody(boundary, source, filename, contentType, multipart.fields);
  return {
    body: body as unknown as BodyInit,
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    duplex: 'half'
  };
};

const appendFields = (form: FormData, fields: MultipartInput['fields']): void => {
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (value !== undefined) form.append(key, String(value));
  }
};

async function* multipartBody(
  boundary: string,
  source: UploadData,
  filename: string,
  contentType: string,
  fields: MultipartInput['fields']
): AsyncGenerator<Uint8Array> {
  const encoder = new TextEncoder();
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (value === undefined) continue;
    yield encoder.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="${escapeHeader(key)}"\r\n\r\n${String(value)}\r\n`
    );
  }
  yield encoder.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${escapeHeader(filename)}"\r\nContent-Type: ${contentType}\r\n\r\n`
  );
  for await (const chunk of uploadChunks(source)) yield chunk;
  yield encoder.encode(`\r\n--${boundary}--\r\n`);
}

async function* uploadChunks(source: UploadData): AsyncGenerator<Uint8Array> {
  if (isBlob(source)) {
    const buffer = await source.arrayBuffer();
    yield new Uint8Array(buffer);
    return;
  }
  if (isWebReadableStream(source)) {
    const reader = source.getReader();
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        yield result.value;
      }
    } finally {
      reader.releaseLock();
    }
    return;
  }
  for await (const chunk of source as AsyncIterable<unknown>) {
    if (typeof chunk === 'string') yield new TextEncoder().encode(chunk);
    else if (chunk instanceof Uint8Array) yield chunk;
    else yield new Uint8Array(chunk as ArrayBuffer);
  }
}

const parseSuccess = async <T>(response: Response): Promise<T> => {
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  const text = await response.text();
  return (text.length === 0 ? undefined : JSON.parse(text)) as T;
};

const parseError = async (response: Response): Promise<ParsedError> => {
  try {
    const payload = await response.json() as { error?: Partial<ParsedError> };
    const error = payload.error;
    if (typeof error?.code === 'string' && typeof error.message === 'string') {
      return {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
        correlation_id: typeof error.correlation_id === 'string' ? error.correlation_id : null,
        doc_url: typeof error.doc_url === 'string' ? error.doc_url : null
      };
    }
  } catch {
    // Fall through to the stable synthetic transport-facing API error.
  }
  return {
    code: response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' : 'internal_error',
    message: `The API returned HTTP ${response.status}.`,
    correlation_id: response.headers.get('x-correlation-id'),
    doc_url: null
  };
};

const shouldRetryResponse = (status: number, code: string): boolean => {
  if (code === 'provider_operation_limit_exceeded') return false;
  return status >= 500 || code === 'rate_limited' || code === 'idempotency_in_progress';
};

const retryDelaySeconds = (response: Response, error: ParsedError): number | null => {
  const header = response.headers.get('retry-after');
  if (header !== null) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds;
    const timestamp = Date.parse(header);
    if (Number.isFinite(timestamp)) return Math.max(0, (timestamp - Date.now()) / 1_000);
  }
  if (!Array.isArray(error.details) && error.details !== undefined) {
    const retryAt = error.details.retry_at;
    if (typeof retryAt === 'string') {
      const timestamp = Date.parse(retryAt);
      if (Number.isFinite(timestamp)) return Math.max(0, (timestamp - Date.now()) / 1_000);
    }
  }
  return null;
};

const buildUrl = (
  baseUrl: string,
  path: string,
  query: TransportRequest['query']
): string => {
  const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
};

const normalizeBaseUrl = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('baseUrl must be an absolute HTTP(S) URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('baseUrl must use HTTP or HTTPS.');
  }
  return url.toString().replace(/\/$/u, '');
};

const validateRequestTimeout = (value: number): number => {
  if (!Number.isInteger(value) || !Number.isFinite(value) || value < MIN_REQUEST_TIMEOUT_MS || value > MAX_REQUEST_TIMEOUT_MS) {
    throw new TypeError(`requestTimeoutMs must be an integer from ${MIN_REQUEST_TIMEOUT_MS} to ${MAX_REQUEST_TIMEOUT_MS}.`);
  }
  return value;
};

const isBlob = (value: unknown): value is Blob =>
  typeof Blob !== 'undefined' && value instanceof Blob;

const isWebReadableStream = (value: unknown): value is ReadableStream<Uint8Array> =>
  typeof ReadableStream !== 'undefined' && value instanceof ReadableStream;

const isReplayableUpload = (source: UploadSource): boolean =>
  typeof source === 'function' || isBlob(source);

const inferFilename = (source: UploadData): string | undefined => {
  if (isBlob(source) && 'name' in source && typeof source.name === 'string') return source.name;
  if (typeof source === 'object' && source !== null && 'path' in source && typeof source.path === 'string') {
    return source.path.split(/[\\/]/u).pop();
  }
  return undefined;
};

const inferContentType = (source: UploadData): string | undefined =>
  isBlob(source) && source.type.length > 0 ? source.type : undefined;

const escapeHeader = (value: string): string => value.replace(/["\r\n]/gu, '_');

const exponentialDelayMs = (attempt: number): number => {
  const base = 250 * (2 ** (attempt - 1));
  return Math.round(base * (0.8 + Math.random() * 0.4));
};

const delay = async (milliseconds: number, signal?: AbortSignal): Promise<void> => {
  if (signal?.aborted) throw abortReason(signal);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortReason(signal));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal !== undefined) {
      void Promise.resolve().then(() => {
        if (!signal.aborted) return;
        clearTimeout(timer);
        reject(abortReason(signal));
      });
    }
  });
};

const createAttemptSignal = (caller: AbortSignal | undefined, timeoutMs: number): {
  signal: AbortSignal;
  timedOut: () => boolean;
  dispose: () => void;
} => {
  const controller = new AbortController();
  let timeoutFired = false;
  const timer = setTimeout(() => {
    timeoutFired = true;
    controller.abort(new DOMException('The request timed out.', 'TimeoutError'));
  }, timeoutMs);
  const onAbort = (): void => controller.abort(caller?.reason);
  caller?.addEventListener('abort', onAbort, { once: true });
  if (caller?.aborted) onAbort();
  return {
    signal: controller.signal,
    timedOut: () => timeoutFired,
    dispose: () => {
      clearTimeout(timer);
      caller?.removeEventListener('abort', onAbort);
    }
  };
};

const abortReason = (signal: AbortSignal | undefined): unknown =>
  signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError');

const withAbort = async <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> => {
  if (signal.aborted) throw abortReason(signal);
  return await new Promise<T>((resolve, reject) => {
    const onAbort = (): void => reject(abortReason(signal));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      value => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      error => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      }
    );
  });
};

const keyedTransportError = (cause: unknown, idempotencyKey: string): TransportError =>
  new TransportError({
    message: 'The keyed request failed after it may have reached the server.',
    cause,
    idempotency_key: idempotencyKey,
    may_have_been_accepted: true,
    recovery_action: 'retry_same_request_with_same_idempotency_key'
  });

const requestTimeout = (
  timeoutMs: number,
  idempotencyKey: string | null,
  mayHaveBeenAccepted: boolean,
  cause: unknown
): RequestTimeoutError => new RequestTimeoutError({
  message: `The request exceeded its ${timeoutMs}ms timeout.`,
  cause,
  timeout_ms: timeoutMs,
  idempotency_key: idempotencyKey,
  may_have_been_accepted: mayHaveBeenAccepted,
  recovery_action: idempotencyKey === null ? null : 'retry_same_request_with_same_idempotency_key'
});
