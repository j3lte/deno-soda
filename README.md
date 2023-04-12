# SODA Query

![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/j3lte/deno-soda?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/j3lte/deno-soda?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/j3lte/deno-soda?style=for-the-badge)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/j3lte/deno-soda/main.yml?branch=main&style=for-the-badge)

SODA ([Socrata](https://dev.socrata.com/)) Query Client for Deno.

## Features

- Create SODA queries
- Use SODA queries to fetch from Socrata Open Data API
- Build complex queries with ease, in a functional way
- SQL Builder, inspired by [sql-builder](https://deno.land/x/sql_builder)

> _**Note:** This client is only for fetching data from Socrata Open Data API. It does not support creating, updating or deleting data._

## Installation

```ts
import { SodaQuery } from "https://deno.land/x/soda/mod.ts";
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

### Querying data

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

## Development

TODO:

- [ ] Add `case` method
- Missing functions (investigate [this doc](https://dev.socrata.com/docs/transforms/))
  - [ ] `centroid`
  - [ ] `datetime_add_d`
  - [ ] `datetime_add_mm`
  - [ ] `datetime_add_hh`
  - [ ] `datetime_add_ss`
  - [ ] `datetime_diff`
  - [ ] `is_empty`

## License

[MIT](LICENSE)
