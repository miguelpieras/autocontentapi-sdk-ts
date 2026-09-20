import { createClient } from './_client.js';
import type { GenerationDraft, RecordedDemoRequest } from 'autocontentapi';

const client = createClient();
const model = 'autocontent-recorded-demo-v1';
const models = await client.models.list({ asset_type: 'product_demo_video', limit: 100 });
if (!models.data.some(item => item.id === model && item.status === 'active')) throw new Error('Website recording is not currently available.');
const demo: RecordedDemoRequest<'product_demo_video'> = {
  asset_type: 'product_demo_video', model,
  instructions: 'Show the public product search and a useful result. Compose a clear, energetic film with varied typography and music.',
  options: { website_url: 'https://your-product.com', duration_seconds: 30, interaction_mode: 'browse' },
  model_options: { narration: true }
};
const draft = { project_id: 'prj_acme', input: { type: 'knowledge' }, assets: [demo] } satisfies GenerationDraft;
const quote = await client.generations.preview(draft);
const generation = await client.generations.create({ ...draft, max_cost_usd: quote.total_cost_usd });
const completed = await client.generations.wait(generation.id);
console.log(completed.status);
