# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

The developer handles all `git commit`, `git push`, and tag/release operations himself. Do not commit or push unless explicitly asked. Make code changes and leave them staged/unstaged for him to review.

## Claude files

Put all Claude-related files (specs, plans, scratch notes, and any other generated artifacts) under `.claude/`. That folder is gitignored, so nothing there is committed or published. `CLAUDE.md` itself stays at the repo root (Claude Code loads it from there).

## Static analysis (fallow)

Whenever `fallow` is installed (`command -v fallow`), analyse the code with it after making changes. Use `fallow audit` for the changed files, or `fallow dead-code` / `fallow health` / `fallow dupes` for the whole codebase. Config lives in `.fallowrc.jsonc`; the `.fallow/` cache is gitignored.

Caveat: this is a **library**, so `dead-code` reports the public API (exported `SelectImpl`/`SodaQuery`/`Where` methods, exported enum members) as "unused" — those are false positives consumed by external users. Act on genuinely internal dead code, complexity hotspots, and duplication; ignore the public-API noise.

## Commands

Deno tasks (defined in `deno.json`):

- `deno task test` — run all tests with coverage into `.coverage/`
- `deno task test:watch` — re-run tests on change
- `deno test test/Where.test.ts` — run a single test file
- `deno test --filter "name"` — run tests matching a name
- `deno task lint` — lint `src/` and `test/`
- `deno task format` — format `src/` and `test/`
- `deno task coverage` — emit `.coverage/coverage.lcov`
- `deno task local-test` — watch-mode runner (`scripts/run-test.ts`) that builds an HTML coverage report via `genhtml` (needs `lcov` installed)
- `deno task npm <version>` — build the NPM package into `npm/` via dnt

CI (`.github/workflows/main.yml`) runs `deno fmt --check`, `deno task lint`, and `deno task test` on Linux/Windows/macOS. Lint enforces two non-default rules: `ban-untagged-todo` and `explicit-function-return-type` — every function needs an explicit return type, and TODOs must be tagged.

## Architecture

SODA query client for the Socrata Open Data API. Fetch-only (no create/update/delete). Targets both Deno (via `deno.land/x/soda`) and Node (NPM `soda-query`).

`src/mod.ts` is the single public entrypoint; `mod.ts` at root re-exports it. The NPM build (`npm/`) is generated output from dnt — never edit it by hand.

Core pieces:

- **`Query.ts` (`SodaQuery<T>`)** — the chainable builder and HTTP layer. Holds query state in private fields (`#select`, `#where`, `#group`, `#order`, etc.), each filled by chainable methods that return `this`. Three mutually-exclusive query modes coexist: the fluent builder, `simple()` (raw key/value SoQL params), and `soql()` (a full raw `$query` string). `buildQuery()` serializes state to a `QueryObj`; `getURL()` builds the request URL via `toQS()`. Terminal methods: `execute()`, `single()`, `executeGeoJSON()`, `getMetaData()`. Auth (`X-App-Token`, Basic, OAuth) is derived from `AuthOpts` in `requestHeaders`. All requests resolve to `DataResponse<T>` = `{ error, status, data }` — errors are returned, not thrown (except missing dataset).
- **`Where.ts`** — immutable filter expressions built only through static factory methods (`Where.eq`, `Where.and`, `Where.like`, `Where.between`, `Where.withinCircle`, `Where.intersects`, …). Each returns a `Where` whose `.value` is a SoQL fragment string. Compose with `Where.and` / `Where.or`.
- **`Select.ts` + `SelectImpl.ts`** — `Select("col")` returns a `SelectImpl` supporting aggregates and aliases (`.count()`, `.avg()`, `.sum()`, `.as()`). Named exports like `SelectGreatest`, `SelectRegrSlope` wrap SoQL functions.
- **`Order.ts` (`Order`)** — `Order.by("col").desc` style ordering objects.
- **`Field.ts`** — `Field(name, DataType)` returns a typed `FieldImpl` for type-safe use in `select`/`where`/`groupBy`. `SystemFields` covers Socrata `:id`-style columns.
- **`types.ts`** — shared types/enums: `DataType`, `AuthOpts`, `Options`, `DataResponse`, `QueryObj`, `FieldImpl`.
- **`utils/`** — `qs.ts` (`toQS`, object→querystring, `%20`→`+`), `expr.ts` (`addExpr` normalizes string/object/`Where` args into a target array; `expr.and`/`expr.or`), `param.ts` (`replaceParams` for `?`/`??` placeholder substitution and date/string escaping).

`where`, `having`, and `groupBy` accept mixed inputs — plain strings, `{field: value}` objects, or `Where`/`FieldImpl` instances — normalized through `addExpr`.

`dev_deps.ts` holds test-only and script-only imports kept out of the published bundle.
