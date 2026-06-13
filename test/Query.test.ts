import { assertEquals, assertNotEquals, assertRejects, assertThrows } from "@std/assert";
import { type Stub, stub } from "@std/testing/mock";
import { createQueryWithDataset, SodaQuery } from "../src/Query.ts";
import { Order } from "../src/Order.ts";
import { Where } from "../src/Where.ts";
import { Select } from "../src/Select.ts";
import { Field } from "../src/Field.ts";
import type { AuthOpts } from "../src/types.ts";

const createSampleQuery = <T>(authOpts?: AuthOpts) =>
  createQueryWithDataset<T>("test.example.com", "test", authOpts);

const BASE = "https://test.example.com/resource/test.json";

const ok = (body: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(body), { status: 200, ...init });

/** Map of request URL -> Response (or a factory for a fresh Response). */
type FetchRoutes = Record<string, Response | (() => Response)>;

/**
 * Stub `globalThis.fetch` with a URL-keyed route table.
 *
 * Returns the {@link Stub}, so callers can inspect `.calls` for assertions.
 * Use with `using` for automatic restore (even if the test throws). Requests to
 * a URL not in `routes` reject, mirroring a real network failure.
 */
function stubFetch(
  routes: FetchRoutes,
): Stub<typeof globalThis, Parameters<typeof fetch>, ReturnType<typeof fetch>> {
  return stub(globalThis, "fetch", (input: Request | URL | string): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    const route = routes[url];
    if (!route) {
      return Promise.reject(new Error(`Unmocked request: ${url}`));
    }
    return Promise.resolve((typeof route === "function" ? route() : route).clone());
  });
}

Deno.test("SodaQuery (empty)", () => {
  const query = new SodaQuery("test.example.com");
  assertThrows(() => query.getURL(), "No dataset specified");
  assertThrows(() => query.getDevURL(), "No dataset specified");
  query.withDataset("test");
  assertEquals(query.getURL(), "https://test.example.com/resource/test.json");
  assertEquals(query.getDevURL(), "https://dev.socrata.com/foundry/test.example.com/test");
});

Deno.test("SodaQuery (strict)", () => {
  const query = new SodaQuery("test.example.com", {}, { strict: true }).withDataset("test");

  assertThrows(() => query.withDataset("2"), "Should throw because of strict mode");
});

Deno.test("SodaQuery (simple)", () => {
  const query = createSampleQuery().simple({
    test: 1,
  });
  assertEquals(query.getURL(), "https://test.example.com/resource/test.json?test=1");

  query.withSystemFields();
  assertEquals(
    query.getURL(),
    "https://test.example.com/resource/test.json?test=1&$$exclude_system_fields=false",
  );
});

Deno.test("SodaQuery (store query)", () => {
  const query = createSampleQuery();

  assertThrows(() => query.getURL("test"), "Should throw because no query is set");
  query.soql("SOQL_QUERY");
  query.prepare("TEST");

  assertEquals(query.getURL(), "https://test.example.com/resource/test.json");
  assertEquals(
    query.getURL("TEST"),
    "https://test.example.com/resource/test.json?$query=SOQL_QUERY",
  );
});

Deno.test("SodaQuery QueryObj", () => {
  const query = createSampleQuery();

  query.search("test");
  assertEquals(query.buildQuery().q, "test");

  query.select(
    "field1",
    Select("field2"),
    Field("field3"),
  );
  assertEquals(query.buildQuery().$select, "field1,field2,field3");

  query.limit(10);
  assertEquals(query.buildQuery().$limit, "10");

  query.offset(10);
  assertEquals(query.buildQuery().$offset, "10");

  query.orderBy(Order.by("field1").asc);
  assertEquals(query.buildQuery().$order, "field1 ASC");

  query.orderBy(Order.by("field2").desc);
  assertEquals(query.buildQuery().$order, "field1 ASC, field2 DESC");

  query.orderBy("field3");
  assertEquals(query.buildQuery().$order, "field1 ASC, field2 DESC, field3 ASC");

  query.orderBy("field4 DESC");
  assertEquals(
    query.buildQuery().$order,
    "field1 ASC, field2 DESC, field3 ASC, field4 DESC",
  );

  assertThrows(
    () => query.having(Where.gt("field1", 1)).buildQuery(),
    "Should throw because no groupBy is set",
  );
  query.groupBy("field1");
  assertEquals(query.buildQuery().$group, "field1");
  query.groupBy("field2");
  assertEquals(query.buildQuery().$group, "field1, field2");

  query.where(Where.gt("field1", 1));
  assertEquals(query.buildQuery().$where, "(`field1` > 1)");
  query.where(Where.lt("field2", 2));
  assertEquals(query.buildQuery().$where, "(`field1` > 1) and (`field2` < 2)");
});

