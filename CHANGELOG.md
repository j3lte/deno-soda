# Changelog

## [Unreleased]

## [0.5.0] - 2026-06-13

### Added

- `SodaQuery.pages()` / `rows()` — async iterators that page through the full
  result set (default page size 1000).
- `SodaQuery.executeAll(opts?)` — collect every page into one array (optional
  `max` cap).
- `SodaQuery.count()` — total count of rows matching the current filters.
- `SodaQuery.getColumns()` — typed column metadata (field name + data type) for
  the dataset.
- `SodaQuery.executeCSV()` — run the query against the `.csv` endpoint and
  return the raw CSV string.
- `Where.withinPolygon(field, wkt)` — `within_polygon` geospatial filter.
- `SelectImpl.log()` (`ln`) and `SelectImpl.unaccent()` select functions.
- `SelectCase(...)` — build SoQL `case(...)` expressions from `[condition, value]`
  pairs (condition is a `Where` or raw SoQL string).
- Arithmetic expression helpers `expr.add` / `sub` / `mul` / `div` / `mod` / `pow`
  (`+ - * / % ^`) that nest safely with parentheses.
- `llms.txt` ([llmstxt.org](https://llmstxt.org/)) project index, shipped in the
  JSR package (served at `https://jsr.io/@j3lte/soda/<version>/llms.txt`).

### Fixed

- **String escaping:** single quotes in values are now doubled (`''`) as SoQL
  requires, fixing broken queries and a SoQL-injection vector. Backslash and
  double-quote are left literal.
- **`distanceInMeters`** emits valid WKT `'POINT (lon lat)'` (was the invalid
  `'POINT(lon, lat)'`).
- **`Where.in` / `Where.notIn`** always parenthesize the set, including a single
  value: `in ('b')`.
- **`getMetaData`** throws when no dataset is set, consistent with `getURL`.
- **`limit(0)` / `offset(0)`** are emitted instead of being dropped.
- **`single(queryID)`** applies the single-row limit to a stored query.

### Removed

- `SelectImpl.pad()` (and the `pad_left`/`pad_right` `SelectFunction` members) —
  these return HTTP 400 on SODA 2.1 endpoints and are not documented by Socrata.

### Changed

- `Where.withinBox` / `Where.withinCircle` now accept Point / Line / Polygon /
  MultiPoint / MultiLine / MultiPolygon field objects, not just `Location`.
- `SelectImpl.abs()` and `length()` are documented as undocumented-but-working on
  SODA 2.1 (Socrata does not list them).
- The fixes above change the emitted SoQL for some inputs; output differs from
  prior releases for affected queries.

## [0.4.8] - 2026-06-13

### Fixed

- npm publishing in the release workflow.

## [0.4.7] - 2026-06-13

### Changed

- Added a verification step to the release workflow; minor pre-release updates.

## [0.4.6] - 2026-06-13

### Added

- `CLAUDE.md` project guidance.

### Changed

- Published to [JSR](https://jsr.io/@j3lte/soda) as `@j3lte/soda`; npm package
  built via dnt.
- Consolidated publishing into a single on-demand `Release` workflow (JSR + npm).
- Migrated dev dependencies to JSR `@std/*`; upgraded CI actions, Node 22 and
  Deno 2.x; reduced the CI matrix to Ubuntu + Windows.

### Removed

- `dev_deps.ts` (replaced by the `deno.json` import map).

## [0.4.5] - 2023-12-06

### Changed

- Testing improvements; fixed `single()` tests.

## [0.4.4] - 2023-12-06

### Added

- `AbortSignal` support for query execution (`execute`/`single` accept a signal).

## [0.4.3] - 2023-04-14

### Changed

- README and issue-template updates.

## [0.4.2] - 2023-04-14

### Changed

- Improved tests and documentation; clause tweaks.

## [0.4.1] - 2023-04-13

### Changed

- Release-pipeline fixes.

## [0.4.0] - 2023-04-13

### Added

- Automated release runner.

## [0.3.4] - 2023-04-13

### Added

- NPM build-and-publish pipeline (on-dispatch).

## [0.3.3] - 2023-04-13

### Changed

- Improved typings; runner and coverage-exclude updates.

## [0.3.2] - 2023-04-13

### Changed

- Restructured source files; type updates; JSDoc cleanup.

## [0.3.1] - 2023-04-12

### Changed

- JSDoc and documentation improvements.

## [0.3.0] - 2023-04-12

### Added

- Codecov integration and test coverage.

### Changed

- Type updates; excluded tests from coverage; documentation updates.

## [0.2.1] - 2023-04-12

### Added

- More documentation.

## [0.2.0] - 2023-04-12

### Added

- Additional query/builder methods.

## [0.1.1] - 2023-04-12

### Changed

- Typings and cleanup.

## [0.1.0] - 2023-04-12

### Added

- Initial release: SODA (Socrata) query client for Deno & Node.
