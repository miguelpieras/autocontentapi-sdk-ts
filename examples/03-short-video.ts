import AutoContent, { type GenerationDraft } from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const draft: GenerationDraft = {
  project_id: 'prj_123',
  input: { type: 'knowledge' },
  assets: [{ asset_type: 'short_video', options: { duration_seconds: 30, aspect_ratio: '9:16' } }]
};

const { total_cost_usd } = await client.generations.preview(draft);
const generation = await client.generations.create({ ...draft, max_cost_usd: total_cost_usd });
console.log(await client.generations.wait(generation.id));