Deno.test("SodaQuery execute + single + response headers", async () => {
  const query = createSampleQuery<{ test: number }>();
  using _fetch = stubFetch({
    [BASE]: ok([{ test: 1 }], {
      headers: { "Last-Modified": "Mon, 01 Jan 2001 00:00:00 GMT", "ETag": "test" },
    }),
    [`${BASE}?$limit=1`]: ok([{ test: 1 }]),
  });

  const d = await query.execute();

  // headers reflect the most recent response, so assert before single() runs.
  assertEquals(query.headers.lastModified, "Mon, 01 Jan 2001 00:00:00 GMT");
  assertEquals(query.headers.etag, "test");

  const single = await query.single();

  assertEquals(d.data[0]?.test, 1);
  assertEquals(single.data.test, 1);
});

Deno.test("SodaQuery single returns null when empty", async () => {
  const query = createSampleQuery<{ test: number }>();
  using _fetch = stubFetch({ [`${BASE}?$limit=1`]: ok([]) });

  assertEquals((await query.single()).data, null);
});

Deno.test("SodaQuery sends auth headers", async () => {
  const cases: Array<[AuthOpts, string, string]> = [
    [{ accessToken: "test" }, "Authorization", "OAuth test"],
    [{ apiToken: "test" }, "X-App-Token", "test"],
    [{ username: "test", password: "test" }, "Authorization", `Basic ${btoa("test:test")}`],
  ];

  for (const [auth, header, expected] of cases) {
    using fetchStub = stubFetch({ [BASE]: ok([{ test: 1 }]) });

    await createSampleQuery<{ test: number }>(auth).execute();

    const [, init] = fetchStub.calls[0].args;
    assertEquals((init?.headers as Record<string, string>)[header], expected);
  }
});

Deno.test("SodaQuery returns error on non-OK response", async () => {
  const query = createSampleQuery<{ test: number }>();
  using _fetch = stubFetch({
    [BASE]: () => new Response(JSON.stringify({}), { status: 400, statusText: "Bad Request" }),
  });

  const res = await query.execute();

  assertNotEquals(res.error, null);
  assertEquals(res.status, 400);
  assertEquals(res.data.length, 0);
});

Deno.test("SodaQuery executeGeoJSON", async () => {
  const GEO = "https://test.example.com/resource/test.geojson";

  {
    using _fetch = stubFetch({ [GEO]: ok({ type: "FeatureCollection", features: [] }) });
    const geojson = await createSampleQuery().executeGeoJSON();
    assertEquals(geojson.error, null);
    assertNotEquals(geojson.data, null);
  }

  {
    // A null body falls back to an empty FeatureCollection.
    using _fetch = stubFetch({ [GEO]: ok(null) });
    const geojson = await createSampleQuery().executeGeoJSON();
    assertEquals(geojson.error, null);
    // deno-lint-ignore no-explicit-any
    assertEquals((geojson.data as any).features.length, 0);
  }
});

Deno.test("SodaQuery executeCSV returns the raw CSV string", async () => {
  const CSV = "https://test.example.com/resource/test.csv";

  {
    using _fetch = stubFetch({ [CSV]: new Response("a,b\n1,2", { status: 200 }) });
    const res = await createSampleQuery().executeCSV();
    assertEquals(res.error, null);
    assertEquals(res.data, "a,b\n1,2");
  }

  {
    // An error response yields an empty string.
    using _fetch = stubFetch({
      [CSV]: () => new Response(JSON.stringify({}), { status: 400, statusText: "Bad Request" }),
    });
    const res = await createSampleQuery().executeCSV();
    assertNotEquals(res.error, null);
    assertEquals(res.data, "");
  }
});

