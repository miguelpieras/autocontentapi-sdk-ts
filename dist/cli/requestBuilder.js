import { readFile } from 'node:fs/promises';
export const readJsonReference = async (reference) => {
    if (!reference.startsWith('@') || reference.length === 1) {
        throw new CLIUsageError('JSON file arguments must use @path syntax.');
    }
    let decoded;
    try {
        decoded = JSON.parse(await readFile(reference.slice(1), 'utf8'));
    }
    catch (error) {
        throw new CLIUsageError(`Could not read JSON from ${reference}: ${errorMessage(error)}`);
    }
    return decoded;
};
export const buildGenerationDraft = async (flags) => {
    if (flags.request !== undefined) {
        assertNoBuilderFlags(flags);
        const request = await readJsonReference(flags.request);
        if (!isRecord(request))
            throw new CLIUsageError('Generation request JSON must be an object.');
        return request;
    }
    if (flags.project === undefined)
        throw new CLIUsageError('--project is required.');
    const inputCount = Number(flags.trend === true) + Number(flags.topic !== undefined) + Number(flags.knowledge === true);
    if (inputCount !== 1)
        throw new CLIUsageError('Exactly one of --trend, --topic, or --knowledge is required.');
    if (flags.currentWeb === true && flags.topic === undefined) {
        throw new CLIUsageError('--current-web is valid only with --topic.');
    }
    if (flags.lookbackDays !== undefined && flags.trend !== true && flags.currentWeb !== true) {
        throw new CLIUsageError('--lookback-days is valid only with --trend or --topic --current-web.');
    }
    const assets = [];
    for (const assetType of flags.asset ?? [])
        assets.push({ asset_type: assetType });
    for (const reference of flags.assetConfig ?? []) {
        const asset = await readJsonReference(reference);
        if (!isRecord(asset) || typeof asset.asset_type !== 'string') {
            throw new CLIUsageError(`${reference} must contain an Asset request with asset_type.`);
        }
        assets.push(asset);
    }
    if (assets.length === 0)
        throw new CLIUsageError('At least one --asset or --asset-config is required.');
    const assetTypes = assets.map(asset => asset.asset_type);
    if (new Set(assetTypes).size !== assetTypes.length) {
        throw new CLIUsageError('Asset types cannot be duplicated in one request.');
    }
    const source_ids = nonEmpty(flags.source);
    const collection_ids = nonEmpty(flags.collection);
    const input = flags.trend === true
        ? compact({ type: 'trend', lookback_days: flags.lookbackDays })
        : flags.topic !== undefined
            ? compact({
                type: 'topic',
                topic: flags.topic,
                evidence_scope: flags.currentWeb === true ? 'project_and_web' : undefined,
                lookback_days: flags.lookbackDays,
                source_ids,
                collection_ids
            })
            : compact({ type: 'knowledge', source_ids, collection_ids });
    return compact({
        project_id: flags.project,
        input,
        attachment_source_ids: nonEmpty(flags.attachmentSource),
        instructions: flags.instructions,
        assets
    });
};
export const buildGenerationCreateRequest = async (flags, fallbackMaxCost) => {
    const draft = await buildGenerationDraft(flags);
    const embedded = isRecord(draft) && typeof draft.max_cost_usd === 'string'
        ? draft.max_cost_usd
        : undefined;
    if (embedded !== undefined && flags.maxCost !== undefined) {
        throw new CLIUsageError('Use either max_cost_usd in --request or --max-cost, not both.');
    }
    const maxCost = flags.maxCost ?? embedded ?? fallbackMaxCost;
    if (maxCost === undefined)
        throw new CLIUsageError('A maximum cost is required.');
    return { ...draft, max_cost_usd: maxCost };
};
export const previewDraft = (draft) => {
    const { max_cost_usd: _ignored, ...preview } = draft;
    return preview;
};
export class CLIUsageError extends Error {
    code = 'invalid_request';
    constructor(message) {
        super(message);
        this.name = 'CLIUsageError';
    }
}
export const collect = (value, previous) => [...previous, value];
export const commaList = (value) => value.split(',').map(item => item.trim()).filter(item => item.length > 0);
export const integer = (value) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed))
        throw new CLIUsageError(`Expected an integer, received ${value}.`);
    return parsed;
};
export const positiveInteger = (value) => {
    const parsed = integer(value);
    if (parsed < 1)
        throw new CLIUsageError(`Expected a positive integer, received ${value}.`);
    return parsed;
};
const assertNoBuilderFlags = (flags) => {
    const mixed = flags.project !== undefined
        || flags.trend === true
        || flags.topic !== undefined
        || flags.knowledge === true
        || flags.currentWeb === true
        || flags.lookbackDays !== undefined
        || (flags.source?.length ?? 0) > 0
        || (flags.collection?.length ?? 0) > 0
        || (flags.attachmentSource?.length ?? 0) > 0
        || (flags.asset?.length ?? 0) > 0
        || (flags.assetConfig?.length ?? 0) > 0
        || flags.instructions !== undefined;
    if (mixed)
        throw new CLIUsageError('--request cannot be mixed with request-building flags.');
};
const compact = (value) => Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined));
const nonEmpty = (value) => value !== undefined && value.length > 0 ? value : undefined;
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const errorMessage = (error) => error instanceof Error ? error.message : String(error);
//# sourceMappingURL=requestBuilder.js.map