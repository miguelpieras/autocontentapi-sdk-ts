import { openAsBlob } from 'node:fs';
import AutoContent, { type GenerationDraft } from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

let source = await client.sources.create('prj_123', { file: await openAsBlob('./brief.pdf'), filename: 'brief.pdf' });
while (source.status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2_000));
  source = await client.sources.get(source.id);
}

const draft: GenerationDraft = {
  project_id: 'prj_123',
  input: { type: 'knowledge', source_ids: [source.id] },
  assets: [{ asset_type: 'article' }]
};

const { total_cost_usd } = await client.generations.preview(draft);
const generation = await client.generations.create({ ...draft, max_cost_usd: total_cost_usd });
console.log(await client.generations.wait(generation.id));
