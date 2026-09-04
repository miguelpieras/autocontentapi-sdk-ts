import { createClient } from './_client.js';
import type { GenerationDraft } from 'autocontentapi';

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
    {
      asset_type: 'short_video' as const,
      options: {
        caption_style: 'social_highlight' as const,
        caption_font: 'montserrat' as const,
        caption_position: 'bottom' as const
      }
    },
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
    model: 'minimax-h3-max-turbo'
  }]
};
const pinnedPreview = await client.generations.preview(pinnedDraft);
await client.generations.create({ ...pinnedDraft, max_cost_usd: pinnedPreview.total_cost_usd });

const exactNarrationDraft = {
  project_id: 'prj_acme',
  input: { type: 'knowledge' as const },
  language: 'de-DE',
  assets: [
    {
      asset_type: 'short_video' as const,
      narration_script: {
        speakers: [{ id: 'narrator' }],
        segments: [{ speaker_id: 'narrator', text: 'Dieser freigegebene Wortlaut bleibt exakt.' }]
      }
    },
    {
      asset_type: 'launch_video' as const,
      options: {
        presentation_mode: 'faceless' as const,
        duration_seconds: 30,
        caption_style: 'clean' as const,
        caption_font: 'inter' as const,
        caption_position: 'bottom' as const
      },
      narration_script: {
        speakers: [
          { id: 'host', voice_id: 'voice_host_de' },
          { id: 'expert', voice_id: 'voice_expert_de' }
        ],
        segments: [
          { speaker_id: 'host', text: 'Der erste Satz bleibt unverändert.' },
          { speaker_id: 'expert', text: 'Auch der zweite Satz bleibt unverändert.' }
        ]
      }
    },
    {
      asset_type: 'explainer_video' as const,
      options: { presentation_mode: 'avatar' as const, duration_seconds: 60 },
      narration_script: {
        speakers: [
          { id: 'host', voice_id: 'voice_host_de', avatar_id: 'avatar_host' },
          { id: 'expert', voice_id: 'voice_expert_de', avatar_id: 'avatar_expert' }
        ],
        segments: [
          { speaker_id: 'host', text: 'Wir beginnen mit dem geprüften Ausgangspunkt.' },
          { speaker_id: 'expert', text: 'Danach folgt die ebenfalls geprüfte Erklärung.' }
        ]
      }
    }
  ]
} satisfies GenerationDraft;
const exactPreview = await client.generations.preview(exactNarrationDraft);
await client.generations.create({ ...exactNarrationDraft, max_cost_usd: exactPreview.total_cost_usd });
