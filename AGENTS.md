# Repository working rules

This repository contains the public TypeScript SDK and `autocontent` CLI for the
AutoContent Platform API. The canonical product contracts are
`../autocontentapi-node/PLANS/v1-sdk-plan.md`,
`../autocontentapi-node/PLANS/v1-cli-plan.md`, and the checked-in OpenAPI file.

Keep the SDK thin: preserve API `snake_case`, never calculate prices locally,
never add fallback providers, and retain idempotency keys across transport
retries. Use NodeNext ESM, strict TypeScript, two-space indentation, single
quotes, semicolons, and `.js` suffixes for relative imports. Work directly on
`main`. Run `npm run check` before committing.
