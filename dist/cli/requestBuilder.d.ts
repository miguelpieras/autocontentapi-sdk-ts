import type { GenerationCreateRequest, GenerationDraft } from '../types/index.js';
export interface GenerationFlags {
    project?: string;
    trend?: boolean;
    topic?: string;
    knowledge?: boolean;
    currentWeb?: boolean;
    lookbackDays?: number;
    source?: string[];
    collection?: string[];
    attachmentSource?: string[];
    asset?: string[];
    assetConfig?: string[];
    instructions?: string;
    request?: string;
    maxCost?: string;
}
export declare const readJsonReference: <T = unknown>(reference: string) => Promise<T>;
export declare const buildGenerationDraft: (flags: GenerationFlags) => Promise<GenerationDraft>;
export declare const buildGenerationCreateRequest: (flags: GenerationFlags, fallbackMaxCost?: string) => Promise<GenerationCreateRequest>;
export declare const previewDraft: (draft: GenerationDraft) => GenerationDraft;
export declare class CLIUsageError extends Error {
    readonly code = "invalid_request";
    constructor(message: string);
}
export declare const collect: (value: string, previous: string[]) => string[];
export declare const commaList: (value: string) => string[];
export declare const integer: (value: string) => number;
export declare const positiveInteger: (value: string) => number;
//# sourceMappingURL=requestBuilder.d.ts.map