import { Where } from "./Where.ts";
import { toQS } from "./utils/qs.ts";
import { SelectImpl } from "./SelectImpl.ts";
import { Order } from "./Order.ts";
import { addExpr, expr } from "./utils/expr.ts";
import { FieldImpl } from "./Field.ts";

export interface AuthOpts {
  /**
   * API token
   *
   * The Socrata Open Data API uses application tokens for two purposes:
   * Using an application token allows us to throttle by application, rather than via IP address, which gives you a higher throttling limit
   * Authentication using OAuth
   *
   * Docs: https://dev.socrata.com/docs/app-tokens.html
   */
  apiToken?: string;
  /**
   * Username (needs password) for Basic HTTP Auth
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#authenticating-using-http-basic-authentication
   */
  username?: string;
  /**
   * Password (needs username) for Basic HTTP Auth
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#authenticating-using-http-basic-authentication
   */
  password?: string;
  /**
   * OAuth Access Token
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#using-an-oauth-20-access-token
   */
  accessToken?: string;
}

export interface Options {
  /** Strict mode. If enabled, this prevents the Query from changing the dataset ID after it has been set once */
  strict?: boolean;
}

interface RequesOpts {
  method?: string;
}

export type QueryObj = Record<string, string | number | boolean>;
export type DataResponse<T> = Promise<{ error: Error | null; status: number; data: T }>;

interface ExtraDataFields {
  /** System field */
  ":id"?: string;
  /** System field */
  ":created_at"?: string;
  /** System field */
  ":updated_at"?: string;
}

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
  ): DataResponse<T | null> {
    const requestInit = {
      ...opts,
      headers: this.requestHeaders,
    };

    const res = await fetch(url, requestInit);
    this.#lastResponseHeaders = res.headers;

    if (res.ok) {
      const data = await res.json() as T;
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
      if (this.#offset) {
        query.$offset = this.#offset.toString();
      }
      if (this.#limit) {
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

  select(...selects: Array<string | SelectImpl | FieldImpl>): this {
    const selectArray = selects.map((
      s,
    ) => (s instanceof SelectImpl ? s.value : (typeof s === "object" ? s.name : s))).filter((s) =>
      s
    );
    this.#select.push(...selectArray);
    return this;
  }

  where(...where: Array<string | Record<string, string> | Where>): this {
    addExpr(this.#where, where);
    return this;
  }

  having(...having: Array<string | Record<string, string> | Where>): this {
    addExpr(this.#having, having);
    return this;
  }

  groupBy(...group: string[]): this {
    this.#group.push(...group);
    return this;
  }

  orderBy(...order: Array<string | Order>): this {
    const orders = order.map((order: string | Order) =>
      order instanceof Order
        ? order.value
        : (/( ASC$| DESC$)/i.test(order) ? order : `${order} ASC`)
    );
    this.#order.push(...orders);
    return this;
  }

  offset(offset: number): this {
    this.#offset = offset;
    return this;
  }

  limit(limit: number): this {
    this.#limit = limit;
    return this;
  }

  /**
   * Full text search
   * @param q {string} The search query
   * @returns {SodaQuery} The query object
   */
  search(q: string): this {
    this.#_q = q;
    return this;
  }

  /**
   * Include system fields in the response
   * @returns {SodaQuery} The query object
   */
  withSystemFields(): this {
    this.#withSystemFields = true;
    return this;
  }

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
   */
  prepare(queryID: string): this {
    this.#queryMap.set(queryID, { ...this.buildQuery() });
    this.clear();
    return this;
  }

  execute(
    queryID?: string,
  ): DataResponse<Array<T & ExtraDataFields>> {
    return this.requestData<Array<T & ExtraDataFields>>(this.getURL(queryID)).then((res) => ({
      ...res,
      data: res.data ?? [],
    }));
  }

  executeGeoJSON(
    queryID?: string,
  ): DataResponse<unknown> {
    const url = this.getURL(queryID).replace(/\.json/, ".geojson");
    return this.requestData<unknown>(url).then((res) => ({
      ...res,
      data: res.data ?? { type: "FeatureCollection", features: [] },
    }));
  }

  getMetaData(): DataResponse<unknown> {
    const url = `https://${this.#domain}/api/views/${this.#datasetId}`;
    return this.requestData(url);
  }
}

export const createQueryWithDataset = <T>(
  domain: string,
  dataSetId: string,
  authOpts: AuthOpts = {},
  options: Options = {},
): SodaQuery<T> => new SodaQuery<T>(domain, authOpts, options).withDataset(dataSetId);
