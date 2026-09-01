import { WaitTimeoutError } from './errors.js';
import type { WaitOptions } from './types/index.js';

const DEFAULT_WAIT_TIMEOUT_MS = 1_800_000;
const MIN_WAIT_TIMEOUT_MS = 1_000;
const MAX_WAIT_TIMEOUT_MS = 86_400_000;

export const waitForResource = async <T extends { poll_after_seconds?: number | null }>(input: {
  resourceType: 'project' | 'generation';
  resourceId: string;
  get: () => Promise<T>;
  isTerminal: (value: T) => boolean;
  options?: WaitOptions;
}): Promise<T> => {
  const timeoutMs = validateWaitTimeout(input.options?.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS);
  const deadline = Date.now() + timeoutMs;
  let fallbackSeconds = 2;

  while (true) {
    if (input.options?.signal?.aborted) throw abortReason(input.options.signal);
    if (Date.now() >= deadline) throw waitTimeout(input, timeoutMs);

    const value = await input.get();
    if (input.isTerminal(value)) return value;

    const seconds = Number.isInteger(value.poll_after_seconds) && (value.poll_after_seconds ?? 0) > 0
      ? value.poll_after_seconds as number
      : fallbackSeconds;
    fallbackSeconds = Math.min(15, Math.max(2, Math.ceil(fallbackSeconds * 1.5)));
    const delayMs = seconds * 1_000;
    if (Date.now() + delayMs > deadline) throw waitTimeout(input, timeoutMs);
    await delay(delayMs, input.options?.signal);
  }
};

const validateWaitTimeout = (value: number): number => {
  if (!Number.isInteger(value) || !Number.isFinite(value) || value < MIN_WAIT_TIMEOUT_MS || value > MAX_WAIT_TIMEOUT_MS) {
    throw new TypeError(`timeoutMs must be an integer from ${MIN_WAIT_TIMEOUT_MS} to ${MAX_WAIT_TIMEOUT_MS}.`);
  }
  return value;
};

const delay = async (milliseconds: number, signal?: AbortSignal): Promise<void> => {
  if (signal?.aborted) throw abortReason(signal);
  await new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortReason(signal));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
};

const abortReason = (signal: AbortSignal | undefined): unknown =>
  signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError');

const waitTimeout = (
  input: { resourceType: 'project' | 'generation'; resourceId: string },
  timeoutMs: number
): WaitTimeoutError => new WaitTimeoutError({
  timeout_ms: timeoutMs,
  resource_type: input.resourceType,
  resource_id: input.resourceId
});
