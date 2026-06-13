import type {
  AuthOpts,
  DataResponse,
  ExtraDataFields,
  FieldImpl,
  Options,
  QueryObj,
  RequesOpts,
} from "./types.ts";

import type { Where } from "./Where.ts";
import { toQS } from "./utils/qs.ts";
import { SelectImpl } from "./SelectImpl.ts";
import { Order } from "./Order.ts";
import { addExpr, expr } from "./utils/expr.ts";

/**
 * Chainable builder and HTTP client for the Socrata Open Data API (SODA).
 *
 * Configure the query with the fluent methods ({@link select}, {@link where},
 * {@link orderBy}, ...) then run it with {@link execute}, {@link single} or
 * {@link executeGeoJSON}. The type parameter `T` describes the shape of a row.
 */
export class SodaQuery<T> {
  #domain: string;
  #datasetId: string | null = null;
  #authOpts: AuthOpts = {};
  #strict = false;

  #queryMap: Map<string, QueryObj> = new Map();

  #simple: Record<string, string | number> | null = null;

  #soql: string | null = null;

  #_q: string | null = null;
  #select: string[] = [];
  #where: string[] = [];
  #group: string[] = [];
  #having: string[] = [];
  #order: string[] = [];
  #limit: number | null = null;
  #offset: number | null = null;

  #withSystemFields = false;

  #lastResponseHeaders: Headers | null = null;

  /**
   * Create a new Query instance
   *
   * @param domain {string} The domain to query against
   * @param authOpts {AuthOpts} Authentication options
   * @param opts {Options} Options
   */
  constructor(domain: string, authOpts: AuthOpts = {}, opts: Options = {}) {
    this.#domain = domain;
    this.#authOpts = authOpts;
    this.#strict = opts.strict || false;
  }

  private getPath(): string {
    if (!this.#datasetId) {
      throw new Error("no dataset given to work against!");
    }
    return `/resource/${this.#datasetId}.json`;
  }

  private resourceUrl(queryObj: QueryObj): string {
    return `https://${this.#domain}${this.getPath()}?${toQS(queryObj)}`;
  }

  private get requestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (this.#authOpts.apiToken) {
      headers["X-App-Token"] = this.#authOpts.apiToken;
    }

    if (this.#authOpts.username && this.#authOpts.password) {
      const auth = btoa(`${this.#authOpts.username}:${this.#authOpts.password}`);
      headers["Authorization"] = `Basic ${auth}`;
    }

    if (this.#authOpts.accessToken) {
      headers["Authorization"] = `OAuth ${this.#authOpts.accessToken}`;
    }

