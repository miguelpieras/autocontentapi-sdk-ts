import type AutoContent from '../client.js';
import type { Generation } from '../types/index.js';
export declare const downloadGenerationArtifacts: (input: {
    client: AutoContent;
    generation: Generation;
    output?: string;
    outputDir?: string;
}) => Promise<string[]>;
//# sourceMappingURL=downloads.d.ts.map