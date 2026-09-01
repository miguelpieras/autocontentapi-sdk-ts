import { constants, createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { basename } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Command, CommanderError } from 'commander';
import AutoContent from '../client.js';
import { loadApiKey, storeApiKey } from './config.js';
import { downloadGenerationArtifacts } from './downloads.js';
import { generationExitCode, loopRunExitCode, writeError, writeResult } from './output.js';
import { buildGenerationCreateRequest, buildGenerationDraft, CLIUsageError, collect, commaList, integer, positiveInteger, previewDraft, readJsonReference } from './requestBuilder.js';
const API_KEYS_URL = 'https://platform.autocontentapi.com/api-keys';
export const runCli = async (argv, context = {}) => {
    const runtime = {
        stdin: context.stdin ?? process.stdin,
        stdout: context.stdout ?? process.stdout,
        stderr: context.stderr ?? process.stderr,
        environment: context.environment ?? process.env,
        ...(context.fetch === undefined ? {} : { fetch: context.fetch }),
        exitCode: 0
    };
    const program = createProgram(runtime);
    try {
        await program.parseAsync(argv, { from: 'user' });
        return runtime.exitCode;
    }
    catch (error) {
        if (error instanceof CommanderError && ['commander.helpDisplayed', 'commander.version'].includes(error.code)) {
            return 0;
        }
        const normalized = error instanceof CommanderError ? new CLIUsageError(error.message) : error;
        return writeError(normalized, outputMode(program, runtime));
    }
};
export const createProgram = (runtime) => {
    const program = new Command();
    program
        .name('autocontent')
        .description('Create first-class content Assets with AutoContent Platform.')
        .version('0.1.0')
        .option('--json', 'print canonical JSON')
        .option('--human', 'force human-readable output')
        .option('--quiet', 'print only the created resource ID')
        .option('--base-url <url>', 'override the Platform API base URL')
        .option('--request-timeout-seconds <seconds>', 'HTTP request budget (1-960)', positiveInteger, 120)
        .showHelpAfterError()
        .exitOverride()
        .configureOutput({
        writeOut: value => runtime.stdout.write(value),
        writeErr: () => undefined
    });
    program.hook('preAction', root => {
        const opts = root.opts();
        if (opts.json === true && opts.human === true) {
            throw new CLIUsageError('--json and --human cannot be used together.');
        }
    });
    program.command('login [api-key]')
        .description('Store a Platform API key with owner-only permissions.')
        .action(async (apiKey) => {
        if (apiKey === undefined) {
            runtime.stdout.write(`Create an API key at ${API_KEYS_URL}\n`);
            return;
        }
        const path = await storeApiKey(apiKey, runtime.environment);
        runtime.stdout.write(`Platform API key stored securely in ${path}\n`);
    });
    program.command('whoami')
        .description('Show the authenticated Platform account.')
        .action(async () => {
        const client = await clientFor(program, runtime);
        writeResult(await client.account.get(requestOptions(program)), outputMode(program, runtime));
    });
    program.command('usage')
        .description('Show authoritative billing, balance, and resource usage.')
        .action(async () => {
        const client = await clientFor(program, runtime);
        writeResult(await client.billing.getUsage(requestOptions(program)), outputMode(program, runtime));
    });
    registerProjects(program, runtime);
    registerKnowledge(program, runtime);
    registerDiscovery(program, runtime);
    registerGenerationCommands(program, runtime);
    registerAssets(program, runtime);
    registerLoops(program, runtime);
    registerWebhooks(program, runtime);
    return program;
};
const registerProjects = (program, runtime) => {
    const projects = program.command('projects').description('Manage Projects.');
    withMutation(projects.command('create <website-url>'))
        .option('--wait', 'wait for analysis')
        .option('--wait-timeout-seconds <seconds>', 'polling budget (1-86400)', positiveInteger, 1_800)
        .action(async (websiteUrl, _options, command) => {
        if (command.opts().wait !== true && command.getOptionValueSource('waitTimeoutSeconds') === 'cli') {
            throw new CLIUsageError('--wait-timeout-seconds requires --wait.');
        }
        const client = await clientFor(program, runtime);
        const created = await client.projects.create({ website_url: websiteUrl }, mutationOptions(program, command));
        const result = command.opts().wait === true
            ? await client.projects.wait(created.id, waitOptions(program, command))
            : created;
        writeResult(result, outputMode(program, runtime), created.id);
        if ('status' in result && ['failed', 'archived'].includes(result.status))
            runtime.exitCode = 3;
    });
    withPage(projects.command('list'))
        .option('--status <status>')
        .action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        writeResult(await client.projects.list(compact({
            ...pageOptions(command),
            status: opts.status
        }), requestOptions(program)), outputMode(program, runtime));
    });
    projects.command('get <project-id>').action(async (projectId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.projects.get(projectId, requestOptions(program)), outputMode(program, runtime));
    });
    withMutation(projects.command('update <project-id>'))
        .option('--patch <@file>')
        .option('--category <category>')
        .option('--relevant-keywords <csv>')
        .option('--competitor-keywords <csv>')
        .option('--excluded-keywords <csv>')
        .option('--default-voice <voice-id-or-none>')
        .option('--default-avatar <avatar-id-or-none>')
        .option('--confirm')
        .action(async (projectId, _options, command) => {
        const opts = command.opts();
        const explicitFields = ['category', 'relevantKeywords', 'competitorKeywords', 'excludedKeywords', 'defaultVoice', 'defaultAvatar', 'confirm']
            .some(key => opts[key] !== undefined && opts[key] !== false);
        if (opts.patch !== undefined && explicitFields)
            throw new CLIUsageError('--patch cannot be mixed with update flags.');
        const patch = opts.patch !== undefined
            ? await readJsonReference(opts.patch)
            : compact({
                category: opts.category,
                relevant_keywords: opts.relevantKeywords === undefined ? undefined : commaList(opts.relevantKeywords),
                competitor_keywords: opts.competitorKeywords === undefined ? undefined : commaList(opts.competitorKeywords),
                excluded_keywords: opts.excludedKeywords === undefined ? undefined : commaList(opts.excludedKeywords),
                confirmed: opts.confirm === true ? true : undefined,
                brand: opts.defaultVoice === undefined && opts.defaultAvatar === undefined
                    ? undefined
                    : compact({
                        default_voice_id: nullableId(opts.defaultVoice),
                        default_avatar_id: nullableId(opts.defaultAvatar)
                    })
            });
        const client = await clientFor(program, runtime);
        writeResult(await client.projects.update(projectId, patch, mutationOptions(program, command)), outputMode(program, runtime));
    });
    withMutation(projects.command('refresh <project-id>')).action(async (projectId, _options, command) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.projects.refresh(projectId, mutationOptions(program, command)), outputMode(program, runtime));
    });
    projects.command('archive <project-id>').action(async (projectId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.projects.archive(projectId, requestOptions(program)), outputMode(program, runtime));
    });
    const logo = projects.command('logo');
    withMutation(logo.command('set <project-id> [file]'))
        .option('--source-url <url>')
        .action(async (projectId, file, _options, command) => {
        const opts = command.opts();
        if ((file === undefined) === (opts.sourceUrl === undefined)) {
            throw new CLIUsageError('Provide exactly one local file or --source-url.');
        }
        const input = file === undefined
            ? { source_url: opts.sourceUrl }
            : { file: () => createReadStream(file), filename: basename(file) };
        const client = await clientFor(program, runtime);
        writeResult(await client.projects.setLogo(projectId, input, mutationOptions(program, command)), outputMode(program, runtime));
    });
    logo.command('rm <project-id>').action(async (projectId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.projects.deleteLogo(projectId, requestOptions(program)), outputMode(program, runtime));
    });
};
const registerKnowledge = (program, runtime) => {
    const collections = program.command('collections');
    withMutation(collections.command('create'))
        .requiredOption('--project <project-id>')
        .requiredOption('--name <name>')
        .action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        const result = await client.collections.create(opts.project, { name: opts.name }, mutationOptions(program, command));
        writeResult(result, outputMode(program, runtime), result.id);
    });
    withPage(collections.command('list')).requiredOption('--project <project-id>').action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        writeResult(await client.collections.list(opts.project, pageOptions(command), requestOptions(program)), outputMode(program, runtime));
    });
    collections.command('rename <collection-id> <name>').action(async (collectionId, name) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.collections.update(collectionId, { name }, requestOptions(program)), outputMode(program, runtime));
    });
    collections.command('rm <collection-id>').action(async (collectionId) => {
        const client = await clientFor(program, runtime);
        await client.collections.delete(collectionId, requestOptions(program));
        writeResult({ deleted: true, id: collectionId }, outputMode(program, runtime));
    });
    const sources = program.command('sources');
    withMutation(sources.command('add [input]'))
        .requiredOption('--project <project-id>')
        .option('--product-visual <url>')
        .option('--collection <collection-id>')
        .option('--title <title>')
        .option('--request-only', 'keep a file outside reusable Project Knowledge for one Generation')
        .action(async (input, _options, command) => {
        const opts = command.opts();
        if ((input === undefined) === (opts.productVisual === undefined)) {
            throw new CLIUsageError('Provide exactly one input or --product-visual URL.');
        }
        const sourceInput = await sourceCreateInput(input, opts, runtime.stdin);
        const client = await clientFor(program, runtime);
        const result = await client.sources.create(opts.project, sourceInput, mutationOptions(program, command));
        writeResult(result, outputMode(program, runtime), result.id);
    });
    withPage(sources.command('list'))
        .requiredOption('--project <project-id>')
        .option('--collection <collection-id>')
        .option('--query <query>')
        .action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        writeResult(await client.sources.list(opts.project, compact({
            ...pageOptions(command),
            collection_id: opts.collection,
            query: opts.query
        }), requestOptions(program)), outputMode(program, runtime));
    });
    sources.command('get <source-id>').action(async (sourceId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.sources.get(sourceId, requestOptions(program)), outputMode(program, runtime));
    });
    withMutation(sources.command('refresh <source-id>')).action(async (sourceId, _options, command) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.sources.refresh(sourceId, mutationOptions(program, command)), outputMode(program, runtime));
    });
    sources.command('rm <source-id>').action(async (sourceId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.sources.delete(sourceId, requestOptions(program)), outputMode(program, runtime));
    });
};
const registerDiscovery = (program, runtime) => {
    const assetTypes = program.command('asset-types');
    withPage(assetTypes.command('list')).action(async (_options, command) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.assetTypes.list(pageOptions(command), requestOptions(program)), outputMode(program, runtime));
    });
    assetTypes.command('show <asset-type>').action(async (assetType) => {
        const client = await clientFor(program, runtime);
        const result = await findAcrossPages(cursor => client.assetTypes.list({ ...(cursor === undefined ? {} : { cursor }), limit: 100 }, requestOptions(program)), item => item.id === assetType);
        if (result === null)
            throw new CLIUsageError(`Asset type ${assetType} was not found in the live catalog.`);
        writeResult(result, outputMode(program, runtime));
    });
    const models = program.command('models');
    withPage(models.command('list')).requiredOption('--asset-type <asset-type>').action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        writeResult(await client.models.list({ asset_type: opts.assetType, ...pageOptions(command) }, requestOptions(program)), outputMode(program, runtime));
    });
    models.command('show <model-id>').requiredOption('--asset-type <asset-type>').action(async (modelId, _options, command) => {
        const client = await clientFor(program, runtime);
        const assetType = command.opts().assetType;
        const result = await findAcrossPages(cursor => client.models.list({ asset_type: assetType, ...(cursor === undefined ? {} : { cursor }), limit: 100 }, requestOptions(program)), item => item.id === modelId);
        if (result === null)
            throw new CLIUsageError(`Model ${modelId} was not found for ${assetType}.`);
        writeResult(result, outputMode(program, runtime));
    });
    registerMediaResource(program, runtime, 'voices');
    registerMediaResource(program, runtime, 'avatars');
};
const registerMediaResource = (program, runtime, family) => {
    const group = program.command(family);
    withPage(group.command('list'))
        .requiredOption('--project <project-id>')
        .option('--asset-type <asset-type>')
        .option('--model <model-id>')
        .option('--language <language>')
        .option('--kind <kind>')
        .option('--status <status>')
        .action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        const resource = client[family];
        writeResult(await resource.list(compact({
            project_id: opts.project,
            asset_type: opts.assetType,
            model: opts.model,
            language: opts.language,
            kind: opts.kind,
            status: opts.status,
            ...pageOptions(command)
        }), requestOptions(program)), outputMode(program, runtime));
    });
    withMutation(group.command('create [file]'))
        .requiredOption('--project <project-id>')
        .requiredOption('--name <display-name>')
        .option('--source-url <url>')
        .requiredOption('--consent')
        .requiredOption('--ownership')
        .action(async (file, _options, command) => {
        const opts = command.opts();
        if ((file === undefined) === (opts.sourceUrl === undefined)) {
            throw new CLIUsageError('Provide exactly one local file or --source-url.');
        }
        const input = file === undefined
            ? {
                display_name: opts.name,
                source_url: opts.sourceUrl,
                consent_attested: true,
                ownership_attested: true
            }
            : {
                display_name: opts.name,
                file: () => createReadStream(file),
                filename: basename(file),
                consent_attested: true,
                ownership_attested: true
            };
        const client = await clientFor(program, runtime);
        const result = await client[family].create(opts.project, input, mutationOptions(program, command));
        writeResult(result, outputMode(program, runtime), result.id);
    });
    group.command('get <id>').action(async (id) => {
        const client = await clientFor(program, runtime);
        writeResult(await client[family].get(id, requestOptions(program)), outputMode(program, runtime));
    });
    group.command('rm <id>').action(async (id) => {
        const client = await clientFor(program, runtime);
        writeResult(await client[family].delete(id, requestOptions(program)), outputMode(program, runtime));
    });
};
const registerGenerationCommands = (program, runtime) => {
    const preview = addRequestAttachmentFlags(addGenerationFlags(program.command('preview')));
    preview.action(async (_options, command) => {
        const draft = await buildGenerationDraft(command.opts());
        const client = await clientFor(program, runtime);
        writeResult(await client.generations.preview(previewDraft(draft), requestOptions(program)), outputMode(program, runtime));
    });
    const generate = withMutation(addRequestAttachmentFlags(addGenerationFlags(program.command('generate'))))
        .option('--max-cost <usd>')
        .option('--yes', 'skip TTY confirmation')
        .option('--wait', 'wait for completion')
        .option('--wait-timeout-seconds <seconds>', 'polling budget (1-86400)', positiveInteger, 1_800)
        .option('--output <path>')
        .option('--output-dir <directory>');
    generate.action(async (_options, command) => {
        const opts = command.opts();
        validateWaitAndOutput(opts, command);
        const draft = await buildGenerationDraft(opts);
        const client = await clientFor(program, runtime);
        let fallbackMaxCost;
        if (isInteractive(runtime)) {
            const quote = await client.generations.preview(previewDraft(draft), requestOptions(program));
            fallbackMaxCost = quote.total_cost_usd;
            if (opts.yes !== true && !await confirm(`Generate for up to $${opts.maxCost ?? fallbackMaxCost}?`, runtime))
                return;
        }
        else if (opts.maxCost === undefined && !hasEmbeddedCap(draft)) {
            throw new CLIUsageError('Non-interactive generation requires --max-cost or max_cost_usd in --request.');
        }
        const request = await buildGenerationCreateRequest(opts, fallbackMaxCost);
        const created = await client.generations.create(request, mutationOptions(program, command));
        const result = opts.wait === true ? await client.generations.wait(created.id, waitOptions(program, command)) : created;
        if (opts.output !== undefined || opts.outputDir !== undefined) {
            await downloadGenerationArtifacts({
                client,
                generation: result,
                ...(opts.output === undefined ? {} : { output: String(opts.output) }),
                ...(opts.outputDir === undefined ? {} : { outputDir: String(opts.outputDir) })
            });
        }
        writeResult(result, outputMode(program, runtime), created.id);
        runtime.exitCode = generationExitCode(result.status);
    });
    const generations = program.command('generations');
    generations.command('get <generation-id>').action(async (generationId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.generations.get(generationId, requestOptions(program)), outputMode(program, runtime));
    });
    generations.command('wait <generation-id>')
        .option('--wait-timeout-seconds <seconds>', 'polling budget (1-86400)', positiveInteger, 1_800)
        .option('--output <path>')
        .option('--output-dir <directory>')
        .action(async (generationId, _options, command) => {
        const opts = command.opts();
        if (opts.output !== undefined && opts.outputDir !== undefined)
            throw new CLIUsageError('Use either --output or --output-dir.');
        const client = await clientFor(program, runtime);
        const result = await client.generations.wait(generationId, waitOptions(program, command));
        await downloadGenerationArtifacts({
            client,
            generation: result,
            ...(opts.output === undefined ? {} : { output: opts.output }),
            ...(opts.outputDir === undefined ? {} : { outputDir: opts.outputDir })
        });
        writeResult(result, outputMode(program, runtime));
        runtime.exitCode = generationExitCode(result.status);
    });
    withPage(generations.command('list'))
        .option('--project <project-id>')
        .option('--status <status>')
        .option('--edited-from <generation-id>')
        .action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        writeResult(await client.generations.list(compact({
            project_id: opts.project,
            status: opts.status,
            edited_from_generation_id: opts.editedFrom,
            ...pageOptions(command)
        }), requestOptions(program)), outputMode(program, runtime));
    });
    generations.command('cancel <generation-id>').action(async (generationId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.generations.cancel(generationId, requestOptions(program)), outputMode(program, runtime));
    });
    generations.command('edit-preview <generation-id>')
        .requiredOption('--request <@file>')
        .action(async (generationId, _options, command) => {
        const input = await readJsonReference(command.opts().request);
        const client = await clientFor(program, runtime);
        writeResult(await client.generations.previewEdit(generationId, input, requestOptions(program)), outputMode(program, runtime));
    });
    withMutation(generations.command('edit <generation-id>'))
        .requiredOption('--request <@file>')
        .option('--max-cost <usd>')
        .option('--yes')
        .action(async (generationId, _options, command) => {
        const opts = command.opts();
        const input = await readJsonReference(opts.request);
        if (input.max_cost_usd !== undefined && opts.maxCost !== undefined) {
            throw new CLIUsageError('Use either max_cost_usd in --request or --max-cost, not both.');
        }
        const client = await clientFor(program, runtime);
        let cap = typeof input.max_cost_usd === 'string' ? input.max_cost_usd : opts.maxCost;
        if (isInteractive(runtime)) {
            const quote = await client.generations.previewEdit(generationId, omit(input, 'max_cost_usd'), requestOptions(program));
            cap ??= quote.total_cost_usd;
            if (opts.yes !== true && !await confirm(`Edit for up to $${cap}?`, runtime))
                return;
        }
        if (cap === undefined)
            throw new CLIUsageError('Generation edit requires --max-cost or max_cost_usd.');
        const result = await client.generations.edit(generationId, { ...input, max_cost_usd: cap }, mutationOptions(program, command));
        writeResult(result, outputMode(program, runtime), result.id);
    });
};
const registerAssets = (program, runtime) => {
    const assets = program.command('assets');
    withPage(assets.command('list'))
        .option('--project <project-id>')
        .option('--asset-type <asset-type>')
        .option('--origin <origin>')
        .option('--status <status>')
        .option('--created-from <timestamp>')
        .option('--created-before <timestamp>')
        .option('--input-type <input-type>')
        .option('--subject-query <query>')
        .action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        writeResult(await client.assets.list(compact({
            project_id: opts.project,
            asset_type: opts.assetType,
            origin: opts.origin,
            status: opts.status,
            created_at_from: opts.createdFrom,
            created_at_before: opts.createdBefore,
            input_type: opts.inputType,
            subject_query: opts.subjectQuery,
            ...pageOptions(command)
        }), requestOptions(program)), outputMode(program, runtime));
    });
    assets.command('get <asset-id>').action(async (assetId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.assets.get(assetId, requestOptions(program)), outputMode(program, runtime));
    });
    assets.command('feedback <asset-id>')
        .option('--useful')
        .option('--not-useful')
        .option('--reason <reason>')
        .action(async (assetId, _options, command) => {
        const opts = command.opts();
        if (Number(opts.useful === true) + Number(opts.notUseful === true) !== 1) {
            throw new CLIUsageError('Choose exactly one of --useful or --not-useful.');
        }
        const client = await clientFor(program, runtime);
        writeResult(await client.assets.feedback(assetId, compact({
            rating: opts.useful === true ? 'useful' : 'not_useful',
            reason: opts.reason
        }), requestOptions(program)), outputMode(program, runtime));
    });
};
const registerLoops = (program, runtime) => {
    const loops = program.command('loops');
    withMutation(addGenerationFlags(loops.command('create')))
        .option('--weekly <day>')
        .option('--time <HH:MM>')
        .option('--timezone <iana-time-zone>')
        .option('--max-cost-per-run <usd>')
        .option('--max-cost-per-month <usd>')
        .action(async (_options, command) => {
        const opts = command.opts();
        let input;
        if (opts.request !== undefined) {
            const mixed = opts.weekly !== undefined
                || opts.time !== undefined
                || opts.timezone !== undefined
                || opts.maxCostPerRun !== undefined
                || opts.maxCostPerMonth !== undefined
                || opts.project !== undefined
                || opts.trend === true
                || opts.topic !== undefined
                || opts.knowledge === true
                || (opts.asset?.length ?? 0) > 0
                || (opts.assetConfig?.length ?? 0) > 0;
            if (mixed)
                throw new CLIUsageError('--request cannot be mixed with Loop request-building flags.');
            input = await readJsonReference(opts.request);
        }
        else {
            if (opts.weekly === undefined || opts.time === undefined || opts.timezone === undefined
                || opts.maxCostPerRun === undefined || opts.maxCostPerMonth === undefined) {
                throw new CLIUsageError('Simple Loop creation requires --weekly, --time, --timezone, and both cost caps.');
            }
            const draft = await buildGenerationDraft(opts);
            input = {
                project_id: draft.project_id,
                input: draft.input,
                ...(draft.instructions === undefined ? {} : { instructions: draft.instructions }),
                schedule: {
                    frequency: 'weekly',
                    day_of_week: opts.weekly,
                    local_time: opts.time,
                    timezone: opts.timezone
                },
                assets: draft.assets,
                max_cost_per_run_usd: opts.maxCostPerRun,
                max_cost_per_month_usd: opts.maxCostPerMonth
            };
        }
        const client = await clientFor(program, runtime);
        const result = await client.contentLoops.create(input, mutationOptions(program, command));
        writeResult(result, outputMode(program, runtime), result.id);
    });
    withPage(loops.command('list'))
        .option('--project <project-id>')
        .option('--status <status>')
        .action(async (_options, command) => {
        const opts = command.opts();
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.list(compact({
            project_id: opts.project,
            status: opts.status,
            ...pageOptions(command)
        }), requestOptions(program)), outputMode(program, runtime));
    });
    loops.command('get <loop-id>').action(async (loopId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.get(loopId, requestOptions(program)), outputMode(program, runtime));
    });
    withMutation(loops.command('update <loop-id>')).requiredOption('--request <@file>').action(async (loopId, _options, command) => {
        const input = await readJsonReference(command.opts().request);
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.update(loopId, input, mutationOptions(program, command)), outputMode(program, runtime));
    });
    withMutation(loops.command('pause <loop-id>')).action(async (loopId, _options, command) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.pause(loopId, mutationOptions(program, command)), outputMode(program, runtime));
    });
    withMutation(loops.command('resume <loop-id>')).action(async (loopId, _options, command) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.resume(loopId, mutationOptions(program, command)), outputMode(program, runtime));
    });
    withMutation(loops.command('run <loop-id>')).requiredOption('--max-cost <usd>').action(async (loopId, _options, command) => {
        const client = await clientFor(program, runtime);
        const result = await client.contentLoops.run(loopId, { max_cost_usd: command.opts().maxCost }, mutationOptions(program, command));
        writeResult(result, outputMode(program, runtime), result.id);
        runtime.exitCode = loopRunExitCode(result.status);
    });
    const runs = loops.command('runs').argument('[loop-id]');
    withPage(runs).action(async (loopId, _options, command) => {
        if (loopId === undefined)
            throw new CLIUsageError('loops runs requires a Loop ID, or use loops runs get <run-id>.');
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.runs(loopId, pageOptions(command), requestOptions(program)), outputMode(program, runtime));
    });
    runs.command('get <run-id>').action(async (runId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.getRun(runId, requestOptions(program)), outputMode(program, runtime));
    });
    loops.command('feedback <run-id>')
        .option('--good-topic')
        .option('--bad-topic')
        .action(async (runId, _options, command) => {
        const opts = command.opts();
        if (Number(opts.goodTopic === true) + Number(opts.badTopic === true) !== 1) {
            throw new CLIUsageError('Choose exactly one of --good-topic or --bad-topic.');
        }
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.feedback(runId, {
            rating: opts.goodTopic === true ? 'good_topic' : 'bad_topic'
        }, requestOptions(program)), outputMode(program, runtime));
    });
    withMutation(loops.command('archive <loop-id>')).action(async (loopId, _options, command) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.contentLoops.archive(loopId, mutationOptions(program, command)), outputMode(program, runtime));
    });
};
const registerWebhooks = (program, runtime) => {
    const hooks = program.command('webhooks');
    withMutation(hooks.command('add <url>')).action(async (url, _options, command) => {
        const mode = outputMode(program, runtime);
        if (mode.quiet)
            throw new CLIUsageError('--quiet cannot be used when creating a webhook because its secret is returned once.');
        const client = await clientFor(program, runtime);
        const result = await client.webhooks.create({ url }, mutationOptions(program, command));
        writeResult(result, mode);
        if ('secret_unavailable' in result && result.secret_unavailable === true)
            runtime.exitCode = 3;
    });
    withPage(hooks.command('list')).action(async (_options, command) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.webhooks.list(pageOptions(command), requestOptions(program)), outputMode(program, runtime));
    });
    hooks.command('rm <webhook-id>').action(async (webhookId) => {
        const client = await clientFor(program, runtime);
        writeResult(await client.webhooks.delete(webhookId, requestOptions(program)), outputMode(program, runtime));
    });
};
const addGenerationFlags = (command) => command
    .option('--request <@file>')
    .option('--project <project-id>')
    .option('--trend')
    .option('--topic <text>')
    .option('--knowledge')
    .option('--current-web')
    .option('--lookback-days <days>', 'lookback window', integer)
    .option('--source <source-id>', 'scope to a Source', collect, [])
    .option('--collection <collection-id>', 'scope to a Collection', collect, [])
    .option('--asset <asset-type>', 'add an Asset', collect, [])
    .option('--asset-config <@file>', 'add a detailed Asset request', collect, [])
    .option('--instructions <instructions>');
