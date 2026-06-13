# SODA Query

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/j3lte/deno-soda?style=for-the-badge)](https://github.com/j3lte/deno-soda/releases/latest "GitHub release (latest by date)")
[![NPM Version](https://img.shields.io/npm/v/soda-query?style=for-the-badge)](https://www.npmjs.com/package/soda-query "NPM Version")
[![GitHub Release Date](https://img.shields.io/github/release-date/j3lte/deno-soda?style=for-the-badge)](https://github.com/j3lte/deno-soda/releases/latest "GitHub Release Date")
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/j3lte/deno-soda?style=for-the-badge)
[![GitHub](https://img.shields.io/github/license/j3lte/deno-soda?style=for-the-badge)](https://github.com/j3lte/deno-soda/blob/main/LICENSE "GitHub License")
[![GitHub last commit](https://img.shields.io/github/last-commit/j3lte/deno-soda?style=for-the-badge)](https://github.com/j3lte/deno-soda/commits/main "GitHub last commit")
[![GitHub issues](https://img.shields.io/github/issues/j3lte/deno-soda?style=for-the-badge)](https://github.com/j3lte/deno-soda/issues "Github Issues")
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/j3lte/deno-soda/main.yml?branch=main&style=for-the-badge)](https://github.com/j3lte/deno-soda/actions/workflows/main.yml "GitHub Workflow Status")
[![Codecov](https://img.shields.io/codecov/c/github/j3lte/deno-soda?style=for-the-badge&token=F9CAI1FCMX)](https://codecov.io/gh/j3lte/deno-soda "Codecov")
[![JSR Version](https://img.shields.io/jsr/v/@j3lte/soda?style=for-the-badge)](https://jsr.io/@j3lte/soda "JSR")

SODA ([Socrata](https://dev.socrata.com/)) Query Client for Deno & NodeJS.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
  - [Plain query](#plain-query)
  - [SQL Builder](#sql-builder)
- [Creating a query](#creating-a-query)
- [Authentication](#authentication)
- [Building the query](#building-the-query)
  - [Select](#select)
  - [Where](#where)
  - [Field & DataType](#field--datatype)
  - [Order](#order)
  - [Group & Having](#group--having)
  - [Expressions (expr)](#expressions-expr)
  - [Search & paging](#search--paging)
- [Fetching results](#fetching-results)
  - [execute & single](#execute--single)
  - [Pagination](#pagination)
  - [count](#count)
  - [GeoJSON & CSV](#geojson--csv)
  - [Column metadata](#column-metadata)
  - [Response headers](#response-headers)
- [Stored queries](#stored-queries)
- [License](#license)

## Features

- Fluent, chainable SoQL query builder
- Type-safe fields and functions via `Field` / `DataType`
- Filters (`Where`), transforms (`Select`), `case(...)`, and arithmetic expressions
- Fetch as JSON, GeoJSON, or CSV
- Automatic pagination (async iterators or eager collect), row counts, and column metadata
- Works in Deno and Node

> _**Note:** This client targets the Socrata **SODA 2.1** endpoints (`/resource/{id}.json`). It is only for fetching data from the Socrata Open Data API — it does not support creating, updating or deleting data, nor the SODA 3.0 (`/api/v3/...`) endpoints._

## Installation

**Deno** — from [JSR](https://jsr.io/@j3lte/soda):

```sh
deno add jsr:@j3lte/soda
```

```ts
import { SodaQuery } from "@j3lte/soda";
// or import directly, without adding it: "jsr:@j3lte/soda"
```

**Node** (`npm i soda-query`):

```ts
import { SodaQuery } from "soda-query";
```

## Quick start

### Plain query

`SodaQuery` methods accept plain SoQL strings. Each `where(...)` string is a full
clause:

```ts
import { SodaQuery } from "jsr:@j3lte/soda";

const DOMAIN = "data.cityofnewyork.us";
const DATASET = "erm2-nwe9";

const { data, error } = await new SodaQuery(DOMAIN).withDataset(DATASET)
  .select("agency", "borough", "complaint_type")
  .where("complaint_type LIKE 'Noise%'")
  .where("created_date > '2019-01-01T00:00:00.000'")
  .where("created_date < '2020-01-01T00:00:00.000'")
  .orderBy("created_date DESC")
  .limit(10)
  .execute();
```

### SQL Builder

Or build the same query with the type-safe helpers:

```ts
import { Order, SodaQuery, Where } from "jsr:@j3lte/soda";

const { data, error } = await new SodaQuery("data.cityofnewyork.us")
  .withDataset("erm2-nwe9")
  .select("agency", "borough", "complaint_type")
  .where(
    Where.and(
      Where.like("complaint_type", "Noise%"),
      Where.gt("created_date", "2019-01-01T00:00:00.000"),
      Where.lt("created_date", "2020-01-01T00:00:00.000"),
    ),
  )
  .orderBy(Order.by("created_date").desc)
  .limit(10)
  .execute();
```

Every fetch resolves to `{ data, error, status }` — errors are returned, not
thrown.

## Creating a query

```ts
import { createQueryWithDataset, SodaQuery } from "jsr:@j3lte/soda";

const query = new SodaQuery("data.organization.com").withDataset("dataset-id");

// Same thing, in one call:
const query2 = createQueryWithDataset("data.organization.com", "dataset-id");
```

Pass a row type to get typed results:

```ts
type Row = { agency: string; complaint_type: string };
const query = new SodaQuery<Row>("data.cityofnewyork.us").withDataset("erm2-nwe9");
const { data } = await query.execute(); // data: Array<Row & system fields>
```

## Authentication

Pass auth options as the second constructor argument. An app token raises your
rate limit; Basic auth and OAuth authenticate as a user.

```ts
// App token (recommended)
new SodaQuery("data.cityofnewyork.us", { apiToken: "YOUR_APP_TOKEN" });

// HTTP Basic auth
new SodaQuery("data.cityofnewyork.us", { username: "user", password: "pass" });

// OAuth access token
new SodaQuery("data.cityofnewyork.us", { accessToken: "OAUTH_TOKEN" });
```

A third argument toggles options such as `strict` (prevents changing the dataset
once set):

```ts
new SodaQuery("data.cityofnewyork.us", {}, { strict: true });
```

## Building the query

> **Note:** the builder methods return the `SodaQuery` instance, so you can chain
> them.

### Select

A `Select` object transforms the columns returned by the query.

```ts
import { Select } from "jsr:@j3lte/soda";

Select("column_name"); // a column
Select(); // or Select("*") — all columns
Select("column_name").as("alias"); // column_name as alias

// Functions
Select("amount").count().as("counted"); // count(amount) as counted
Select("amount").avg(); // avg(amount)
Select("amount").sum(); // sum(amount)
Select("value").log(); // ln(value)
Select("name").unaccent(); // unaccent(name)
Select("name").upperCase(); // upper(name)
Select("created_date").dateExtractYear(); // date_extract_y(created_date)
```

```ts
query.select(
  Select("agency"),
  Select("amount").sum().as("total"),
);
```

See every method on [`SelectImpl`](https://jsr.io/@j3lte/soda/doc/~/SelectImpl).

Build a `case(...)` with `SelectCase`, which takes `[condition, value]` pairs
(the condition is a `Where` or a raw SoQL string; add a trailing `["true", ...]`
default):

```ts
import { SelectCase, Where } from "jsr:@j3lte/soda";

query.select(
  SelectCase(
    [Where.gt("score", 90), "A"],
    [Where.gt("score", 80), "B"],
    ["true", "F"],
  ).as("grade"),
);
```

### Where

A `Where` filters rows. It is built from static methods.

```ts
import { Where } from "jsr:@j3lte/soda";

Where.eq("borough", "MANHATTAN"); // borough = 'MANHATTAN'
Where.ne("status", "Closed"); // status != 'Closed'
Where.gt("score", 80); // score > 80
Where.between("score", 50, 100); // score between 50 and 100
Where.in("borough", "MANHATTAN", "BROOKLYN"); // borough in ('MANHATTAN','BROOKLYN')
Where.like("complaint_type", "Noise%"); // complaint_type like 'Noise%'
Where.isNull("closed_date"); // closed_date IS NULL
Where.isNotNull("closed_date"); // closed_date IS NOT NULL

// Combine
Where.and(
  Where.eq("borough", "BRONX"),
  Where.or(
    Where.eq("status", "Open"),
    Where.eq("status", "Pending"),
  ),
);

// From an object (all AND-ed equals)
Where.from({ borough: "BRONX", status: "Open" });
```

Bind a field once with `Where.field`:

```ts
Where.field("score").gt(80); // score > 80
Where.field("borough").in("MANHATTAN", "BROOKLYN");
```

Geospatial filters (work on Location / Point / Line / Polygon / Multi\* fields):

```ts
Where.withinBox("the_geom", 40.78, -73.98, 40.74, -73.94);
Where.withinCircle("the_geom", 40.7128, -74.006, 1000); // radius in meters
Where.withinPolygon("the_geom", "MULTIPOLYGON (((...)))"); // WKT, longitude-first
Where.intersects("the_geom", "POINT (-73.98 40.75)");
Where.startsWith("complaint_type", "Noise"); // starts_with(...)
```

See every method on [`Where`](https://jsr.io/@j3lte/soda/doc/~/Where).

### Field & DataType

`Field(name, type)` returns a typed field that enables type-checked use of
`Select` / `Where`. The type comes from the `DataType` enum.

```ts
import { DataType, Field } from "jsr:@j3lte/soda";

Field("borough"); // untyped (DataType._Unknown)
Field("score", DataType.Number); // typed
```

```ts
import { DataType, Field, Select } from "jsr:@j3lte/soda";

// Fine
query.select(Select(Field("name", DataType.Text)).as("alias"));

// Throws — avg() is not valid on a Text field
query.select(Select(Field("name", DataType.Text)).avg());
```

| DataType | String | Available | Docs |
| --- | --- | --- | --- |
| `Checkbox` | `"checkbox"` | 2.0, 2.1, 3.0 | [checkbox](https://dev.socrata.com/docs/datatypes/checkbox) |
| `FixedTimestamp` | `"fixed_timestamp"` | 2.0, 2.1, 3.0 | [fixed_timestamp](https://dev.socrata.com/docs/datatypes/fixed_timestamp) |
| `FloatingTimestamp` | `"floating_timestamp"` | 2.0, 2.1 | [floating_timestamp](https://dev.socrata.com/docs/datatypes/floating_timestamp) |
| `Line` | `"line"` | 2.1, 3.0 | [line](https://dev.socrata.com/docs/datatypes/line) |
| `Location` | `"location"` | 2.0, 2.1, 3.0 | [location](https://dev.socrata.com/docs/datatypes/location) |
| `MultiLine` | `"multiline"` | 2.1, 3.0 | [multiline](https://dev.socrata.com/docs/datatypes/multiline) |
| `MultiPoint` | `"multipoint"` | 2.1, 3.0 | [multipoint](https://dev.socrata.com/docs/datatypes/multipoint) |
| `MultiPolygon` | `"multipolygon"` | 2.1, 3.0 | [multipolygon](https://dev.socrata.com/docs/datatypes/multipolygon) |
| `Number` | `"number"` | 2.0, 2.1, 3.0 | [number](https://dev.socrata.com/docs/datatypes/number) |
| `Point` | `"point"` | 2.1, 3.0 | [point](https://dev.socrata.com/docs/datatypes/point) |
| `Polygon` | `"polygon"` | 2.1, 3.0 | [polygon](https://dev.socrata.com/docs/datatypes/polygon) |
| `Text` | `"text"` | 2.0, 2.1, 3.0 | [text](https://dev.socrata.com/docs/datatypes/text) |
| `URL` | `"url"` | 2.0, 2.1, 3.0 | [url](https://dev.socrata.com/docs/datatypes/url) |

`SystemFields` exposes the `:id`, `:created_at`, and `:updated_at` system
columns.

### Order

`Order.by(field).asc` / `.desc` build order entries (`.asc` / `.desc` are
getters). Plain strings work too.

```ts
import { Order } from "jsr:@j3lte/soda";

query.orderBy(
  Order.by("created_date").desc,
  Order.by("agency").asc,
);

query.orderBy("created_date DESC"); // a string also works
```

### Group & Having

```ts
query
  .select(Select("borough"), Select("amount").sum().as("total"))
  .groupBy("borough")
  .having(Where.gt("total", 1000)); // having requires a groupBy
```

`groupBy` also accepts typed `Field` objects.

### Expressions (expr)

`expr` builds raw SoQL expression strings — boolean (`and`/`or`) and arithmetic
(`add`/`sub`/`mul`/`div`/`mod`/`pow` → `+ - * / % ^`). Each call parenthesizes
its result, so they nest safely.

```ts
import { expr, Select } from "jsr:@j3lte/soda";

expr.mul("price", "qty"); // (price * qty)
expr.div(expr.add("a", "b"), 2); // ((a + b) / 2)

query.select(Select(expr.mul("price", "qty")).as("total"));
```

### Search & paging

```ts
query.search("noise"); // full-text search ($q)
query.limit(50).offset(100); // manual paging
query.withSystemFields(); // include :id / :created_at / :updated_at
```

## Fetching results

### execute & single

```ts
const { data, error, status } = await query.execute(); // Array of rows
const { data: row } = await query.single(); // first row, or null
```

### Pagination

`$limit` defaults to 1000 rows per request. These iterate the whole result set,
advancing `$offset` automatically. Set a stable order (e.g. `orderBy(":id")`) for
reliable full scans.

```ts
// Lazy — one page (array) at a time
for await (const page of query.pages({ pageSize: 1000 })) { /* ... */ }

// Lazy — one row at a time
for await (const row of query.rows()) { /* ... */ }

// Eager — every row in one array
const { data } = await query.executeAll({ max: 50000 }); // optional row cap
```

### count

```ts
const { data: total } = await query.where(Where.eq("borough", "BRONX")).count();
// total: number of matching rows ($select=count(*))
```

### GeoJSON & CSV

```ts
const { data: geojson } = await query.executeGeoJSON(); // FeatureCollection
const { data: csv } = await query.executeCSV(); // raw CSV string
```

### Column metadata

```ts
const { data: columns } = await query.getColumns();
// [{ fieldName: "the_geom", dataTypeName: "point", name, renderTypeName }, ...]
```

### Response headers

After any request, read the last response's headers:

```ts
await query.execute();
query.headers.lastModified;
query.headers.etag;
query.headers.fields; // X-SODA2-Fields
query.headers.types; // X-SODA2-Types
```

## Stored queries

`prepare(id)` snapshots the current query under an id and resets the builder, so
you can run several queries from one instance:

```ts
query.select("a", "b").where("a > 1").prepare("first").clear();
query.select("c").prepare("second");

await query.execute("first");
await query.execute("second");
query.getURL("first"); // inspect the built URL
```

## License

[MIT](LICENSE)

---

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/j3lte)
