import type { WebhookEvent } from './types/index.js';
export interface ConstructWebhookEventInput {
    rawBody: string | Uint8Array;
    signature: string | string[] | undefined;
    eventId: string | string[] | undefined;
    secret: string;
    toleranceSeconds?: number;
    now?: Date;
}
export declare const constructWebhookEvent: (input: ConstructWebhookEventInput) => WebhookEvent;
export declare const webhooks: Readonly<{
    constructEvent: (input: ConstructWebhookEventInput) => WebhookEvent;
}>;
//# sourceMappingURL=webhooks.d.ts.map