import { writeFile } from 'node:fs/promises';
import AutoContent from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const asset = await client.assets.get('ast_123');
for (const artifact of asset.artifacts ?? []) {
  const response = await client.downloadArtifact(artifact);
  await writeFile(artifact.id, Buffer.from(await response.arrayBuffer()));
}
