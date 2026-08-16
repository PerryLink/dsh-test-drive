# Third-Party Notices

`dsh-test-drive` is licensed under the [Apache License 2.0](LICENSE). The
runtime imports only `node:` builtins and `@deepseek-ai/*` peer packages; the
dependencies below are build/runtime tooling installed alongside the package.

| Package | Version range | License | Purpose |
|---|---|---|---|
| [typescript](https://github.com/microsoft/TypeScript) | `^5.9.0` | Apache-2.0 | Declarations and type checking in `scripts/prepare.mjs`. |
| [tsdown](https://github.com/rolldown/tsdown) | `^0.22.14` | MIT | ESM bundling of `src/` into `lib/` in `scripts/prepare.mjs`. |
| [zod](https://github.com/colinhacks/zod) | `^4.4.3` | MIT | Domain record schemas validated at the storage-domain durable boundary. |

Peer dependencies (`@deepseek-ai/cordis`, `@deepseek-ai/schemastery`, and the
pinned `@deepseek-ai/dsh-*` packages) are provided by the DeepSeek Harness
installation and carry their own notices.
