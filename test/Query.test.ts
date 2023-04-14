import { assertEquals, assertNotEquals, assertThrows } from "../dev_deps.ts";
import { mockFetch, unMockFetch } from "./util.ts";
import { createQueryWithDataset, SodaQuery } from "../src/Query.ts";
import { Order } from "../src/Order.ts";
import { Where } from "../src/Where.ts";
import { Select } from "../src/Select.ts";
import { Field } from "../src/Field.ts";
import type { AuthOpts } from "../src/types.ts";

const createSampleQuery = <T>(authOpts?: AuthOpts) =>
  createQueryWithDataset<T>("test.example.com", "test", authOpts);

const createRequest = (url = "https://test.example.com/resource/test.json") =>
  new Request(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    redirect: "follow",
  });

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

Deno.test("SodaQuery (request)", async () => {
  const query = createSampleQuery<{ test: number }>();

  await mockFetch(
    createRequest(),
    new Response(JSON.stringify([{ test: 1 }]), {
      status: 200,
      headers: {
        "Last-Modified": "Mon, 01 Jan 2001 00:00:00 GMT",
        "ETag": "test",
      },
    }),
  );

  const d = await query.execute();
  assertEquals(d.data[0]?.test, 1);
  assertEquals(query.headers.lastModified, "Mon, 01 Jan 2001 00:00:00 GMT");
  assertEquals(query.headers.etag, "test");

  // With Access Token
  const query2 = createSampleQuery<{ test: number }>({
    accessToken: "test",
  });
  const reqWithAuthToken = createRequest();
  reqWithAuthToken.headers.append("Authorization", `OAuth test`);

  await mockFetch(reqWithAuthToken, new Response(JSON.stringify([{ test: 1 }]), { status: 200 }));

  await query2.execute();

  // With App Token
  const query3 = createSampleQuery<{ test: number }>({
    apiToken: "test",
  });
  const reqWithAppToken = createRequest();
  reqWithAppToken.headers.append("X-App-Token", "test");

  await mockFetch(reqWithAppToken, new Response(JSON.stringify([{ test: 1 }]), { status: 200 }));

  await query3.execute();

  // With Username and Password
  const query4 = createSampleQuery<{ test: number }>({
    username: "test",
    password: "test",
  });
  const reqWithUsernamePassword = createRequest();
  reqWithUsernamePassword.headers.append("Authorization", `Basic ${btoa("test:test")}`);

  await mockFetch(
    reqWithUsernamePassword,
    new Response(JSON.stringify([{ test: 1 }]), { status: 200 }),
  );

  await query4.execute();

  // Error
  await mockFetch(
    createRequest(),
    new Response(JSON.stringify({}), {
      status: 400,
      statusText: "Bad Request",
    }),
  );
  const errorQ = await query.execute();

  assertNotEquals(errorQ.error, null);
  assertEquals(errorQ.status, 400);
  assertEquals(errorQ.data.length, 0);

  // GeoJSON
  const query5 = createSampleQuery<{ test: number }>();
  const req = createRequest("https://test.example.com/resource/test.geojson");
  await mockFetch(
    req,
    new Response(JSON.stringify({ type: "FeatureCollection", features: [] }), {
      status: 200,
    }),
  );

  const geojson = await query5.executeGeoJSON();
  assertEquals(geojson.error, null);
  assertNotEquals(geojson.data, null);

  await mockFetch(
    createRequest("https://test.example.com/api/views/test"),
    new Response(JSON.stringify({}), {
      status: 200,
    }),
  );

  await query.getMetaData();

  await unMockFetch();
});
