import { createClient } from './_client.js';

const client = createClient();
const draft = {
  project_id: 'prj_acme',
  input: { type: 'trend' as const, lookback_days: 7 },
  assets: [
    { asset_type: 'lead_magnet' as const },
    { asset_type: 'podcast_episode' as const }
  ]
};
const preview = await client.generations.preview(draft);
const generation = await client.generations.create({ ...draft, max_cost_usd: preview.total_cost_usd });
console.log(await client.generations.wait(generation.id));
