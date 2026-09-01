import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type AutoContent from '../client.js';
import type { Generation } from '../types/index.js';
import { CLIUsageError } from './requestBuilder.js';

interface ArtifactLike {
  id: string;
  kind: string;
  mime_type: string;
  is_primary: boolean;
  url: string;
}

interface AssetLike {
  asset_type: string;
  artifacts: ArtifactLike[];
}

export const downloadGenerationArtifacts = async (input: {
  client: AutoContent;
  generation: Generation;
  output?: string;
  outputDir?: string;
}): Promise<string[]> => {
  if (input.output !== undefined && input.outputDir !== undefined) {
    throw new CLIUsageError('Use either --output or --output-dir, not both.');
  }
  const assets = (input.generation.assets ?? []).filter(hasArtifacts);
  if (input.output !== undefined) {
    const primary = assets.flatMap(asset => asset.artifacts.filter(artifact => artifact.is_primary));
    if (primary.length !== 1) {
      throw new CLIUsageError('--output requires exactly one primary Artifact in the completed Generation.');
    }
    await download(input.client, primary[0] as ArtifactLike, input.output);
    return [input.output];
  }
  if (input.outputDir === undefined) return [];

  const written: string[] = [];
  for (const asset of assets) {
    for (const artifact of asset.artifacts) {
      const extension = extensionFor(artifact.mime_type, artifact.url);
      const destination = join(
        input.outputDir,
        safeSegment(input.generation.id),
        safeSegment(asset.asset_type),
        `${safeSegment(artifact.kind)}${extension}`
      );
      await download(input.client, artifact, destination);
      written.push(destination);
    }
  }
  return written;
};

const download = async (client: AutoContent, artifact: ArtifactLike, destination: string): Promise<void> => {
  await mkdir(dirname(destination), { recursive: true });
  const response = await client.downloadArtifact(artifact);
  if (response.body === null) throw new Error(`Artifact ${artifact.id} returned an empty response body.`);
  const output = createWriteStream(destination, { flags: 'wx', mode: 0o600 });
  try {
    await pipeline(Readable.fromWeb(response.body as never), output);
  } catch (error) {
    output.destroy();
    await unlink(destination).catch(() => undefined);
    throw error;
  }
};

type GenerationAsset = NonNullable<Generation['assets']>[number];

const hasArtifacts = (asset: GenerationAsset): asset is GenerationAsset & AssetLike =>
  'artifacts' in asset && Array.isArray(asset.artifacts);

const safeSegment = (value: string): string => value.replace(/[^A-Za-z0-9_.-]/gu, '_');

const extensionFor = (mimeType: string, url: string): string => {
  const known: Record<string, string> = {
    'application/json': '.json',
    'application/pdf': '.pdf',
    'audio/mpeg': '.mp3',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'text/html': '.html',
    'text/markdown': '.md',
    'text/vtt': '.vtt',
    'video/mp4': '.mp4'
  };
  if (known[mimeType] !== undefined) return known[mimeType];
  try {
    const extension = extname(basename(new URL(url).pathname));
    return /^\.[A-Za-z0-9]{1,8}$/u.test(extension) ? extension : '';
  } catch {
    return '';
  }
};
