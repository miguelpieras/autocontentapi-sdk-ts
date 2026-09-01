import AutoContent from 'autocontentapi';

export const createClient = (): AutoContent => {
  const apiKey = process.env.AUTOCONTENT_API_KEY;
  if (!apiKey) throw new Error('Set AUTOCONTENT_API_KEY.');
  return new AutoContent({ apiKey });
};
