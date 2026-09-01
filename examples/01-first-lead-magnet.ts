import { createReadStream } from 'node:fs';
import { createClient } from './_client.js';

const client = createClient();

const project = await client.projects.create({ website_url: 'https://acme.com' });
const analyzed = await client.projects.wait(project.id);
if (analyzed.status !== 'needs_review') throw new Error(`Analysis ended as ${analyzed.status}.`);

await client.projects.update(project.id, {
  category: 'Secure code execution infrastructure for AI agents',
  relevant_keywords: ['agent sandbox', 'secure code execution'],
  competitor_keywords: ['E2B', 'Modal'],
  excluded_keywords: ['jobs', 'stock price'],
  confirmed: true
});

// Direct multipart PNG/JPEG/WebP uploads in the accepted Source scope may become
// frozen Lead Magnet image references. Other Sources still contribute text evidence.
const visual = await client.sources.create(project.id, {
  file: () => createReadStream('./dashboard.png'),
  filename: 'dashboard.png',
  title: 'Product dashboard'
});
while ((await client.sources.get(visual.id)).status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2_000));
}
if ((await client.sources.get(visual.id)).status !== 'ready') throw new Error('Product visual ingestion failed.');

const draft = {
  project_id: project.id,
  input: { type: 'knowledge' as const, source_ids: [visual.id] },
  assets: [{
    asset_type: 'lead_magnet' as const,
    options: { page_count: 12, format: 'workbook' as const },
    model: 'gpt-image-2'
  }]
};
const preview = await client.generations.preview(draft);
const generation = await client.generations.create({ ...draft, max_cost_usd: preview.total_cost_usd });
console.log(await client.generations.wait(generation.id));
