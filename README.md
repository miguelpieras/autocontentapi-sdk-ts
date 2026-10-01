# autocontentapi

TypeScript SDK and CLI for the [AutoContent API](https://autocontentapi.com/developers).

```bash
npm install autocontentapi
```

Requires Node.js 20+. Create an API key at [platform.autocontentapi.com/keys](https://platform.autocontentapi.com/keys).

## Quickstart

```ts
import AutoContent, { type GenerationDraft } from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const draft: GenerationDraft = {
  project_id: 'prj_123',
  input: { type: 'knowledge' },
  assets: [{ asset_type: 'article' }]
};

const { total_cost_usd } = await client.generations.preview(draft);
const generation = await client.generations.create({ ...draft, max_cost_usd: total_cost_usd });
const result = await client.generations.wait(generation.id);
```

`preview` returns the price. `create` never charges more than `max_cost_usd`.

## Asset types

Swap the asset to make something else:

```ts
{ asset_type: 'article', options: { target_words: 1200 } }
{ asset_type: 'lead_magnet', options: { format: 'checklist', page_count: 6 } }
{ asset_type: 'ebook', options: { chapter_count: 6 } }
{ asset_type: 'slides', options: { slide_count: 12 } }
{ asset_type: 'infographic', options: { aspect_ratio: '4:5' } }
{ asset_type: 'quiz', options: { question_count: 10 } }
{ asset_type: 'podcast_episode', options: { duration_seconds: 600 } }
{ asset_type: 'short_video', options: { aspect_ratio: '9:16' } }
{ asset_type: 'explainer_video', options: { duration_seconds: 90 } }
{ asset_type: 'launch_video' }
{ asset_type: 'product_demo_video' }
{ asset_type: 'ad_video', options: { duration_seconds: 15 } }
```

## Examples

- [Write an article](examples/01-article.ts)
- [Make a checklist lead magnet](examples/02-lead-magnet.ts)
- [Make a vertical short video](examples/03-short-video.ts)
- [Make a 10-minute podcast](examples/04-podcast.ts)
- [Read quiz questions as JSON](examples/05-quiz-json.ts)
- [Create a Project from a website](examples/06-project.ts)
- [Generate from a PDF](examples/07-upload-pdf.ts)
- [Download finished files](examples/08-download.ts)
- [Publish every Monday](examples/09-weekly-loop.ts)
- [Edit a finished Asset](examples/10-edit.ts)
- [Verify a webhook](examples/11-webhook.ts)
- [Video with your exact script](examples/12-exact-script.ts)
- [Music-led launch film](examples/13-motion-launch.ts)
- [Record a website demo](examples/14-record-website.ts)
- [Product ad from photos](examples/15-product-ad.ts)

## CLI

```bash
npm install -g autocontentapi
autocontent login acp_...
autocontent generate --project prj_123 --knowledge --asset article --wait
```

Run `autocontent --help` for every command.
