import type { Field } from "../src/types.ts";

import { assertEquals } from "../dev_deps.ts";
import { getFieldName, testFieldImpl } from "../src/Field.ts";
import { DataType } from "../src/types.ts";

Deno.test("(Field.)testFieldImpl", () => {
  const field: Field<DataType.Checkbox> = {
    name: "test",
    type: DataType.Checkbox,
  };
  assertEquals(testFieldImpl(null), true);
  assertEquals(testFieldImpl(null, DataType.Checkbox), true);
  assertEquals(testFieldImpl(field, DataType.Checkbox), true);
  assertEquals(testFieldImpl(field, DataType.Text), false);
  assertEquals(testFieldImpl(field, DataType.Text, DataType.Checkbox), true);
});

Deno.test("(Field.)getFieldName", () => {
  assertEquals(getFieldName("test"), "test");
  assertEquals(
    getFieldName({
      name: "field",
      type: DataType.Checkbox,
    }),
    "field",
  );
});
