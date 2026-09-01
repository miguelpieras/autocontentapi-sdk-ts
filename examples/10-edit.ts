import { createClient } from './_client.js';

const client = createClient();
const edit = {
  assets: [{ asset_id: 'ast_original', instructions: 'Make the conclusion more actionable.' }]
};
const preview = await client.generations.previewEdit('gen_original', edit);
const accepted = await client.generations.edit('gen_original', {
  ...edit,
  max_cost_usd: preview.total_cost_usd
});
console.log(await client.generations.wait(accepted.id));
