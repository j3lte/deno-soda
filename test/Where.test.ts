import { assertEquals } from "../dev_deps.ts";
import { Where } from "../mod.ts";

Deno.test("Where.constructor", () => {
  const where = new Where("?? = ?", ["a", "b"]);
  assertEquals(where.value, "`a` = 'b'");
  assertEquals(where.toString(), "`a` = 'b'");
});

Deno.test("Where.expr", () => {
  assertEquals(Where.expr("?? = ?", "a", "b").toString(), "`a` = 'b'");
  assertEquals(Where.expr("?? = ?", "a", 1).toString(), "`a` = 1");
});

Deno.test("Where.eq", () => {
  assertEquals(Where.eq("a", "b").toString(), "`a` = 'b'");
  assertEquals(Where.eq("a", 1).toString(), "`a` = 1");
  assertEquals(Where.eq("a", null).toString(), "`a` IS NULL");
});

Deno.test("Where.from", () => {
  assertEquals(
    Where.from({ a: "b", c: 1 }).toString(),
    "(`a` = 'b' AND `c` = 1)",
  );
  assertEquals(
    Where.from({ a: "b", c: 1, d: null }).toString(),
    "(`a` = 'b' AND `c` = 1 AND `d` IS NULL)",
  );
});

Deno.test("Where.gt", () => {
  assertEquals(Where.gt("a", "b").toString(), "`a` > 'b'");
  assertEquals(Where.gt("a", 1).toString(), "`a` > 1");
});

Deno.test("Where.gte", () => {
  assertEquals(Where.gte("a", "b").toString(), "`a` >= 'b'");
  assertEquals(Where.gte("a", 1).toString(), "`a` >= 1");
});

Deno.test("Where.lt", () => {
  assertEquals(Where.lt("a", "b").toString(), "`a` < 'b'");
  assertEquals(Where.lt("a", 1).toString(), "`a` < 1");
});

Deno.test("Where.lte", () => {
  assertEquals(Where.lte("a", "b").toString(), "`a` <= 'b'");
  assertEquals(Where.lte("a", 1).toString(), "`a` <= 1");
});

Deno.test("Where.ne", () => {
  assertEquals(Where.ne("a", "b").toString(), "`a` != 'b'");
  assertEquals(Where.ne("a", 1).toString(), "`a` != 1");
  assertEquals(Where.ne("a", null).toString(), "`a` IS NOT NULL");
});

Deno.test("Where.isNull", () => {
  assertEquals(Where.isNull("a").toString(), "`a` IS NULL");
});

Deno.test("Where.isNotNull", () => {
  assertEquals(Where.isNotNull("a").toString(), "`a` IS NOT NULL");
});

Deno.test("Where.in", () => {
  assertEquals(Where.in("a", "b").toString(), "`a` in 'b'");
  assertEquals(Where.in("a", 1).toString(), "`a` in 1");
  assertEquals(Where.in("a", 1, 2).toString(), "`a` in (1,2)");
  assertEquals(Where.in("a", [1, 2]).toString(), "`a` in (1,2)");
});

Deno.test("Where.notIn", () => {
  assertEquals(Where.notIn("a", "b").toString(), "`a` not in 'b'");
  assertEquals(Where.notIn("a", 1).toString(), "`a` not in 1");
  assertEquals(Where.notIn("a", 1, 2).toString(), "`a` not in (1,2)");
  assertEquals(Where.notIn("a", [1, 2]).toString(), "`a` not in (1,2)");
});

Deno.test("Where.like", () => {
  assertEquals(Where.like("a", "b").toString(), "`a` like 'b'");
  assertEquals(Where.like("a", 1).toString(), "`a` like 1");
});

Deno.test("Where.notLike", () => {
  assertEquals(Where.notLike("a", "b").toString(), "`a` not like 'b'");
  assertEquals(Where.notLike("a", 1).toString(), "`a` not like 1");
});

Deno.test("Where.between", () => {
  assertEquals(Where.between("a", 1, 2).toString(), "`a` between 1 and 2");
});

Deno.test("Where.notBetween", () => {
  assertEquals(
    Where.notBetween("a", 1, 2).toString(),
    "`a` not between 1 and 2",
  );
});

Deno.test("Where.and", () => {
  assertEquals(
    Where.and(Where.eq("a", "b"), Where.eq("c", 1)).toString(),
    "(`a` = 'b' AND `c` = 1)",
  );
});

Deno.test("Where.or", () => {
  assertEquals(
    Where.or(Where.eq("a", "b"), Where.eq("c", 1)).toString(),
    "(`a` = 'b' OR `c` = 1)",
  );
});

Deno.test("Where.withinBox", () => {
  assertEquals(
    Where.withinBox("a", 1, 2, 3, 4).toString(),
    "within_box(`a`, 1, 2, 3, 4)",
  );
});

Deno.test("Where.withinCircle", () => {
  assertEquals(
    Where.withinCircle("a", 1, 2, 3).toString(),
    "within_circle(`a`, 1, 2, 3)",
  );
});

Deno.test("Where.startsWith", () => {
  assertEquals(
    Where.startsWith("a", "b").toString(),
    "starts_with(`a`, 'b')",
  );
});

Deno.test("Where.intersects", () => {
  assertEquals(
    Where.intersects("a", "b").toString(),
    "intersects(`a`, 'b')",
  );
});

Deno.test("Where.field", () => {
  assertEquals(Where.field("a").gt(1).toString(), "`a` > 1");
  assertEquals(Where.field("a").gte(1).toString(), "`a` >= 1");
  assertEquals(Where.field("a").lt(1).toString(), "`a` < 1");
  assertEquals(Where.field("a").lte(1).toString(), "`a` <= 1");
  assertEquals(Where.field("a").eq(1).toString(), "`a` = 1");
  assertEquals(Where.field("a").ne(1).toString(), "`a` != 1");
  assertEquals(Where.field("a").isNull().toString(), "`a` IS NULL");
  assertEquals(Where.field("a").isNotNull().toString(), "`a` IS NOT NULL");
  assertEquals(Where.field("a").in(1, 2).toString(), "`a` in (1,2)");
  assertEquals(Where.field("a").notIn(1, 2).toString(), "`a` not in (1,2)");
  assertEquals(Where.field("a").like(1).toString(), "`a` like 1");
  assertEquals(Where.field("a").notLike(1).toString(), "`a` not like 1");
  assertEquals(Where.field("a").between(1, 2).toString(), "`a` between 1 and 2");
  assertEquals(
    Where.field("a").notBetween(1, 2).toString(),
    "`a` not between 1 and 2",
  );
  assertEquals(
    Where.field("a").withinBox(1, 2, 3, 4).toString(),
    "within_box(`a`, 1, 2, 3, 4)",
  );
  assertEquals(
    Where.field("a").withinCircle(1, 2, 3).toString(),
    "within_circle(`a`, 1, 2, 3)",
  );
  assertEquals(
    Where.field("a").startsWith("test").toString(),
    "starts_with(`a`, 'test')",
  );
  assertEquals(
    Where.field("a").intersects("test").toString(),
    "intersects(`a`, 'test')",
  );
  // assertEquals(Where.field("a").between(1, 2).toString(), "");
});
