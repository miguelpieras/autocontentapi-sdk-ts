import type { WaitOptions } from './types/index.js';
export declare const waitForResource: <T extends {
    poll_after_seconds?: number | null;
}>(input: {
    resourceType: "project" | "generation";
    resourceId: string;
    get: () => Promise<T>;
    isTerminal: (value: T) => boolean;
    options?: WaitOptions;
}) => Promise<T>;
//# sourceMappingURL=polling.d.ts.map