import { Command } from 'commander';
export interface CLIContext {
    stdin?: NodeJS.ReadableStream;
    stdout?: NodeJS.WritableStream;
    stderr?: NodeJS.WritableStream;
    environment?: NodeJS.ProcessEnv;
    fetch?: typeof globalThis.fetch;
}
interface Runtime {
    stdin: NodeJS.ReadableStream;
    stdout: NodeJS.WritableStream;
    stderr: NodeJS.WritableStream;
    environment: NodeJS.ProcessEnv;
    fetch?: typeof globalThis.fetch;
    exitCode: number;
}
export declare const runCli: (argv: string[], context?: CLIContext) => Promise<number>;
export declare const createProgram: (runtime: Runtime) => Command;
export {};
//# sourceMappingURL=program.d.ts.map