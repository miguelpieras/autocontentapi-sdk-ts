import { createClient } from './_client.js';

const client = createClient();
const productVisual = await client.sources.create('prj_acme', {
  type: 'product_visual',
  url: 'https://cdn.example.com/product-dashboard.png',
  title: 'Product dashboard'
});
while ((await client.sources.get(productVisual.id)).status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2_000));
}
if ((await client.sources.get(productVisual.id)).status !== 'ready') throw new Error('Product visual ingestion failed.');

const draft = {
  project_id: 'prj_acme',
  input: { type: 'knowledge' as const },
  assets: [
    { asset_type: 'short_video' as const },
    { asset_type: 'explainer_video' as const },
    { asset_type: 'launch_video' as const },
    {
      asset_type: 'product_demo_video' as const,
      options: { product_visual_source_ids: [productVisual.id] }
    },
    { asset_type: 'ad_video' as const }
  ]
};
const preview = await client.generations.preview(draft);
await client.generations.create({ ...draft, max_cost_usd: preview.total_cost_usd });

const pinnedDraft = {
  project_id: 'prj_acme',
  input: { type: 'knowledge' as const },
  assets: [{
    asset_type: 'explainer_video' as const,
    model: 'veo-3.1-fast',
    model_options: { camera_motion: 'slow_dolly' }
  }]
};
const pinnedPreview = await client.generations.preview(pinnedDraft);
await client.generations.create({ ...pinnedDraft, max_cost_usd: pinnedPreview.total_cost_usd });
