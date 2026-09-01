import { createReadStream } from 'node:fs';
import { createClient } from './_client.js';

const client = createClient();
const projectId = 'prj_acme';

await client.projects.setLogo(projectId, {
  file: () => createReadStream('./logo.png'),
  filename: 'logo.png'
});

const voice = await client.voices.create(projectId, {
  display_name: 'Acme narrator',
  file: () => createReadStream('./voice.mp3'),
  filename: 'voice.mp3',
  consent_attested: true,
  ownership_attested: true
});
const avatar = await client.avatars.create(projectId, {
  display_name: 'Acme presenter',
  file: () => createReadStream('./presenter.mp4'),
  filename: 'presenter.mp4',
  consent_attested: true,
  ownership_attested: true
});

while ((await client.voices.get(voice.id)).status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2_000));
}
while ((await client.avatars.get(avatar.id)).status === 'processing') {
  await new Promise(resolve => setTimeout(resolve, 2_000));
}
if ((await client.voices.get(voice.id)).status !== 'ready') throw new Error('Voice creation failed.');
if ((await client.avatars.get(avatar.id)).status !== 'ready') throw new Error('Avatar creation failed.');

// Set the exact ready resources as Project defaults.
await client.projects.update(projectId, {
  brand: { default_voice_id: voice.id, default_avatar_id: avatar.id }
});

// Per-Asset voice_id/avatar_id override the Project defaults. Revocation blocks
// future acceptance but does not rewrite already accepted Generation snapshots.
await client.voices.delete(voice.id);
await client.avatars.delete(avatar.id);
