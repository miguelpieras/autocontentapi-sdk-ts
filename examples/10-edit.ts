import AutoContent, { type GenerationEditDraft } from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const edit: GenerationEditDraft = {
  assets: [{ asset_id: 'ast_123', instructions: 'Make the intro shorter.' }]
};

const { total_cost_usd } = await client.generations.previewEdit('gen_123', edit);
const edited = await client.generations.edit('gen_123', { ...edit, max_cost_usd: total_cost_usd });
console.log(await client.generations.wait(edited.id));
