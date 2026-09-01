import { createClient } from './_client.js';

const client = createClient();
const draft = {
  project_id: 'prj_acme',
  input: { type: 'knowledge' as const },
  assets: [{
    asset_type: 'podcast_episode' as const,
    voice_id: 'voice_acme_narrator',
    options: { duration_seconds: 7_200 }
  }]
};
const preview = await client.generations.preview(draft);
await client.generations.create({ ...draft, max_cost_usd: preview.total_cost_usd });
