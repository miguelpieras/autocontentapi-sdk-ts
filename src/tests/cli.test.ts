import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import { runCli } from '../cli/program.js';
import { buildGenerationDraft, CLIUsageError } from '../cli/requestBuilder.js';

test('simple generation flags translate to the canonical request shape', async () => {
  const draft = await buildGenerationDraft({
    project: 'prj_one',
    topic: 'Recoverable execution',
    currentWeb: true,
    lookbackDays: 7,
    source: ['src_one'],
    collection: ['col_one'],
    attachmentSource: ['src_brief', 'src_screenshot'],
    asset: ['article', 'quiz'],
    instructions: 'Write for API developers.'
  });
  assert.deepEqual(draft, {
    project_id: 'prj_one',
    input: {
      type: 'topic',
      topic: 'Recoverable execution',
      evidence_scope: 'project_and_web',
      lookback_days: 7,
      source_ids: ['src_one'],
      collection_ids: ['col_one']
    },
    attachment_source_ids: ['src_brief', 'src_screenshot'],
    instructions: 'Write for API developers.',
    assets: [{ asset_type: 'article' }, { asset_type: 'quiz' }]
  });
});

test('simple generation flags reject duplicate Asset types', async () => {
  await assert.rejects(buildGenerationDraft({
    project: 'prj_one',
    knowledge: true,
    asset: ['article', 'article']
  }), CLIUsageError);
});

test('--asset-config preserves an exact nested narration script', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'autocontent-sdk-cli-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const assetPath = join(directory, 'exact-short.json');
  await writeFile(assetPath, JSON.stringify({
    asset_type: 'short_video',
    language: 'de-DE',
    narration_script: {
      speakers: [{ id: 'narrator' }],
      segments: [{ speaker_id: 'narrator', text: 'Dieser Wortlaut bleibt exakt.' }]
    }
  }), 'utf8');
  const draft = await buildGenerationDraft({
    project: 'prj_one',
    knowledge: true,
    assetConfig: [`@${assetPath}`]
  });
  assert.deepEqual(draft.assets, [{
    asset_type: 'short_video',
    language: 'de-DE',
    narration_script: {
      speakers: [{ id: 'narrator' }],
      segments: [{ speaker_id: 'narrator', text: 'Dieser Wortlaut bleibt exakt.' }]
    }
  }]);
});

test('request-only Source intake is limited to collectionless local files', async () => {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  let output = '';
  stderr.on('data', chunk => { output += chunk.toString(); });
  const exitCode = await runCli([
    'sources', 'add', 'https://example.com/brief', '--project', 'prj_one', '--request-only'
  ], { stdout, stderr, environment: { AUTOCONTENT_API_KEY: 'acp_test' } });
  assert.equal(exitCode, 2);
  assert.match(output, /local file upload/u);
});

test('non-TTY generate requires an explicit maximum cost', async () => {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  let output = '';
  stderr.on('data', chunk => { output += chunk.toString(); });
  const exitCode = await runCli([
    'generate',
    '--project', 'prj_one',
    '--knowledge',
    '--asset', 'article'
  ], {
    stdout,
    stderr,
    environment: { AUTOCONTENT_API_KEY: 'acp_test' },
    fetch: async () => { throw new Error('fetch should not be called'); }
  });
  assert.equal(exitCode, 2);
  assert.match(output, /max-cost/u);
});

test('preview emits canonical JSON in non-TTY mode', async () => {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  let output = '';
  stdout.on('data', chunk => { output += chunk.toString(); });
  const exitCode = await runCli([
    'preview',
    '--project', 'prj_one',
    '--knowledge',
    '--asset', 'quiz'
  ], {
    stdout,
    stderr,
    environment: { AUTOCONTENT_API_KEY: 'acp_test' },
    fetch: async () => Response.json({ currency: 'usd', total_cost_usd: '0.50', assets: [] })
  });
  assert.equal(exitCode, 0);
  assert.deepEqual(JSON.parse(output), { currency: 'usd', total_cost_usd: '0.50', assets: [] });
});
