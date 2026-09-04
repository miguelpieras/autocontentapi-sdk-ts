import assert from 'node:assert/strict';
import test from 'node:test';
const exactFaceless = {
    asset_type: 'short_video',
    language: 'de-DE',
    narration_script: {
        speakers: [{ id: 'narrator' }],
        segments: [{ speaker_id: 'narrator', text: 'Dieser Wortlaut bleibt exakt.' }]
    }
};
const exactAvatar = {
    asset_type: 'explainer_video',
    options: {
        presentation_mode: 'avatar',
        duration_seconds: 60,
        caption_style: 'social_highlight',
        caption_font: 'montserrat',
        caption_position: 'bottom'
    },
    narration_script: {
        speakers: [
            { id: 'host', voice_id: 'voice_host', avatar_id: 'avatar_host' },
            { id: 'expert', voice_id: 'voice_expert', avatar_id: 'avatar_expert' }
        ],
        segments: [
            { speaker_id: 'host', text: 'Erster freigegebener Satz.' },
            { speaker_id: 'expert', text: 'Zweiter freigegebener Satz.' }
        ]
    }
};
const edit = {
    assets: [{ asset_id: 'ast_one', narration_script: null }]
};
const loop = {
    project_id: 'prj_one',
    input: { type: 'knowledge' },
    schedule: { frequency: 'daily', local_time: '09:00', timezone: 'UTC' },
    assets: [exactFaceless],
    max_cost_per_run_usd: '5.00',
    max_cost_per_month_usd: '50.00'
};
test('exact narration request, edit, and Content Loop types preserve the nested contract', () => {
    assert.equal(exactAvatar.narration_script.speakers.length, 2);
    assert.equal(exactAvatar.narration_script.speakers[1].avatar_id, 'avatar_expert');
    assert.equal(exactAvatar.options.caption_style, 'social_highlight');
    assert.equal(edit.assets[0]?.narration_script, null);
    assert.equal(loop.assets[0]?.asset_type, 'short_video');
});
//# sourceMappingURL=narrationTypes.test.js.map