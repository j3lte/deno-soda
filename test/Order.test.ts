import { assertEquals } from "../dev_deps.ts";
import { Order } from "../src/Order.ts";

Deno.test("(Order.)Order", () => {
  assertEquals(Order.by("test").desc.value, "test DESC");
  assertEquals(Order.by("test").asc.value, "test ASC");
});
