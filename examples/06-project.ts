import AutoContent from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const project = await client.projects.create({ website_url: 'https://acme.com' });
const analyzed = await client.projects.wait(project.id);

// Review the analyzed profile, then confirm it to start generating.
await client.projects.update(analyzed.id, { confirmed: true });