    return headers;
  }

  private async requestData<T>(
    url: string,
    opts?: RequesOpts,
    parse: "json" | "text" = "json",
  ): DataResponse<T | null> {
    const requestInit = {
      ...opts,
      headers: this.requestHeaders,
    };

    const res = await fetch(url, requestInit);
    this.#lastResponseHeaders = res.headers;

    if (res.ok) {
      const data = (parse === "text" ? await res.text() : await res.json()) as T;
      return { error: null, status: res.status, data };
    }

    const error = await res.json() as {
      message?: string;
      errorCode?: string;
      data?: unknown;
    };

    const errorData = [
      `Error: ${res.status} ${res.statusText}`,
      `Message: ${error.message}`,
      `Error Code: ${error.errorCode}`,
      `Data: ${JSON.stringify(error.data, null, 2)}`,
      `URL: ${url}`,
      `Request: ${JSON.stringify(requestInit, null, 2)}`,
    ].join("\n");

    return { error: new Error(errorData), status: res.status, data: null };
  }

  /**
   * Return a query object that can be used to build a query string
   *
   * @returns query {QueryObj} The query object
   */
  buildQuery(): QueryObj {
    const query: QueryObj = {};

    if (this.#simple) {
      Object.entries(this.#simple).forEach(([k, v]) => {
        query[k] = v;
      });
    } else if (this.#soql) {
      query.$query = this.#soql;
    } else {
      if (this.#select.length > 0) {
        query.$select = this.#select.join(",");
      }
      if (this.#where.length > 0) {
        query.$where = expr.and.apply(this, this.#where);
      }
      if (this.#group.length > 0) {
        query.$group = this.#group.join(", ");
      }
      if (this.#having.length > 0) {
        if (!(this.#group.length > 0)) {
          throw new Error("Having provided without group by!");
        }
        query.$having = expr.and.apply(this, this.#having);
      }
      if (this.#order.length > 0) {
        query.$order = this.#order.join(", ");
      }
      if (this.#offset !== null) {
        query.$offset = this.#offset.toString();
      }
      if (this.#limit !== null) {
        query.$limit = this.#limit.toString();
      }
      if (this.#_q) {
        query.q = this.#_q;
      }
    }

    if (this.#withSystemFields) {
      query.$$exclude_system_fields = false;
    }

    return query;
  }

  /**
   * Get the URL that will be used to make the request, can be used for debugging
   * @returns {string} The URL
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * console.log(query.where(Where.eq("borough", "BRONX")).getURL());
   * ```
   */
  getURL(queryID?: string): string {
    let queryObj: QueryObj;

    if (queryID) {
      if (!this.#queryMap.has(queryID)) {
        throw new Error(`No query with ID ${queryID} found!`);
      }
      queryObj = this.#queryMap.get(queryID) as QueryObj;
    } else {
      queryObj = this.buildQuery();
    }

    const path = this.getPath();
    const query = toQS(queryObj);
    return `https://${this.#domain}${path}${query.length > 0 ? "?" + query : ""}`;
  }

  /**
   * Get the Socrata docs URL for the dataset
   *
   * @returns {string} The URL
   * @throws {Error} If no dataset is set
   */
  getDevURL(): string {
    if (!this.#datasetId) {
      throw new Error("no dataset given to work against!");
    }
    return `https://dev.socrata.com/foundry/${this.#domain}/${this.#datasetId}`;
  }

  /**
   * Get the last response headers
   */
  get headers(): {
    raw: Headers | null;
    lastModified: string | null | undefined;
    etag: string | null | undefined;
    fields: string | null | undefined;
    types: string | null | undefined;
    outOfDate: string | null | undefined;
  } {
    return {
      raw: this.#lastResponseHeaders,
      lastModified: this.#lastResponseHeaders?.get("Last-Modified"),
      etag: this.#lastResponseHeaders?.get("ETag"),
      fields: this.#lastResponseHeaders?.get("X-SODA2-Fields"),
      types: this.#lastResponseHeaders?.get("X-SODA2-Types"),
      outOfDate: this.#lastResponseHeaders?.get("X-SODA2-Data-Out-Of-Date"),
    };
  }

  /**
   * Set the dataset to work against. This can be called multiple times, but only if strict mode is disabled.
   *
   * @param datasetId The dataset to work against
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * ```
   */
  withDataset(datasetId: string): this {
    if (this.#datasetId && this.#strict) {
      throw new Error("dataset already set!");
    }
    this.#datasetId = datasetId;
    return this;
  }

  /**
   * Make a simple query, this will override any other query that has been set
   * @param query The query to make
   * @returns {SodaQuery} The query object
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us")
   *  .simple({
   *    "case_number": "HX308375",
   *  })
   *  .getRows();
   * ```
   */
  simple(query: Record<string, string | number>): this {
    this.#simple = {
      ...this.#simple,
      ...query,
    };
    return this;
  }

  /**
   * Make a soql query, this will override any other query that has been set (except simple)
   *
   * Similar to SQL, clauses must be specified in a specific order:
   *  - SELECT
   *  - WHERE
   *  - ORDER BY
   *  - GROUP BY
   *  - LIMIT
   *  - OFFSET
   *
   * @url https://dev.socrata.com/docs/queries/query.html
   *
   * @param query The query to make
   * @returns {SodaQuery} The query object
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us")
   *   .withDataset("h9gi-nx95")
   *   .soql("SELECT case, location WHERE case_number = 'HX308375'")
   *   .execute();
   * ```
   */
  soql(query: string): this {
    this.#soql = query;
    return this;
  }

  /**
   * Add fields to the `$select` clause. Accepts plain strings, {@link SelectImpl}
   * objects or {@link FieldImpl} instances.
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.select("complaint_type", "borough", Select("incident_zip").as("zip"));
   * ```
   */
  select(...selects: Array<string | SelectImpl | FieldImpl>): this {
    const selectArray = selects.map((
      s,
    ) => (s instanceof SelectImpl ? s.value : s.toString())).filter((s) => s);
    this.#select.push(...selectArray);
    return this;
  }

  /**
   * Add conditions to the `$where` clause. Accepts strings, `{field: value}`
   * objects or {@link Where} instances; multiple conditions are AND-ed together.
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.where(Where.eq("borough", "BROOKLYN"), Where.gt("incident_address", "0"));
   * ```
   */
  where(...where: Array<string | Record<string, string> | Where>): this {
    addExpr(this.#where, where);
    return this;
  }

  /**
   * Add conditions to the `$having` clause (requires a {@link groupBy}).
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.groupBy("borough").having(Where.gt("count(*)", 100));
   * ```
   */
  having(...having: Array<string | Record<string, string> | Where>): this {
    addExpr(this.#having, having);
    return this;
  }

  /**
   * Add fields to the `$group` clause.
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.select("borough", Select("*").count().as("total")).groupBy("borough");
   * ```
   */
  groupBy(...group: Array<string | FieldImpl>): this {
    const groupArray = group.map((g) => g.toString());
    this.#group.push(...groupArray);
    return this;
  }

  /**
   * Add fields to the `$order` clause. Strings without an explicit direction
   * default to `ASC`; {@link Order} instances carry their own direction.
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.orderBy(Order.by("created_date").desc, "borough");
   * ```
   */
  orderBy(...order: Array<string | Order>): this {
    const orders = order.map((order: string | Order) =>
      order instanceof Order
        ? order.value
        : (/( ASC$| DESC$)/i.test(order) ? order : `${order} ASC`)
    );
    this.#order.push(...orders);
    return this;
  }

  /**
   * Set the `$offset` (number of rows to skip).
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.limit(50).offset(100); // skip first 100 rows
   * ```
   */
  offset(offset: number): this {
    this.#offset = offset;
    return this;
  }

  /**
   * Set the `$limit` (maximum number of rows to return).
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.limit(10); // return at most 10 rows
   * ```
   */
  limit(limit: number): this {
    this.#limit = limit;
    return this;
  }

  /**
   * Full text search
   * @param q {string} The search query
   * @returns {SodaQuery} The query object
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.search("noise complaint").limit(20);
   * ```
   */
  search(q: string): this {
    this.#_q = q;
    return this;
  }

  /**
   * Include system fields in the response
   * @returns {SodaQuery} The query object
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.withSystemFields().limit(5);
   * ```
   */
  withSystemFields(): this {
    this.#withSystemFields = true;
    return this;
  }

  /**
   * Reset all clauses, returning the query to an empty state.
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.where(Where.eq("borough", "BRONX")).clear(); // back to empty
   * ```
   */
  clear(): this {
    this.#simple = null;
    this.#soql = null;
    this.#select = [];
    this.#where = [];
    this.#having = [];
    this.#group = [];
    this.#order = [];
    this.#offset = null;
    this.#limit = null;
    this.#_q = null;
    this.#withSystemFields = false;
    return this;
  }

  /**
   * Build a query object and store it in the query map, then clear the query to start a new one
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * query.where(Where.eq("borough", "BROOKLYN")).prepare("brooklyn");
   * const { data } = await query.execute("brooklyn");
   * ```
   */
  prepare(queryID: string): this {
    this.#queryMap.set(queryID, { ...this.buildQuery() });
    this.clear();
    return this;
  }

  /**
   * Run the query and return all matching rows.
   *
   * @param queryID Optional ID of a query stored via {@link prepare}
   * @param signal Optional abort signal
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * const { data, error } = await query.where(Where.eq("borough", "BRONX")).execute();
   * ```
   */
  execute(
    queryID?: string,
    signal?: AbortSignal,
  ): DataResponse<Array<T & ExtraDataFields>> {
    return this.requestData<Array<T & ExtraDataFields>>(this.getURL(queryID), { signal }).then((
      res,
    ) => ({
      ...res,
      data: res.data ?? [],
    }));
  }

  /**
   * Run the query constrained to a single row and return the first row
   * (or `null`). Works for both the fluent query and a stored `queryID`.
   *
   * @param queryID Optional ID of a query stored via {@link prepare}
   * @param signal Optional abort signal
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * const { data } = await query.where(Where.eq("unique_key", "10000001")).single();
   * ```
   */
  single(
    queryID?: string,
    signal?: AbortSignal,
  ): DataResponse<T & ExtraDataFields> {
    let queryObj: QueryObj;
    if (queryID) {
      if (!this.#queryMap.has(queryID)) {
        throw new Error(`No query with ID ${queryID} found!`);
      }
      queryObj = { ...this.#queryMap.get(queryID) as QueryObj };
    } else {
      queryObj = this.buildQuery();
    }
    queryObj.$limit = 1;

    // `$limit=1` is always present, so the query string is never empty.
    const url = this.resourceUrl(queryObj);

    return this.requestData<Array<T & ExtraDataFields>>(url, { signal }).then((res) => ({
      ...res,
      data: (res.data?.[0] ?? null) as T & ExtraDataFields,
    }));
  }

  /**
   * Run the query against the `.geojson` endpoint. Falls back to an empty
   * `FeatureCollection` when the response is empty.
   *
   * @param queryID Optional ID of a query stored via {@link prepare}
   * @param signal Optional abort signal
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * const { data: geojson } = await query.where(Where.eq("borough", "BRONX")).executeGeoJSON();
   * ```
   */
  executeGeoJSON(
    queryID?: string,
    signal?: AbortSignal,
  ): DataResponse<unknown> {
    const url = this.getURL(queryID).replace(/\.json/, ".geojson");
    return this.requestData<unknown>(url, { signal }).then((res) => ({
      ...res,
      data: res.data ?? { type: "FeatureCollection", features: [] },
    }));
  }

  /**
   * Run the query against the `.csv` endpoint and return the raw CSV string.
   *
   * The result is returned unparsed; pass it to a CSV parser (e.g. `@std/csv`)
   * if you need rows.
   *
   * @param queryID Optional ID of a query stored via {@link prepare}
   * @param signal Optional abort signal
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * const { data: csv } = await query.select("borough", "complaint_type").limit(100).executeCSV();
   * ```
   */
  executeCSV(
    queryID?: string,
    signal?: AbortSignal,
  ): DataResponse<string> {
    const url = this.getURL(queryID).replace(/\.json/, ".csv");
    return this.requestData<string>(url, { signal }, "text").then((res) => ({
      ...res,
      data: res.data ?? "",
    }));
  }

  private async fetchPage(
    offset: number,
    pageSize: number,
    signal?: AbortSignal,
  ): Promise<Array<T & ExtraDataFields>> {
    const queryObj = this.buildQuery();
    queryObj.$limit = pageSize;
    queryObj.$offset = offset;
    const url = this.resourceUrl(queryObj);
    const res = await this.requestData<Array<T & ExtraDataFields>>(url, { signal });
    if (res.error) {
      throw res.error;
    }
    return res.data ?? [];
  }

  /**
   * Asynchronously iterate the result set one page at a time, transparently
   * advancing `$offset`. Each yielded value is a page of rows.
   *
   * For a stable full scan, set a deterministic order first
   * (e.g. `orderBy(":id")`); the query's own `limit`/`offset` are ignored here.
   *
   * @param opts `pageSize` (default 1000) and an optional abort `signal`
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * for await (const page of query.orderBy(":id").pages({ pageSize: 500 })) {
   *   console.log(page.length);
   * }
   * ```
   */
  async *pages(
    opts: { pageSize?: number; signal?: AbortSignal } = {},
  ): AsyncGenerator<Array<T & ExtraDataFields>> {
    const pageSize = opts.pageSize ?? 1000;
    let offset = 0;
    while (true) {
      const rows = await this.fetchPage(offset, pageSize, opts.signal);
      if (rows.length > 0) {
        yield rows;
      }
      if (rows.length < pageSize) {
        break;
      }
      offset += pageSize;
    }
  }

  /**
   * Asynchronously iterate the result set one row at a time (see {@link pages}).
   *
   * @param opts `pageSize` (default 1000) and an optional abort `signal`
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * for await (const row of query.orderBy(":id").rows()) {
   *   console.log(row);
   * }
   * ```
   */
  async *rows(
    opts: { pageSize?: number; signal?: AbortSignal } = {},
  ): AsyncGenerator<T & ExtraDataFields> {
    for await (const page of this.pages(opts)) {
      for (const row of page) {
        yield row;
      }
    }
  }

  /**
   * Eagerly page through the entire result set and return every row in one
   * array (see {@link pages}). Returns a {@link DataResponse} like {@link execute}.
   *
   * @param opts `pageSize` (default 1000), an optional `max` row cap, and an
   *   optional abort `signal`
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * const { data } = await query.where(Where.eq("borough", "QUEENS")).executeAll({ max: 5000 });
   * ```
   */
  async executeAll(
    opts: { pageSize?: number; max?: number; signal?: AbortSignal } = {},
  ): DataResponse<Array<T & ExtraDataFields>> {
    const all: Array<T & ExtraDataFields> = [];
    try {
      for await (const page of this.pages(opts)) {
        all.push(...page);
        if (opts.max !== undefined && all.length >= opts.max) {
          return { error: null, status: 200, data: all.slice(0, opts.max) };
        }
      }
      return { error: null, status: 200, data: all };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error(String(err)),
        status: 0,
        data: [],
      };
    }
  }

  /**
   * Count the rows that match the current `where` / search filters.
   *
   * Emits `$select=count(*)` and ignores any `select`, `group` or `order` set on
   * the query, so the result is always the total number of matching rows.
   *
   * @param queryID Optional ID of a query stored via {@link prepare}
   * @param signal Optional abort signal
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * const { data: total } = await query.where(Where.eq("borough", "MANHATTAN")).count();
   * ```
   */
  count(queryID?: string, signal?: AbortSignal): DataResponse<number> {
    let base: QueryObj;
    if (queryID) {
      if (!this.#queryMap.has(queryID)) {
        throw new Error(`No query with ID ${queryID} found!`);
      }
      base = this.#queryMap.get(queryID) as QueryObj;
    } else {
      base = this.buildQuery();
    }

    const queryObj: QueryObj = { $select: "count(*)" };
    if (base.$where !== undefined) {
      queryObj.$where = base.$where;
    }
    if (base.q !== undefined) {
      queryObj.q = base.q;
    }

    const url = this.resourceUrl(queryObj);
    return this.requestData<Array<{ count: string }>>(url, { signal }).then((res) => ({
      ...res,
      data: res.data?.[0]?.count !== undefined ? Number(res.data[0].count) : 0,
    }));
  }

  /**
   * Fetch the dataset's metadata from the `/api/views` endpoint.
   *
   * @param signal Optional abort signal
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * const { data: meta } = await query.getMetaData();
   * ```
   */
  getMetaData(signal?: AbortSignal): DataResponse<unknown> {
    if (!this.#datasetId) {
      throw new Error("no dataset given to work against!");
    }
    const url = `https://${this.#domain}/api/views/${this.#datasetId}`;
    return this.requestData(url, { signal });
  }

  /**
   * Fetch the dataset's column metadata (name and data type per column).
   *
   * Built on {@link getMetaData}. Note: `dataTypeName` is the view's data type
   * (e.g. dates are `calendar_date`), which differs from the SoQL type names in
   * {@link DataType} — it is returned verbatim, not mapped.
   *
   * @param signal Optional abort signal
   *
   * @example
   * ```ts
   * const query = new SodaQuery("data.cityofnewyork.us").withDataset("erm2-nwe9");
   * const { data: columns } = await query.getColumns();
   * ```
   */
  getColumns(
    signal?: AbortSignal,
  ): DataResponse<
    Array<{ fieldName: string; name: string; dataTypeName: string; renderTypeName: string }>
  > {
    return this.getMetaData(signal).then((res) => {
      const columns = (res.data as { columns?: Array<Record<string, unknown>> } | null)?.columns ??
        [];
      return {
        ...res,
        data: columns.map((c) => ({
          fieldName: String(c.fieldName ?? ""),
          name: String(c.name ?? ""),
          dataTypeName: String(c.dataTypeName ?? ""),
          renderTypeName: String(c.renderTypeName ?? ""),
        })),
      };
    });
  }
}

/**
 * Create a {@link SodaQuery} with its dataset already set.
 *
 * @param domain The Socrata domain to query
 * @param dataSetId The dataset (resource) ID
 * @param authOpts Optional authentication options
 * @param options Optional query options
 */
export const createQueryWithDataset = <T>(
  domain: string,
  dataSetId: string,
  authOpts: AuthOpts = {},
  options: Options = {},
): SodaQuery<T> => new SodaQuery<T>(domain, authOpts, options).withDataset(dataSetId);
