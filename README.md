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
[![Deno docs](https://img.shields.io/badge/Deno-Docs-blue?style=for-the-badge)](https://doc.deno.land/https/deno.land/x/soda/mod.ts "Deno docs")

SODA ([Socrata](https://dev.socrata.com/)) Query Client for Deno & NodeJS.

## Table of Contents

- [SODA Query](#soda-query)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Example](#example)
    - [Plain query](#plain-query)
    - [SQL Builder](#sql-builder)
    - [SodaQuery](#sodaquery)
  - [Querying data](#querying-data)
    - [Select](#select)
    - [Where](#where)
    - [Field](#field)
    - [Order](#order)
    - [Group](#group)
  - [Development](#development)
  - [License](#license)

## Features

- Create SODA queries
- Use SODA queries to fetch from Socrata Open Data API
- Build complex queries with ease, in a functional way
- SQL Builder, inspired by [sql-builder](https://deno.land/x/sql_builder)

> _**Note:** This client is only for fetching data from Socrata Open Data API. It does not support creating, updating or deleting data._

## Installation

Deno:

```ts
import { SodaQuery } from "https://deno.land/x/soda/mod.ts";
```

Node: (`npm i soda-query`)

```ts
import { SodaQuery } from "soda-query";
```

## Example

### Plain query

The `SodaQuery` class accepts plain strings in its methods:

```ts
import { SodaQuery } from "https://deno.land/x/soda/mod.ts";

const DOMAIN = "data.cityofnewyork.us";
const DATASET = "erm2-nwe9";

const { data, error } = await new SodaQuery(DOMAIN).withDataset(DATASET)
  .select("agency", "borough", "complaint_type")
  .where("complaint_type", "LIKE", "Noise%")
  .where("created_date", ">", "2019-01-01T00:00:00.000")
  .where("created_date", "<", "2020-01-01T00:00:00.000")
  .orderBy("created_date DESC")
  .limit(10)
  .execute();
```

### SQL Builder

You can also use the SQL Builder to create your queries:

```ts
import { Order, SodaQuery, Where } from "https://deno.land/x/soda/mod.ts";

const DOMAIN = "data.cityofnewyork.us";
const DATASET = "erm2-nwe9";

// Using the SQL Builder
const { data, error } = await new SodaQuery(DOMAIN).withDataset(DATASET)
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

### SodaQuery

You can create a new SodaQuery instance by passing a domain and optionally an authOptions object and an options object.

```ts
import { createQueryWithDataset, SodaQuery } from "https://deno.land/x/soda/mod.ts";

const query = new SodaQuery("data.organization.com").withDataset("dataset-id");
// Same thing:

const query = createQueryWithDataset("data.organization.com", "dataset-id");
```

## Querying data

> **Note:** Most methods return the instance of SodaQuery. This means that you can chain methods together.

### Select

A `Select` object can be used to transform the data returned by the query.

```ts
import { Select, SodaQuery } from "https://deno.land/x/soda/mod.ts";

const query = new SodaQuery("data.organization.com").withDataset("dataset-id");

// Selecting columns
query.select(
  //...Select objects
);

// Just a column:
Select("column_name");

// Select all:
Select(); // or Select("*")

// Select with alias:
Select("column_name").as("alias");

// Select with function:
Select("column_name").count().as("counted");
Select("column_name").avg();
Select("column_name").sum();
```

See all methods in [`<SelectImpl>`](https://deno.land/x/soda/mod.ts?s=SelectImpl) interface.

### Where

A `Where` object can be used to filter the data returned by the query. It uses static methods to create the `Where` object.

```ts
import { SodaQuery, Where } from "https://deno.land/x/soda/mod.ts";

const query = new SodaQuery("data.organization.com").withDataset("dataset-id");

// Filtering data
query.where(
  //...Where objects
);

// Eq
Where.eq("column_name", "value");

// null
Where.isNull("column_name");
Where.isNotNull("column_name");

// Combined
Where.and(
  Where.eq("column_name", "value"),
  Where.or(
    Where.eq("column_name", "value"),
    Where.eq("column_name", "value"),
  ),
);
```

See all methods in [`<Where>`](https://deno.land/x/soda/mod.ts?s=Where) interface.

### Field

You can use the `Field` method that returns a `FieldImpl` object, which can be used to ensure type safety when using the `Select` and `Where` methods.

It uses the `DataType` enum to tell what type of data the field is.

DataTypes:

| DataType | String representation | Socrata Type | Notes |
| --- | --- | --- | --- |
| `Checkbox` | `"checkbox"` | [Checkbox](https://dev.socrata.com/docs/datatypes/checkbox.html) | |
| `FixedTimestamp` | `"fixed_timestamp"` | [Fixed Timestamp](https://dev.socrata.com/docs/datatypes/fixed_timestamp.html) | |
| `FloatingTimestamp` | `"floating_timestamp"` | [Floating Timestamp](https://dev.socrata.com/docs/datatypes/floating_timestamp.html) | |
| `Line` | `"line"` | [Line](https://dev.socrata.com/docs/datatypes/line.html) | |
| `Location` | `"location"` | [Location](https://dev.socrata.com/docs/datatypes/location.html) | |
| `MultiLine` | `"multiline"` | [MultiLine](https://dev.socrata.com/docs/datatypes/multiline.html) | |
| `MultiPoint` | `"multipoint"` | [MultiPoint](https://dev.socrata.com/docs/datatypes/mulitpoint.html) | |
| `MultiPolygon` | `"multipolygon"` | [MultiPolygon](https://dev.socrata.com/docs/datatypes/multipolygon.html) | |
| `Number` | `"number"` | [Number](https://dev.socrata.com/docs/datatypes/number.html) | |
| `Point` | `"point"` | [Point](https://dev.socrata.com/docs/datatypes/point.html) | |
| `Polygon` | `"polygon"` | [Polygon](https://dev.socrata.com/docs/datatypes/polygon.html) | |
| `Text` | `"text"` | [Text](https://dev.socrata.com/docs/datatypes/text.html) | |
| `URL` | `"url"` | [URL](https://dev.socrata.com/docs/datatypes/url.html) | |
| `ROWIdentifier` | `"row_identifier"` | - | _Special tag that is only used internally, for the ':id' column._ |
| `Unknown` | `"_unknown"` | - | _Default type for a field, does not check types_ |

These Datatypes can be used to define your fields:

```ts
import { Field, DataType } from "https://deno.land/x/soda/mod.ts";

// Just a field, will be of type FieldImpl<DataType.Unknown>
const field = Field("column_name");

// Field with type
const field = Field("column_name", DataType.Text);
```

If you define your fields like that instead of using strings, you can use the `Select` and `Where` methods with type safety:

```ts
import { Select, SodaQuery, Field, Where } from "https://deno.land/x/soda/mod.ts";

const query = new SodaQuery("data.organization.com").withDataset("dataset-id");

// This works fine
query.select(
  Select(Field("column_name", DataType.Text)).as("alias"),
);

// This will throw an error, as you cannot use `avg` on a text field
query.select(
  Select(Field("column_name", DataType.Text)).avg(),
);
```

### Order

A `Order` object can be used to order the data returned by the query.

```ts
import { Order, SodaQuery } from "https://deno.land/x/soda/mod.ts";

const query = new SodaQuery("...");

// Ordering data
query.order(
  Order.by("column_name").asc(),
  Order.by("column_name2").desc(),
);
```

### Group

You can use `groupBy` to group the data returned by the query.

```ts
query.groupBy(
  "column_name",
  "column_name2",
);

// Or with Fields
query.groupBy(
  Field("column_name", DataType.Text),
  Field("column_name2", DataType.Number),
);
```

## Development

TODO:

- Add `case` method
- Missing undocemented functions (investigate [this doc](https://dev.socrata.com/docs/transforms/))
- Improve docs (JSDoc categories etc)

## License

[MIT](LICENSE)

---

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/j3lte)
