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

### Exact video narration

The standard models for all five Video Assets accept `narration_script`. Put Voice and Avatar IDs on
each speaker; do not combine an exact script with root `voice_id` or
`avatar_id`. A one-speaker script may use the Project default resources. Two
speakers require a Voice for each, and Avatar presentation also requires an
Avatar for each:

```ts
import type { GenerationDraft } from 'autocontentapi';

const draft = {
  project_id: 'prj_acme',
  input: { type: 'knowledge' as const },
  language: 'de-DE',
  assets: [{
    asset_type: 'explainer_video' as const,
    options: {
      duration_seconds: 60,
      presentation_mode: 'avatar' as const,
      captions: true,
      caption_style: 'social_highlight' as const,
      caption_font: 'montserrat' as const,
      caption_position: 'bottom' as const
    },
    narration_script: {
      speakers: [
        { id: 'host', voice_id: 'voice_host_de', avatar_id: 'avatar_host' },
        { id: 'expert', voice_id: 'voice_expert_de', avatar_id: 'avatar_expert' }
      ],
      segments: [
        { speaker_id: 'host', text: 'Dieser freigegebene Satz bleibt unverändert.' },
        { speaker_id: 'expert', text: 'Auch dieser Satz bleibt unverändert.' }
      ]
    }
  }]
} satisfies GenerationDraft;
```

The API keeps accepted wording, Unicode, punctuation, speaker attribution, and
turn order, while generating the visual plan around it. `duration_seconds` is
an approximate target: preview rejects scripts that cannot conservatively fit
it, while complete shorter narration ends the video naturally without synthetic
trailing padding. Unusually long synthesized speech can still fail safely at
runtime instead of being cut. Content Loops reuse the
same complete script on every run. In an edit, omit `narration_script` to retain
it, replace the whole object to change it, or send `null` to return to generated
narration. The guarantee is textual and structural; it is not ASR pronunciation
or OCR certification.

The CLI accepts the identical object through `--asset-config @video.json`.

Burned captions use transparent overlays, never a full-width dark rectangle.
Choose `caption_style` (`social_bold`, `social_highlight`, or `clean`),
`caption_font` (`inter`, `montserrat`, or `oswald`), and `caption_position`
(`top`, `center`, or `bottom`). Defaults are `social_bold`, `inter`, and
`bottom`. Setting `captions: false` disables burn-in; the VTT Artifact remains
available.

### Motion Design Ads and launch films

When `models.list({ asset_type: 'launch_video' })` includes
`autocontent-motion-design-v1`, select that exact model for Motion Design. The
existing Launch default is unchanged. Use `MotionLaunchVideoRequest` for its
typed contract: 15–60 integer seconds (default 60), landscape 16:9, and either
`resolution: '1080p'` at 30 fps (default) or `'4k'` at 60 fps.

Motion Ads select the same model through `models.list({ asset_type: 'ad_video' })`.
Use `MotionAdVideoRequest`: 15–60 seconds (default 15), portrait 9:16 (default),
square 1:1 or landscape 16:9, and 1080p/30. This production style uses frozen
Project evidence and images; omit ordinary Ad `visual_production`, physical-photo
options, Voice, Avatar and narration. Helper types describe known contracts; the
forward-compatible generic model branch still relies on canonical API validation.

Each create or Content Loop run receives one new original arranged instrumental. Optional
`model_options.music_direction` accepts at most 500 characters. This model is
music-only: omit Voice, Avatar, narration, and caption styling; captions default
to false. Ready same-Project images can be supplied through the existing
`attachment_source_ids`; text evidence still supplies the facts.

Ordinary edits, including resolution-only edits, reuse the exact accepted
score. Changing duration or music direction, or setting the edit-only
`model_options.refresh_music: true`, requires a newly quoted score. The refresh
directive applies once and is not inherited by later edits. Preview the edit
before accepting its maximum; the final measured production charge stays within
the reservation and unused funds are released. The SDK forwards the API quote
without calculating prices. See [the complete example](examples/12-motion-launch.ts).

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

The `client.agent` resource supports concrete output plans without managed chat:
`prepareOutputs({ plan })`, `acceptOutputs(id, { expected_revision, max_cost_usd,
budget_scope: 'outputs' })`, `getOutputs(id)`, and `cancelOutputs(id)`. A plan's
ordered `items` may repeat Asset types and give each output its own brief,
language and options. Stable `out_` IDs keep edits and results attached to the
intended output. Inspect the canonical quote before accepting its USD cap.

`agent.searchKnowledge` and `agent.readSourceChunk` read permitted Project Sources
without inference. `agent.send` is the separate, OAuth-only managed conversation
operation and requires an explicit inference cap and originating page context.
An external client has no implicit access to the website's active page. Asset
production continues to use AutoContent prepaid USD regardless of where the
conversation happens.

The [`examples`](./examples) directory covers Project onboarding and Lead Magnet,
brand resources, a trend multi-Asset request, a two-hour Podcast, Quiz JSON,
all five Videos, a weekly Content Loop, webhook verification, artifact download,
Generation edit, Asset feedback, and OAuth-only prepaid funding.

The default API origin is `https://api.autocontentapi.com/v1`. Use `baseUrl` or
`--base-url` only for local, staging, or self-hosted environments.

### Record a public website

When model discovery lists `autocontent-recorded-demo-v1`, use it with `product_demo_video`, `launch_video`, or `ad_video`. Set `options.website_url` to a public HTTPS page and describe the journey in `instructions`. AI records real browser interactions and composes the footage, typography, narration, and an original instrumental. No credentials or saved browser sessions are accepted.

```ts
import type { RecordedDemoRequest } from 'autocontentapi';

const video: RecordedDemoRequest = {
  asset_type: 'product_demo_video',
  model: 'autocontent-recorded-demo-v1',
  instructions: 'Demonstrate the public product search, show the result, and explain why it saves time.',
  options: {
    website_url: 'https://your-product.com',
    duration_seconds: 30,
    aspect_ratio: '16:9',
    interaction_mode: 'browse',
  },
  model_options: { narration: true, music_direction: 'Playful percussion, a quiet break, and a confident ending' },
};
```

Include this asset in the usual Generation preview/create request. Use the returned quote, your spending cap, and a stable idempotency key. `browse` allows public page navigation; same-origin writes require `interaction_mode: 'demo'` and `demo_environment_confirmed: true`, attesting to a test environment without real purchases, messages, or destructive effects. An interrupted browser journey is never replayed automatically. Each generation or edit records a fresh journey and composes a new score. Output is 15–60 seconds at 1080p, with landscape, vertical, or square framing. The same request works through HTTP, CLI, and MCP; the web app calls it **Record website**.
