import assert from 'node:assert/strict';
import test from 'node:test';
import AutoContent from '../index.js';
import type { ContentLoopCreateInput, GenerationDraft, MotionAdVideoRequest, MotionAdVideoEdit, MotionLaunchVideoEdit, MotionLaunchVideoRequest } from '../types/index.js';

type Assert<T extends true> = T;
type Rejected<T> = T extends MotionLaunchVideoRequest ? false : true;
type Base = { asset_type: 'launch_video'; model: 'autocontent-motion-design-v1' };
type _RejectVoice = Assert<Rejected<Base & { voice_id: string }>>;
type _RejectNarration = Assert<Rejected<Base & { narration_script: null }>>;
type _RejectAvatar = Assert<Rejected<Base & { options: { presentation_mode: 'avatar' } }>>;
type _RejectCaptions = Assert<Rejected<Base & { options: { captions: true } }>>;
type _RejectCaptionStyle = Assert<Rejected<Base & { options: { caption_style: 'clean' } }>>;
type _RejectPortrait = Assert<Rejected<Base & { options: { aspect_ratio: '9:16' } }>>;
type _Reject720p = Assert<Rejected<Base & { options: { resolution: '720p' } }>>;
type _RejectCreateRefresh = Assert<Rejected<Base & { model_options: { refresh_music: true } }>>;

const launch: MotionLaunchVideoRequest = {
  asset_type: 'launch_video',
  model: 'autocontent-motion-design-v1',
  options: { duration_seconds: 30, resolution: '4k' },
  model_options: { music_direction: 'Bright electronic percussion' }
};
const draft: GenerationDraft = { project_id: 'prj_one', input: { type: 'knowledge' }, assets: [launch] };
const loop: ContentLoopCreateInput = {
  ...draft,
  schedule: { frequency: 'daily', local_time: '09:00', timezone: 'UTC' },
  max_cost_per_run_usd: '5.00', max_cost_per_month_usd: '50.00'
};

test('SDK forwards the canonical music-only create, preview, Loop and one-shot edit payloads unchanged', async () => {
  const requests: Request[] = [];
  const client = new AutoContent({
    apiKey: 'acp_test',
    fetch: async (input, init) => {
      requests.push(new Request(input, init));
      return Response.json({ id: 'gen_one', total_cost_usd: '5.00' });
    }
  });
  await client.generations.preview(draft);
  await client.generations.create({ ...draft, max_cost_usd: '5.00' }, { idempotencyKey: 'motion-create' });
  await client.contentLoops.create(loop, { idempotencyKey: 'motion-loop' });
  const edit: MotionLaunchVideoEdit = { asset_id: 'ast_one', model_options: { refresh_music: true } };
  await client.generations.previewEdit('gen_one', { assets: [edit] });
  await client.generations.edit('gen_one', { assets: [edit], max_cost_usd: '5.00' }, { idempotencyKey: 'motion-edit' });
  assert.deepEqual(await requests[0]?.json(), draft);
  assert.deepEqual((await requests[1]?.json()).assets, [launch]);
  assert.equal(requests[1]?.headers.get('idempotency-key'), 'motion-create');
  assert.deepEqual((await requests[2]?.json()).assets, [launch]);
  assert.deepEqual(await requests[3]?.json(), { assets: [edit] });
  assert.deepEqual((await requests[4]?.json()).assets, [edit]);
  assert.equal(requests[4]?.headers.get('idempotency-key'), 'motion-edit');
});

type AdBase = { asset_type: 'ad_video'; model: 'autocontent-motion-design-v1' };
type _RejectAd4k = Assert<AdBase & { options: { resolution: '4k' } } extends MotionAdVideoRequest ? false : true>;
type _RejectAdPhotos = Assert<AdBase & { options: { use_source_images: true } } extends MotionAdVideoRequest ? false : true>;

test('Motion Ads travel through real GenerationDraft, client preview/create and inherited-model edits', async () => {
  const requests: Request[] = [];
  const client = new AutoContent({ apiKey: 'acp_test', fetch: async (input, init) => {
    requests.push(new Request(input, init)); return Response.json({ id: 'gen_ad', total_cost_usd: '5.00' });
  } });
  const ad: MotionAdVideoRequest = { asset_type: 'ad_video', model: 'autocontent-motion-design-v1',
    options: { duration_seconds: 15, resolution: '1080p', aspect_ratio: '9:16' }, model_options: { music_direction: 'Sparse opening; syncopated return; resolved ending' } };
  const value: GenerationDraft = { project_id: 'prj_one', input: { type: 'knowledge', source_ids: ['src_one'] }, assets: [ad] };
  await client.generations.preview(value);
  await client.generations.create({ ...value, max_cost_usd: '5.00' }, { idempotencyKey: 'motion-ad' });
  const edit: MotionAdVideoEdit = { asset_id: 'ast_ad', options: { aspect_ratio: '1:1' }, model_options: { refresh_music: true } };
  await client.generations.previewEdit('gen_ad', { assets: [edit] });
  assert.deepEqual(await requests[0]!.json(), value);
  assert.deepEqual((await requests[1]!.json()).assets, [ad]);
  assert.equal(requests[1]!.headers.get('idempotency-key'), 'motion-ad');
  assert.deepEqual(await requests[2]!.json(), { assets: [edit] });
});
