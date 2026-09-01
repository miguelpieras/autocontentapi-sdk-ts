# AutoContent Platform TypeScript SDK and CLI

Create Articles, Lead Magnets, Ebooks, Slides, Infographics, Quizzes, Podcast
Episodes, and five first-class Video products through the AutoContent Platform API.
The SDK preserves the API's `snake_case` request and response fields, quotes every
Generation before acceptance, and never calculates customer prices locally.

## Install

```bash
npm install autocontentapi
```

Node.js 20 or newer is required. The package is ESM-first and uses the runtime's
built-in `fetch`.

## First Generation

```ts
import AutoContent from 'autocontentapi';

const client = new AutoContent({
  apiKey: process.env.AUTOCONTENT_API_KEY
});

const draft = {
  project_id: 'prj_acme',
  input: { type: 'knowledge' as const },
  attachment_source_ids: ['src_request_brief'],
  assets: [
    { asset_type: 'lead_magnet' as const },
    { asset_type: 'podcast_episode' as const }
  ]
};

const preview = await client.generations.preview(draft);
const generation = await client.generations.create({
  ...draft,
  max_cost_usd: preview.total_cost_usd
});
const completed = await client.generations.wait(generation.id);
```

`attachment_source_ids` can attach up to 20 ready Sources from the same Project
to one preview and Generation without adding them to the reusable Knowledge
scope. Upload a request-only file Source with `keep_as_project_asset: false`; it
expires after 24 hours unless claimed by a Generation. The CLI exposes the same
flow as `sources add ./brief.pdf --project prj_acme --request-only`, followed by
repeated `--attachment-source <source-id>` flags on preview and generate.
Textual attachments can ground any Asset type. Product Visual attachments can
guide Lead Magnets and Product Demo Videos only, and still require textual
Project or request evidence for grounding.

For browser account sessions, provide an OAuth callback instead of an API key:

```ts
const client = new AutoContent({
  getAccessToken: () => platformSession.getAccessToken()
});
```

Exactly one authentication mode is required. The callback runs for every HTTP
request so refreshed access tokens work. The SDK does not store OAuth tokens.

## Asset types

The twelve launch IDs are:

```text
article                 lead_magnet            ebook
slides                  infographic            quiz
podcast_episode         short_video            explainer_video
launch_video            product_demo_video     ad_video
```

Each known Asset request has a discriminated TypeScript type for its stable
options. Model-native options remain live-discovery data:

```ts
const models = await client.models.list({ asset_type: 'explainer_video' });
```

Use `extensionAsset('future_type', fields)` only for a newly activated live
catalog type not known to this SDK version. It rejects all twelve known IDs.

## Complete resource surface

The client exposes `projects`, `collections`, `sources`, `assetTypes`, `models`,
`voices`, `avatars`, `generations`, `assets`, `contentLoops`, `account`, `apiKeys`,
`billing`, and `webhooks`. Every list returns one cursor page; no method silently
fetches or locally filters later pages.

Mutation methods generate an idempotency key when one is omitted and retain that
same key through safe transport retries. Pass `{ idempotencyKey }` when separate
method invocations represent the same workflow action. Transport and timeout
errors preserve the key and an exact recovery action when the server may have
accepted work.

Uploads accept `Blob`/`File`, a web or Node readable stream, or a factory that
creates fresh identical bytes. Blob/File and factories are safely replayable.
An ambiguous one-shot stream failure throws `AmbiguousUploadError` instead of
silently resending consumed bytes.

## Webhook verification

Verify the exact raw body before parsing it:

```ts
const event = AutoContent.webhooks.constructEvent({
  rawBody,
  signature: request.headers['x-autocontent-signature'],
  eventId: request.headers['x-autocontent-event-id'],
  secret: process.env.AUTOCONTENT_WEBHOOK_SECRET
});
```

Verification uses HMAC-SHA256, constant-time comparison, a default ±300-second
window, exact event-ID equality, and the closed sixteen-event v1 union.

## CLI

The same package provides the `autocontent` binary:

```bash
npm install -g autocontentapi
autocontent login acp_...
autocontent whoami
```

`AUTOCONTENT_API_KEY` overrides the stored key and is the CI/agent path.

```bash
autocontent preview \
  --project prj_acme \
  --knowledge \
  --asset lead_magnet

autocontent generate \
  --project prj_acme \
  --knowledge \
  --attachment-source src_request_brief \
  --asset lead_magnet \
  --max-cost "$PREVIEW_TOTAL_USD" \
  --wait \
  --output-dir ./assets
```

TTY use previews and asks once before Generation acceptance. Non-TTY use requires
an explicit `--max-cost` or canonical `max_cost_usd`. `--json` emits canonical API
JSON; it is automatic when stdout is not a TTY. Run `autocontent --help` and each
command's help for Projects, Sources, discovery, Generations/editing, Assets,
Content Loops, usage, and webhooks.

## Examples

The [`examples`](./examples) directory covers Project onboarding and Lead Magnet,
brand resources, a trend multi-Asset request, a two-hour Podcast, Quiz JSON,
all five Videos, a weekly Content Loop, webhook verification, artifact download,
Generation edit, Asset feedback, and OAuth-only prepaid funding.

The default API origin is `https://api.autocontentapi.com/v1`. Use `baseUrl` or
`--base-url` only for local, staging, or self-hosted environments.
