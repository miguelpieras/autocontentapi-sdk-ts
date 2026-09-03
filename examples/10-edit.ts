import { createClient } from './_client.js';
import type { GenerationEditDraft } from 'autocontentapi';

const client = createClient();
const edit = {
  assets: [{
    asset_id: 'ast_original',
    narration_script: {
      speakers: [{ id: 'narrator' }],
      segments: [{ speaker_id: 'narrator', text: 'Use this exact approved narration.' }]
    }
  }]
} satisfies GenerationEditDraft;
const preview = await client.generations.previewEdit('gen_original', edit);
const accepted = await client.generations.edit('gen_original', {
  ...edit,
  max_cost_usd: preview.total_cost_usd
});
console.log(await client.generations.wait(accepted.id));

const generatedPreview = await client.generations.previewEdit(accepted.id, {
  assets: [{ asset_id: accepted.assets?.[0]?.id ?? 'ast_edited', narration_script: null }]
});
await client.generations.edit(accepted.id, {
  assets: [{ asset_id: accepted.assets?.[0]?.id ?? 'ast_edited', narration_script: null }],
  max_cost_usd: generatedPreview.total_cost_usd
});
