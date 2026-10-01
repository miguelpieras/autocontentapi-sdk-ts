import AutoContent, { type AssetRequest } from 'autocontentapi';

const client = new AutoContent({ apiKey: process.env.AUTOCONTENT_API_KEY });

const assets: AssetRequest[] = [{ asset_type: 'article' }];
const { total_cost_usd } = await client.generations.preview({ project_id: 'prj_123', input: { type: 'trend' }, assets });

await client.contentLoops.create({
  project_id: 'prj_123',
  input: { type: 'trend' },
  assets,
  schedule: { frequency: 'weekly', day_of_week: 'monday', local_time: '09:00', timezone: 'Europe/Madrid' },
  max_cost_per_run_usd: total_cost_usd,
  max_cost_per_month_usd: '50.00'
});
