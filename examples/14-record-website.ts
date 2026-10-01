import AutoContent, { type GenerationDraft } from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const draft: GenerationDraft = {
  project_id: 'prj_123',
  input: { type: 'knowledge' },
  assets: [{
    asset_type: 'product_demo_video',
    model: 'autocontent-recorded-demo-v1',
    instructions: 'Search for a product and open the first result.',
    options: { website_url: 'https://acme.com', duration_seconds: 30 }
  }]
};

const { total_cost_usd } = await client.generations.preview(draft);
const generation = await client.generations.create({ ...draft, max_cost_usd: total_cost_usd });
console.log(await client.generations.wait(generation.id));
