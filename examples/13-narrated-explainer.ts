import { createClient } from './_client.js';
import type { ExplainerVideoRequest, GenerationDraft } from 'autocontentapi';

const client = createClient();
const model = 'autocontent-narrated-video-v1';
const models = await client.models.list({ asset_type: 'explainer_video', limit: 100 });
if (!models.data.some(candidate => candidate.id === model && candidate.status === 'active')) {
  throw new Error('Illustrated explainers are not currently available.');
}
const video: ExplainerVideoRequest = {
  asset_type: 'explainer_video', model, voice_id: 'voice_stock_charon',
  instructions: 'Explain the idea with rich imagery, concise social typography and motion that shows how it works. No sales CTA.',
  options: { duration_seconds: 240, aspect_ratio: '16:9', resolution: '1080p',
    presentation_mode: 'faceless', captions: true },
};
const draft = { project_id: 'prj_acme', input: { type: 'knowledge' }, assets: [video] } satisfies GenerationDraft;
const preview = await client.generations.preview(draft);
const accepted = await client.generations.create({ ...draft, max_cost_usd: preview.total_cost_usd });
const completed = await client.generations.wait(accepted.id);
console.log(completed);
// For a Short, use short_video and its discovered duration range. Keep the same
// model in Content Loops and edits. Compatible pinned Voices remain exact; discover
// alternatives with voices.list. No music is added. H3 is selected where useful.
// Preview is a maximum; settlement charges newly incurred production cost within it.
