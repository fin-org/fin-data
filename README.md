# fin-data

- generate arbitrary unformatted [fin data](https://findata.dev) using [fast-check](https://fast-check.dev/)
- include a reference implementation for formatting
- `/core` directory follows the [core spec](https://findata.dev/spec) (with builtins).
- intention is to provide a language-agnostic framework to test & benchmark fin encoders/decoders.
- why [deno](https://deno.com)? It's got great tooling and is suitable to scripting tasks.
- PRs welcome! [contributing guide](https://findata.dev/contribute)

## usage

not much yet

- `deno test core` to test the reference formatter
- `deno run core/gen.ts` to generate fin notation
