export interface OutputMode {
    json: boolean;
    quiet: boolean;
    stdout: NodeJS.WritableStream;
    stderr: NodeJS.WritableStream;
}
export declare const writeResult: (value: unknown, mode: OutputMode, createdId?: string) => void;
export declare const writeError: (error: unknown, mode: OutputMode) => number;
export declare const exitCodeForError: (error: unknown) => number;
export declare const generationExitCode: (status: string) => number;
export declare const loopRunExitCode: (status: string) => number;
//# sourceMappingURL=output.d.ts.map