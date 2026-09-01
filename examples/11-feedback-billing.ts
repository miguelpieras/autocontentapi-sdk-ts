import AutoContent from 'autocontentapi';
import { createClient } from './_client.js';

declare const platformSession: { getAccessToken(): string | Promise<string> };

const apiClient = createClient();
await apiClient.assets.feedback('ast_acme', {
  rating: 'useful',
  reason: 'Published in the product newsletter.'
});

// Funding is intentionally OAuth-only and is normally initiated by the Platform app.
const accountClient = new AutoContent({
  getAccessToken: () => platformSession.getAccessToken()
});
const usage = await accountClient.billing.getUsage();
if (Number(usage.prepayment_maximum_usd) >= Number(usage.prepayment_minimum_usd)) {
  const checkout = await accountClient.billing.createPrepaymentSession({
    amount_usd: usage.prepayment_minimum_usd,
    return_to: 'https://platform.autocontentapi.com/usage'
  });
  console.log(checkout.checkout_url);
}
