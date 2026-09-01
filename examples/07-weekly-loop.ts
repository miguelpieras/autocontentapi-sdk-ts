import { createClient } from './_client.js';

const client = createClient();
const loopAssets = [
  { asset_type: 'lead_magnet' as const },
  { asset_type: 'short_video' as const }
];
const preview = await client.generations.preview({
  project_id: 'prj_acme',
  input: { type: 'trend' },
  assets: loopAssets
});
const monthlyCap = process.env.AUTOCONTENT_LOOP_MONTH_CAP_USD;
if (!monthlyCap) throw new Error('Choose AUTOCONTENT_LOOP_MONTH_CAP_USD.');

await client.contentLoops.create({
  project_id: 'prj_acme',
  input: { type: 'trend', lookback_days: 7 },
  instructions: 'Focus on practical implications for API builders.',
  schedule: { frequency: 'weekly', day_of_week: 'monday', local_time: '09:00', timezone: 'Europe/Madrid' },
  assets: loopAssets,
  max_cost_per_run_usd: preview.total_cost_usd,
  max_cost_per_month_usd: monthlyCap
});
