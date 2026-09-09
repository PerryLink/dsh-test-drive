# Third-Party Notices

`dsh-test-drive` is licensed under the [Apache License 2.0](LICENSE). The
runtime imports only `node:` builtins, `@deepseek-ai/*` peer packages, and one
MIT-licensed helper mirrored from DeepSeek Harness (below); the dependencies
in the table are build/runtime tooling installed alongside the package.

| Package | Version range | License | Purpose |
|---|---|---|---|
| [typescript](https://github.com/microsoft/TypeScript) | `^5.9.0` | Apache-2.0 | Declarations and type checking in `scripts/prepare.mjs`. |
| [tsdown](https://github.com/rolldown/tsdown) | `^0.22.14` | MIT | ESM bundling of `src/` into `lib/` in `scripts/prepare.mjs`. |
| [zod](https://github.com/colinhacks/zod) | `^4.4.3` | MIT | Domain record schemas validated at the storage-domain durable boundary. |

## DeepSeek Harness — Zstandard frame scanner (mirrored, MIT)

- Source: <https://github.com/deepseek-ai/deepseek-harness>
  `packages/session/session-persistence-jsonl/src/zstd.ts` (`scanZstdFrames`,
  lines 48–104) at host baseline `dsh-v0.1.5-alpha.1` (commit `19d2e38480`)
- License: MIT
- Copyright (c) 2026 DeepSeek
- Local use: `src/session-log.ts` mirrors the structural frame scan because
  the helper is not part of the package's published surface, and a session
  artifact is a concatenated-frame Zstandard container that Node's whole-file
  decompression decodes only partially. The mirrored code is inlined into the
  built `lib/index.js`.

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

Peer dependencies (`@deepseek-ai/cordis`, `@deepseek-ai/schemastery`, and the
pinned `@deepseek-ai/dsh-*` packages) are provided by the DeepSeek Harness
installation and carry their own notices.
