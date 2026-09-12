import assert from 'node:assert/strict';
import test from 'node:test';
import AutoContent from '../client.js';
test('concrete repeated outputs use deterministic plan endpoints without starting inference', async () => {
    const requests = [];
    const client = new AutoContent({ apiKey: 'acp_test', fetch: async (input, init) => {
            requests.push(new Request(input, init));
            return Response.json({ id: 'apn_batch', revision: 3, status: 'draft' });
        } });
    const plan = { project_id: 'prj_test', items: [
            { id: 'out_first', brief: 'First deliberate hook', input: { type: 'topic', topic: 'A useful lesson' }, asset: { asset_type: 'short_video', options: { duration_seconds: 30, captions: false } } },
            { id: 'out_second', brief: 'Second deliberate hook', input: { type: 'topic', topic: 'A useful lesson' }, asset: { asset_type: 'short_video', language: 'fr-FR', options: { duration_seconds: 30 } } }
        ] };
    await client.agent.prepareOutputs({ plan });
    await client.agent.acceptOutputs('apn_batch', { expected_revision: 3, max_cost_usd: '4.00', budget_scope: 'outputs' });
    await client.agent.getOutputs('apn_batch');
    await client.agent.cancelOutputs('apn_batch');
    assert.deepEqual(requests.map(request => new URL(request.url).pathname), [
        '/v1/agent/plans/preview', '/v1/agent/plans/apn_batch/accept', '/v1/agent/plans/apn_batch', '/v1/agent/plans/apn_batch/cancel'
    ]);
    assert.deepEqual(await requests[0].json(), { plan });
    assert.deepEqual(await requests[1].json(), { expected_revision: 3, max_cost_usd: '4.00', budget_scope: 'outputs' });
});
test('managed messages preserve captured page and caller request identity', async () => {
    const requests = [];
    const client = new AutoContent({ getAccessToken: () => 'own_oauth', fetch: async (input, init) => {
            requests.push(new Request(input, init));
            return Response.json({ id: 'agt_message', status: 'queued' }, { status: 202 });
        } });
    await client.agent.send({ message: 'Explain this page', inference_max_cost_usd: '0.10',
        page: { tab_id: 'd3e3df9f-8111-4e9a-8c0a-20599180bff8', view_id: '1b116b82-8bbe-4cb2-9650-bf657c7403fd',
            revision: 1, view: 'create', state: 'ready', project_id: 'prj_original', resource_id: null,
            selected_source_ids: [], selected_collection_ids: [], selected_asset_ids: [], selected_generation_ids: [],
            filters: {}, actions: [], draft: null, proposal: null }, attachment_source_ids: [] }, { idempotencyKey: 'same-message-even-after-navigation' });
    assert.equal(requests[0].headers.get('authorization'), 'Bearer own_oauth');
    assert.equal(requests[0].headers.get('idempotency-key'), 'same-message-even-after-navigation');
    const sent = await requests[0].json();
    assert.equal(sent.page.project_id, 'prj_original');
});
//# sourceMappingURL=agent.test.js.map