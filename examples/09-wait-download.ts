import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createClient } from './_client.js';

const client = createClient();
const completed = await client.generations.wait('gen_acme');
for (const asset of completed.assets ?? []) {
  if (!('artifacts' in asset)) continue;
  for (const artifact of asset.artifacts) {
    const response = await client.downloadArtifact(artifact);
    if (!response.body) throw new Error(`Artifact ${artifact.id} has no body.`);
    await pipeline(Readable.fromWeb(response.body as never), createWriteStream(`./${artifact.id}`));
  }
}
