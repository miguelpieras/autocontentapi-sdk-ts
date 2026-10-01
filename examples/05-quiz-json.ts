import AutoContent, { type QuizV1 } from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const asset = await client.assets.get('ast_123');
const file = asset.artifacts?.find(artifact => artifact.is_primary);
if (!file) throw new Error('The quiz is not ready yet.');

const quiz: QuizV1 = await (await client.downloadArtifact(file)).json();
console.log(quiz.questions);