Deno.test("SodaQuery getMetaData", async () => {
  const query = createSampleQuery();
  using _fetch = stubFetch({ "https://test.example.com/api/views/test": ok({}) });

  const meta = await query.getMetaData();

  assertEquals(meta.error, null);
});

Deno.test("SodaQuery getMetaData throws without a dataset", () => {
  const query = new SodaQuery("test.example.com");
  assertThrows(() => query.getMetaData(), Error, "no dataset");
});

Deno.test("SodaQuery emits zero limit/offset", () => {
  const query = createSampleQuery().limit(0).offset(0);
  assertEquals(query.buildQuery().$limit, "0");
  assertEquals(query.buildQuery().$offset, "0");
});

Deno.test("SodaQuery single propagates a request rejection", async () => {
  const query = createSampleQuery<{ test: number }>().limit(5);
  // Empty route table: any request rejects, so single() rejects too.
  using _fetch = stubFetch({});

  await assertRejects(() => query.single());

  // single() builds its own $limit=1; it never mutates the query's own limit.
  assertEquals(query.buildQuery().$limit, "5");
});

Deno.test("SodaQuery single applies limit to a stored query", async () => {
  const query = createSampleQuery<{ test: number }>();
  query.select("a").prepare("STORED");

  using fetchStub = stubFetch({
    "https://test.example.com/resource/test.json?$select=a&$limit=1": ok([{ test: 1 }]),
  });

  const res = await query.single("STORED");

  assertEquals(res.data?.test, 1);
  const [url] = fetchStub.calls[0].args;
  assertEquals(url, "https://test.example.com/resource/test.json?$select=a&$limit=1");
});

Deno.test("SodaQuery single throws on an unknown stored query", () => {
  const query = createSampleQuery();
  assertThrows(() => query.single("NOPE"), Error, "No query with ID");
});

Deno.test("SodaQuery soql() and simple() override the builder", () => {
  const soqlQuery = createSampleQuery().select("a").where("b = 1").soql("SELECT *");
  assertEquals(soqlQuery.buildQuery().$query, "SELECT *");
  assertEquals(soqlQuery.buildQuery().$select, undefined);

  const simpleQuery = createSampleQuery().select("a").simple({ k: "v" });
  assertEquals(simpleQuery.buildQuery().k, "v");
  assertEquals(simpleQuery.buildQuery().$select, undefined);
});

Deno.test("SodaQuery clear resets all clauses", () => {
  const query = createSampleQuery()
    .select("a").where("b = 1").groupBy("c").orderBy("d").limit(5).offset(2).search("x");
  query.clear();
  assertEquals(query.buildQuery(), {});
});

Deno.test("SodaQuery forwards the AbortSignal to fetch", async () => {
  const query = createSampleQuery<{ test: number }>();
  const controller = new AbortController();
  using fetchStub = stubFetch({ [BASE]: ok([{ test: 1 }]) });

  await query.execute(undefined, controller.signal);

  const [, init] = fetchStub.calls[0].args;
  assertEquals(init?.signal, controller.signal);
});

Deno.test("SodaQuery executeGeoJSON with a stored query", async () => {
  const query = createSampleQuery();
  query.select("a").prepare("GEO");
  using _fetch = stubFetch({
    "https://test.example.com/resource/test.geojson?$select=a": ok({
      type: "FeatureCollection",
      features: [],
    }),
  });
  const res = await query.executeGeoJSON("GEO");
  assertEquals(res.error, null);
});

Deno.test("SodaQuery orderBy appends ASC to a directionless string", () => {
  assertEquals(createSampleQuery().orderBy("a").buildQuery().$order, "a ASC");
  assertEquals(createSampleQuery().orderBy("a DESC").buildQuery().$order, "a DESC");
});
