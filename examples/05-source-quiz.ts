import { createReadStream } from 'node:fs';
import { type QuizV1 } from 'autocontentapi';
import { createClient } from './_client.js';

const client = createClient();
const source = await client.sources.create('prj_acme', {
  file: () => createReadStream('./product-guide.pdf'),
  filename: 'product-guide.pdf'
});
while ((await client.sources.get(source.id)).status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2_000));
}
if ((await client.sources.get(source.id)).status !== 'ready') throw new Error('Source ingestion failed.');

const draft = {
  project_id: 'prj_acme',
  input: { type: 'knowledge' as const, source_ids: [source.id] },
  assets: [{ asset_type: 'quiz' as const, options: { question_count: 15, difficulty: 'advanced' as const } }]
};
const preview = await client.generations.preview(draft);
const accepted = await client.generations.create({ ...draft, max_cost_usd: preview.total_cost_usd });
const completed = await client.generations.wait(accepted.id);
const fullAsset = completed.assets?.find(asset => 'artifacts' in asset);
const primary = fullAsset && 'artifacts' in fullAsset
  ? fullAsset.artifacts.find(artifact => artifact.is_primary)
  : undefined;
if (!primary) throw new Error('Quiz primary Artifact is unavailable.');
const quiz: QuizV1 = await client.downloadArtifact(primary).then(response => response.json());
if (quiz.schema_version !== 'quiz.v1') throw new Error('Unexpected Quiz schema.');
