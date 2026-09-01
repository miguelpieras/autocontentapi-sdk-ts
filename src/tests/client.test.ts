import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Readable } from 'node:stream';
import test from 'node:test';
import AutoContent, {
  AmbiguousUploadError,
  InvalidRequestError,
  MaxCostExceededError,
  constructWebhookEvent,
  extensionAsset
} from '../index.js';

test('client requires exactly one authentication mode', () => {
  assert.throws(() => new AutoContent({} as never), /exactly one/u);
  assert.throws(() => new AutoContent({
    apiKey: 'acp_test',
    getAccessToken: () => 'oauth'
  }), /exactly one/u);
});

test('OAuth callback is invoked per HTTP request', async () => {
  let tokenCalls = 0;
  const requests: Request[] = [];
  const client = new AutoContent({
    getAccessToken: () => `token_${++tokenCalls}`,
    fetch: async (input, init) => {
      requests.push(new Request(input, init));
      return Response.json({ id: 'acct_one' });
    }
  });
  await client.account.get();
  await client.account.get();
  assert.equal(tokenCalls, 2);
  assert.equal(requests[0]?.headers.get('authorization'), 'Bearer token_1');
  assert.equal(requests[1]?.headers.get('authorization'), 'Bearer token_2');
});

test('keyed mutations retain an explicit idempotency key', async () => {
  const requests: Request[] = [];
  const client = new AutoContent({
    apiKey: 'acp_test',
    fetch: async (input, init) => {
      requests.push(new Request(input, init));
      return Response.json({ id: 'gen_one', status: 'queued' }, { status: 202 });
    }
  });
  await client.generations.create({
    project_id: 'prj_one',
    input: { type: 'knowledge' },
    assets: [{ asset_type: 'article' }],
    max_cost_usd: '1.00'
  }, { idempotencyKey: 'workflow-one' });
  assert.equal(requests[0]?.headers.get('idempotency-key'), 'workflow-one');
});

test('safe transport retries retain the same generated idempotency key', async () => {
  const keys: Array<string | null> = [];
  let attempts = 0;
  const client = new AutoContent({
    apiKey: 'acp_test',
    fetch: async (input, init) => {
      attempts += 1;
      keys.push(new Headers(init?.headers).get('idempotency-key'));
      if (attempts === 1) throw new TypeError('connection reset');
      return Response.json({ id: 'gen_one', status: 'queued' }, { status: 202 });
    }
  });
  await client.generations.create({
    project_id: 'prj_one',
    input: { type: 'knowledge' },
    assets: [{ asset_type: 'article' }],
    max_cost_usd: '1.00'
  });
  assert.equal(attempts, 2);
  assert.match(keys[0] ?? '', /^[0-9a-f-]{36}$/u);
  assert.equal(keys[1], keys[0]);
});

test('stream factories produce focused multipart bodies without buffering in the SDK', async () => {
  let factoryCalls = 0;
  let body = '';
  const client = new AutoContent({
    apiKey: 'acp_test',
    fetch: async (input, init) => {
      const chunks: Uint8Array[] = [];
      for await (const chunk of init?.body as unknown as AsyncIterable<Uint8Array>) chunks.push(chunk);
      body = new TextDecoder().decode(Buffer.concat(chunks));
      return Response.json({ id: 'src_one', status: 'processing' }, { status: 202 });
    }
  });
  await client.sources.create('prj_one', {
    file: () => {
      factoryCalls += 1;
      return Readable.from(['hello']);
    },
    filename: 'notes.txt',
    title: 'Notes'
  });
  assert.equal(factoryCalls, 1);
  assert.match(body, /name="title"\r\n\r\nNotes/u);
  assert.match(body, /filename="notes.txt"/u);
  assert.match(body, /\r\n\r\nhello\r\n/u);
});

test('one-shot upload transport loss is surfaced as ambiguous and is not replayed', async () => {
  let attempts = 0;
  const client = new AutoContent({
    apiKey: 'acp_test',
    fetch: async () => {
      attempts += 1;
      throw new TypeError('connection reset');
    }
  });
  await assert.rejects(
    client.sources.create('prj_one', {
      file: Readable.from(['one shot']),
      filename: 'notes.txt'
    }),
    (error: unknown) => error instanceof AmbiguousUploadError
      && error.recovery_action === 'retry_same_key_with_identical_replayable_body'
  );
  assert.equal(attempts, 1);
});

test('API errors are normalized into typed classes', async () => {
  const client = new AutoContent({
    apiKey: 'acp_test',
    fetch: async () => Response.json({
      error: {
        code: 'max_cost_exceeded',
        message: 'Too expensive.',
        details: { required_usd: '3.00', max_cost_usd: '2.00' },
        correlation_id: 'corr_one',
        doc_url: 'https://docs.autocontentapi.com/errors/max-cost'
      }
    }, { status: 422 })
  });
  await assert.rejects(
    client.generations.create({
      project_id: 'prj_one',
      input: { type: 'knowledge' },
      assets: [{ asset_type: 'article' }],
      max_cost_usd: '2.00'
    }),
    (error: unknown) => error instanceof MaxCostExceededError
      && error.required_usd === '3.00'
      && error.idempotency_key !== null
  );
});

test('OAuth-only methods fail locally when configured with an API key', () => {
  const client = new AutoContent({ apiKey: 'acp_test', fetch: async () => new Response() });
  assert.throws(
    () => client.apiKeys.create({ name: 'CI', scopes: ['platform.read'] }),
    InvalidRequestError
  );
});

test('extensionAsset rejects known IDs and accepts a future live ID', () => {
  assert.throws(() => extensionAsset('article'), /not built into/u);
  assert.equal(extensionAsset('song', { options: { duration_seconds: 30 } }).asset_type, 'song');
});

test('webhook verification authenticates raw bytes and rejects extra fields', () => {
  const secret = 'whsec_test';
  const timestamp = 1_800_000_000;
  const body = JSON.stringify({
    id: 'evt_one',
    type: 'generation.succeeded',
    created_at: '2027-01-15T08:00:00.000Z',
    data: { project_id: 'prj_one', generation_id: 'gen_one', status: 'succeeded' }
  });
  const digest = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const event = constructWebhookEvent({
    rawBody: body,
    signature: `t=${timestamp},v1=${digest}`,
    eventId: 'evt_one',
    secret,
    now: new Date(timestamp * 1_000)
  });
  assert.equal(event.type, 'generation.succeeded');

  const invalidBody = body.replace('"status":"succeeded"', '"status":"succeeded","extra":true');
  const invalidDigest = createHmac('sha256', secret).update(`${timestamp}.${invalidBody}`).digest('hex');
  assert.throws(() => constructWebhookEvent({
    rawBody: invalidBody,
    signature: `t=${timestamp},v1=${invalidDigest}`,
    eventId: 'evt_one',
    secret,
    now: new Date(timestamp * 1_000)
  }), /Invalid webhook body/u);
});
