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

## Installation

```ts
import { SodaQuery } from "https://deno.land/x/soda/mod.ts";
```

## Example

```ts
import { SodaQuery } from "https://deno.land/x/soda/mod.ts";

const DOMAIN = "data.cityofnewyork.us";
const DATASET = "erm2-nwe9";

const query = new SodaQuery(DOMAIN).withDataset(DATASET)
  .select("agency", "borough", "complaint_type")
  .where("complaint_type", "LIKE", "Noise%")
  .where("created_date", ">", "2019-01-01T00:00:00.000")
  .where("created_date", "<", "2020-01-01T00:00:00.000")
  .order("created_date", "DESC")
  .limit(10)
  .execute();
```

## API

### SodaQuery

You can create a new SodaQuery instance by passing a domain and optionally an authOptions object and an options object.

```ts
import { SodaQuery } from "https://deno.land/x/soda/mod.ts";

const query = new SodaQuery("data.organization.com");
```

There is also a shorthand, that will use the domain and dataset ID:

```ts
import { createQueryWithDataset } from "https://deno.land/x/soda/mod.ts";

const query = createQueryWithDataset("data.organization.com", "dataset-id");
```

### Querying data

> **Note:** Most methods return the instance of SodaQuery. This means that you can chain methods together.

> _---> Documentation coming soon <---_

## Development

TODO:

- [ ] Add `case` method

## License

[MIT](LICENSE)
