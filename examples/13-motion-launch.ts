import AutoContent, { type GenerationDraft } from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const draft: GenerationDraft = {
  project_id: 'prj_123',
  input: { type: 'knowledge' },
  assets: [{
    asset_type: 'launch_video',
    model: 'autocontent-motion-design-v1',
    options: { duration_seconds: 30 },
    model_options: { music_direction: 'Bright electronic beat with a crisp ending.' }
  }]
};

const { total_cost_usd } = await client.generations.preview(draft);
const generation = await client.generations.create({ ...draft, max_cost_usd: total_cost_usd });
console.log(await client.generations.wait(generation.id));
