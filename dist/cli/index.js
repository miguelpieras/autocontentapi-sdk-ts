#!/usr/bin/env node
import { runCli } from './program.js';
process.exitCode = await runCli(process.argv.slice(2));
//# sourceMappingURL=index.js.map