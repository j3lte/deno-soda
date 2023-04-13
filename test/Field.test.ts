// import type { Field } from "../src/types.ts";

import { assertEquals } from "../dev_deps.ts";
import { Field, getFieldName, testFieldImpl } from "../src/Field.ts";
import { DataType } from "../src/types.ts";

Deno.test("(Field.)testFieldImpl", () => {
  const field = Field("test", DataType.Checkbox);
  assertEquals(testFieldImpl(null), true);
  assertEquals(testFieldImpl(null, DataType.Checkbox), true);
  assertEquals(testFieldImpl(field, DataType.Checkbox), true);
  assertEquals(testFieldImpl(field, DataType.Text), false);
  assertEquals(testFieldImpl(field, DataType.Text, DataType.Checkbox), true);
});

Deno.test("(Field.)getFieldName", () => {
  assertEquals(getFieldName("test"), "test");
  assertEquals(
    getFieldName(Field("field", DataType.Checkbox)),
    "field",
  );
});

Deno.test("(Field.)Field", () => {
  const field = Field("test", DataType.Checkbox);
  assertEquals(field.name, "test");
  assertEquals(field.type, DataType.Checkbox);
  assertEquals(field.toString(), "test");

  const field2 = Field("test2");
  assertEquals(field2.type, DataType._Unknown);
});
