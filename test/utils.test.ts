import { assertThrows } from "https://deno.land/std@0.182.0/testing/asserts.ts";
import { assertEquals, assertMatch } from "../dev_deps.ts";
import { addExpr, expr, handleLiteral } from "../src/utils/expr.ts";
import { replaceParams } from "../src/utils/param.ts";
import { toQS } from "../src/utils/qs.ts";

Deno.test("Utils::expr::handleLiteral", () => {
  assertEquals(handleLiteral("test"), "'test'");
  assertEquals(handleLiteral("test'"), "'test''");
  assertEquals(handleLiteral("1"), "'1'");
  assertEquals(handleLiteral(1), 1);
  assertEquals(handleLiteral("1.0001"), "'1.0001'");
  assertEquals(handleLiteral(1.0001), 1.0001);
});

Deno.test("Utils::expr::expr", () => {
  assertEquals(expr.and("test"), "(test)");
  assertEquals(expr.and("test", "test2"), "(test) and (test2)");
  assertEquals(expr.or("test"), "(test)");
  assertEquals(expr.or("test", "test2"), "(test) or (test2)");
});

Deno.test("Utils::expr::addExpr", () => {
  const target: string[] = [];
  addExpr(target, ["test"]);
  assertEquals(target, ["test"]);
  addExpr(target, ["test2"]);
  assertEquals(target, ["test", "test2"]);
  addExpr(target, [{ test3: "test4" }]);
  assertEquals(target, ["test", "test2", "test3 = 'test4'"]);
});

Deno.test("Utils::params::replaceParams", () => {
  assertEquals(replaceParams("??"), "??");
  assertEquals(replaceParams("?? in ?", ["test", "test2"]), "`test` in 'test2'");
  assertEquals(replaceParams("?? in ?", ["test", 1]), "`test` in 1");
  assertEquals(replaceParams("?? in ?", ["test", 1.0001]), "`test` in 1.0001");
  assertEquals(replaceParams("?? in ?", ["test", null]), "`test` in NULL");
  assertEquals(replaceParams("?? in ?", ["*", undefined]), "* in NULL");
  assertEquals(
    replaceParams("??.?? in ?", ["test", "test2", "test3"]),
    "`test`.`test2` in 'test3'",
  );
  assertEquals(
    replaceParams("?? in ?", [["test", "test2"], 1]),
    "(`test`,`test2`) in 1",
  );
  assertEquals(
    replaceParams("?? in ?", ["test.1", 1]),
    "`test`.`1` in 1",
  );
  assertEquals(
    replaceParams("?? in ?", ["test as test2", 1]),
    "`test` AS `test2` in 1",
  );
  const withDate = replaceParams("?? = ?", ["test", new Date(0)]);
  assertMatch(withDate, /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3})/);

  assertThrows(() => replaceParams("?? in ?", ["test", { test: "test" }]), "Should throw an error");
});

Deno.test("Utils::qs::toQS", () => {
  assertEquals(toQS({ test: "test" }), "test=test");
  assertEquals(toQS([{ test: "test" }, { test2: "test2" }]), "0[test]=test&1[test2]=test2");
  assertEquals(
    toQS([{ test: "test" }, { test2: { "test1": "test1" } }]),
    "0[test]=test&1[test2][test1]=test1",
  );
  assertEquals(toQS({ test: "test" }), "test=test");
  assertEquals(toQS({ test: "test", test2: "test3" }), "test=test&test2=test3");
  assertEquals(toQS({ test: "test", test2: "test3", test3: 1 }), "test=test&test2=test3&test3=1");
  assertEquals(
    toQS({ test: "test", test2: "test3", test3: 1, test4: new Date(0) }),
    "test=test&test2=test3&test3=1&",
  );
  assertEquals(
    toQS({ test: "test", test2: "test3", test3: 1, test4: { test: "test" } }),
    "test=test&test2=test3&test3=1&test4[test]=test",
  );
  assertEquals(
    toQS(["test", "test2"]),
    "0=test&1=test2",
  );
  assertEquals(
    toQS({
      test1: {
        test2: ["test3", "test4"],
      },
    }),
    "test1[test2]=test3&test1[test2]=test4",
  );
});