const addRequestAttachmentFlags = (command) => command
    .option('--attachment-source <source-id>', 'attach a ready same-Project Source to this Generation', collect, []);
const withPage = (command) => command
    .option('--cursor <cursor>')
    .option('--limit <limit>', 'page size (1-100)', positiveInteger, 20);
const withMutation = (command) => command
    .option('--idempotency-key <key>');
const clientFor = async (program, runtime) => {
    const apiKey = await loadApiKey(runtime.environment);
    if (apiKey === null)
        throw new CLIUsageError(`No Platform API key found. Create one at ${API_KEYS_URL}, then run autocontent login.`);
    const opts = program.opts();
    const timeoutSeconds = boundedInteger(opts.requestTimeoutSeconds, 1, 960, '--request-timeout-seconds');
    return new AutoContent({
        apiKey,
        requestTimeoutMs: timeoutSeconds * 1_000,
        ...(opts.baseUrl === undefined ? {} : { baseUrl: opts.baseUrl }),
        ...(runtime.fetch === undefined ? {} : { fetch: runtime.fetch })
    });
};
const requestOptions = (program) => ({
    requestTimeoutMs: boundedInteger(program.opts().requestTimeoutSeconds, 1, 960, '--request-timeout-seconds') * 1_000
});
const mutationOptions = (program, command) => ({
    ...requestOptions(program),
    ...(command.opts().idempotencyKey === undefined ? {} : { idempotencyKey: command.opts().idempotencyKey })
});
const waitOptions = (program, command) => ({
    ...requestOptions(program),
    timeoutMs: boundedInteger(command.opts().waitTimeoutSeconds ?? 1_800, 1, 86_400, '--wait-timeout-seconds') * 1_000
});
const pageOptions = (command) => {
    const opts = command.opts();
    return {
        ...(opts.cursor === undefined ? {} : { cursor: opts.cursor }),
        limit: boundedInteger(opts.limit ?? 20, 1, 100, '--limit')
    };
};
const outputMode = (program, runtime) => {
    const opts = program.opts();
    return {
        json: opts.human === true ? false : opts.json === true || streamIsTTY(runtime.stdout) !== true,
        quiet: opts.quiet === true,
        stdout: runtime.stdout,
        stderr: runtime.stderr
    };
};
const sourceCreateInput = async (input, opts, stdin) => {
    const requestOnly = opts.requestOnly === true;
    const common = compact({ collection_id: opts.collection, title: opts.title });
    if (requestOnly && opts.collection !== undefined) {
        throw new CLIUsageError('--request-only cannot be combined with --collection.');
    }
    if (requestOnly && (typeof opts.productVisual === 'string' || input === '-' || (input !== undefined && /^https?:\/\//iu.test(input)))) {
        throw new CLIUsageError('--request-only is valid only for a local file upload.');
    }
    if (typeof opts.productVisual === 'string')
        return { type: 'product_visual', url: opts.productVisual, ...common };
    if (input === '-') {
        if (typeof opts.title !== 'string')
            throw new CLIUsageError('Reading Source text from stdin requires --title.');
        return { type: 'text', text: await readStream(stdin), title: opts.title, ...(opts.collection === undefined ? {} : { collection_id: opts.collection }) };
    }
    if (input === undefined)
        throw new CLIUsageError('A Source input is required.');
    if (/^https?:\/\//iu.test(input)) {
        return { type: isYouTubeUrl(input) ? 'youtube' : 'url', url: input, ...common };
    }
    await access(input, constants.R_OK);
    return {
        file: () => createReadStream(input),
        filename: basename(input),
        ...common,
        ...(requestOnly ? { keep_as_project_asset: false } : {})
    };
};
const readStream = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return Buffer.concat(chunks).toString('utf8');
};
const isYouTubeUrl = (value) => {
    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase().replace(/^www\./u, '');
        return host === 'youtu.be'
            || ((host === 'youtube.com' || host === 'm.youtube.com')
                && (url.pathname === '/watch' || url.pathname.startsWith('/shorts/')));
    }
    catch {
        return false;
    }
};
const findAcrossPages = async (load, predicate) => {
    let cursor;
    do {
        const page = await load(cursor);
        const found = page.data.find(predicate);
        if (found !== undefined)
            return found;
        cursor = page.next_cursor ?? undefined;
    } while (cursor !== undefined);
    return null;
};
const confirm = async (question, runtime) => {
    const terminal = createInterface({ input: runtime.stdin, output: runtime.stdout });
    try {
        const answer = await terminal.question(`${question} [y/N] `);
        return /^y(?:es)?$/iu.test(answer.trim());
    }
    finally {
        terminal.close();
    }
};
const isInteractive = (runtime) => streamIsTTY(runtime.stdin) === true && streamIsTTY(runtime.stdout) === true;
const streamIsTTY = (stream) => stream.isTTY;
const validateWaitAndOutput = (opts, command) => {
    if (opts.wait !== true && command.getOptionValueSource('waitTimeoutSeconds') === 'cli') {
        throw new CLIUsageError('--wait-timeout-seconds requires --wait.');
    }
    if ((opts.output !== undefined || opts.outputDir !== undefined) && opts.wait !== true) {
        throw new CLIUsageError('--output and --output-dir require --wait.');
    }
    if (opts.output !== undefined && opts.outputDir !== undefined)
        throw new CLIUsageError('Use either --output or --output-dir.');
};
const hasEmbeddedCap = (draft) => typeof draft.max_cost_usd === 'string';
const boundedInteger = (value, minimum, maximum, name) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum || value > maximum) {
        throw new CLIUsageError(`${name} must be an integer from ${minimum} to ${maximum}.`);
    }
    return value;
};
const nullableId = (value) => value === undefined ? undefined : value === 'none' ? null : String(value);
const compact = (value) => Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined));
const omit = (value, key) => Object.fromEntries(Object.entries(value).filter(([current]) => current !== key));
//# sourceMappingURL=program.js.map