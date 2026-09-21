import { createClient } from './_client.js';
import type { GenerationDraft, MotionAdVideoRequest, MotionAdVideoEdit } from 'autocontentapi';

const client = createClient();
const product: MotionAdVideoRequest = {
  asset_type: 'ad_video', model: 'autocontent-motion-design-v1',
  instructions: 'Show the supplied product clearly, highlight its documented qualities, and end with a readable invitation.',
  options: { duration_seconds: 15, aspect_ratio: '9:16', resolution: '1080p' },
  model_options: { music_direction: 'A warm instrumental opening, a rhythmic lift, then a resolved ending.',
    product_commercial: { product_source_ids: ['src_product_photo'], style_reference_source_ids: ['src_style_still'] } }
};
const draft: GenerationDraft = { project_id: 'prj_product',
  input: { type: 'knowledge', source_ids: ['src_product_facts', 'src_product_photo', 'src_style_still'] }, assets: [product] };
console.log('Creation maximum:', (await client.generations.preview(draft)).total_cost_usd);

// After explicitly creating and completing that Generation, use the scene ID
// from its metadata artifact. The storyboard PNG comes from the finished MP4.
const edit: MotionAdVideoEdit = { asset_id: 'ast_completed_product',
  instructions: 'Make the product larger in this scene.', model_options: { target_section_id: 'product_ending' } };
console.log('Scene edit maximum:', (await client.generations.previewEdit('gen_completed_product', { assets: [edit] })).total_cost_usd);
// Confirm via generations.edit with max_cost_usd and an idempotency key.
// The accepted photos and exact score are retained; other scenes stay fixed.
