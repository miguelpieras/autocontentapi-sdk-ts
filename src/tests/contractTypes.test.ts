import assert from 'node:assert/strict';
import test from 'node:test';
import AutoContent from '../index.js';
import type {
  AdVideoRequest,
  ArticleRequest,
  ContentLoopCreateInput,
  ContentLoopUpdateInput,
  EbookRequest,
  GenerationDraft,
  GenerationEditDraft,
  PodcastEpisodeRequest,
  ShortVideoRequest
} from '../types/index.js';

type Assert<T extends true> = T;
type IsAssignable<TValue, TTarget> = TValue extends TTarget ? true : false;
type IsNotAssignable<TValue, TTarget> = IsAssignable<TValue, TTarget> extends false ? true : false;

type TwoVoiceScript = {
  speakers: [{ id: 'host'; voice_id: 'voice_host' }, { id: 'expert'; voice_id: 'voice_expert' }];
  segments: [{ speaker_id: 'host'; text: 'First.' }, { speaker_id: 'expert'; text: 'Second.' }];
};

type _AdIsAvatarByDefault = Assert<IsAssignable<{ asset_type: 'ad_video'; avatar_id: 'avatar_one' }, AdVideoRequest>>;
type _FacelessAdRejectsAvatar = Assert<IsNotAssignable<
  { asset_type: 'ad_video'; avatar_id: 'avatar_one'; options: { presentation_mode: 'faceless' } },
  AdVideoRequest
>>;
type _AdTwoVoiceScriptNeedsFaceless = Assert<IsNotAssignable<
  { asset_type: 'ad_video'; narration_script: TwoVoiceScript },
  AdVideoRequest
>>;
type _FacelessAdTwoVoiceScript = Assert<IsAssignable<
  { asset_type: 'ad_video'; options: { presentation_mode: 'faceless' }; narration_script: TwoVoiceScript },
  AdVideoRequest
>>;
type _ShortVideoStaysFacelessByDefault = Assert<IsAssignable<
  { asset_type: 'short_video'; narration_script: TwoVoiceScript },
  ShortVideoRequest
>>;
type _ShortVideoAvatarNeedsMode = Assert<IsNotAssignable<{ asset_type: 'short_video'; avatar_id: 'avatar_one' }, ShortVideoRequest>>;
type _CohostNeedsDialogueModel = Assert<IsNotAssignable<
  { asset_type: 'podcast_episode'; options: { cohost_voice_id: 'voice_cohost' } },
  PodcastEpisodeRequest
>>;
type _CohostRejectsOtherModels = Assert<IsNotAssignable<
  { asset_type: 'podcast_episode'; model: 'narration-v2'; options: { cohost_voice_id: 'voice_cohost' } },
  PodcastEpisodeRequest
>>;
type _EbookPageCountModeIsChecked = Assert<IsNotAssignable<
  { asset_type: 'ebook'; options: { page_count_mode: 'exact' } },
  EbookRequest
>>;

const article: ArticleRequest = { asset_type: 'article', options: { target_words: 1200, generated_images: 2 } };
const ebook: EbookRequest = { asset_type: 'ebook', options: { target_pages: 40, page_count_mode: 'fixed' } };
const podcast: PodcastEpisodeRequest = {
  asset_type: 'podcast_episode',
  model: 'dialogue-v4',
  voice_id: 'voice_host',
  options: { duration_seconds: 600, cohost_voice_id: 'voice_cohost' }
};
const avatarAd: AdVideoRequest = { asset_type: 'ad_video', options: { duration_seconds: 15, visual_production: 'premium' } };
const facelessAd: AdVideoRequest = {
  asset_type: 'ad_video',
  voice_id: 'voice_host',
  options: { presentation_mode: 'faceless', product_visual_source_ids: ['src_photo'] }
};
const draft: GenerationDraft = { project_id: 'prj_one', input: { type: 'knowledge' }, assets: [article, ebook, podcast, avatarAd] };
const slideEdit: GenerationEditDraft = {
  assets: [{ asset_id: 'ast_deck', slide_edits: [{ slide_number: 3, instructions: 'Show the pricing table larger.' }] }]
};
const loop: ContentLoopCreateInput = {
  project_id: 'prj_one',
  input: { type: 'trend' },
  assets: [facelessAd],
  schedule: { frequency: 'weekly', day_of_week: 'monday', local_time: '09:00', timezone: 'UTC' },
  max_cost_per_run_usd: '5.00',
  max_cost_per_month_usd: '50.00',
  publish_to: [{ social_connection_id: 'soc_01JC0000000000000000000000', caption_suffix: 'Link in bio.' }]
};
const loopPatch: ContentLoopUpdateInput = { publish_to: [] };

test('new Asset options, slide edits and Loop publish targets reach the API unchanged', async () => {
  const requests: Request[] = [];
  const client = new AutoContent({
    apiKey: 'acp_test',
    fetch: async (input, init) => {
      requests.push(new Request(input, init));
      return Response.json({ id: 'gen_one', total_cost_usd: '5.00' });
    }
  });
  await client.generations.preview(draft);
  await client.generations.previewEdit('gen_one', slideEdit);
  await client.contentLoops.create(loop, { idempotencyKey: 'loop-publish' });
  await client.contentLoops.update('loop_one', loopPatch, { idempotencyKey: 'loop-unpublish' });
  assert.deepEqual(await requests[0]?.json(), draft);
  assert.deepEqual(await requests[1]?.json(), slideEdit);
  assert.deepEqual(await requests[2]?.json(), loop);
  assert.deepEqual(await requests[3]?.json(), loopPatch);
});
