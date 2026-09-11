import { createClient } from './_client.js';
import type { GenerationDraft, MotionLaunchVideoEdit, MotionLaunchVideoRequest } from 'autocontentapi';

const client = createClient();
const model = 'autocontent-motion-design-v1';
const models = await client.models.list({ asset_type: 'launch_video', limit: 100 });
if (!models.data.some(candidate => candidate.id === model && candidate.status === 'active')) {
  throw new Error('Motion Design is not currently available. Check models.list before selecting it.');
}

const launch: MotionLaunchVideoRequest = {
  asset_type: 'launch_video',
  model,
  instructions: 'Open on the customer problem, show the real product in action, and end with one clear invitation.',
  options: { duration_seconds: 30, resolution: '4k' },
  model_options: { music_direction: 'Bright electronic percussion, a catchy bass line, and a crisp ending.' }
};
const draft = {
  project_id: 'prj_acme',
  input: { type: 'knowledge' },
  // Existing ready, same-Project image Sources can also be passed in attachment_source_ids.
  assets: [launch]
} satisfies GenerationDraft;
const preview = await client.generations.preview(draft);
const accepted = await client.generations.create({ ...draft, max_cost_usd: preview.total_cost_usd });
const completed = await client.generations.wait(accepted.id);
const asset = completed.assets?.find(candidate => candidate.asset_type === 'launch_video' && candidate.status === 'succeeded');
if (!asset) throw new Error('The launch film did not complete successfully.');

// Ordinary visual/copy edits reuse the exact accepted music, including resolution-only edits.
const visualEdit: MotionLaunchVideoEdit = { asset_id: asset.id, instructions: 'Make the final invitation shorter and hold it longer.' };
const visualPreview = await client.generations.previewEdit(completed.id, { assets: [visualEdit] });
console.log('Visual edit maximum:', visualPreview.total_cost_usd);

// Explicit replacement receives a separate quote; refresh_music is consumed by this edit.
const musicEdit: MotionLaunchVideoEdit = { asset_id: asset.id, model_options: { refresh_music: true } };
const musicPreview = await client.generations.previewEdit(completed.id, { assets: [musicEdit] });
console.log('New music edit maximum:', musicPreview.total_cost_usd);
