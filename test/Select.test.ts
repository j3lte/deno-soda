import { assertEquals, assertThrows } from "../dev_deps.ts";
import {
  Select,
  SelectAll,
  SelectGreatest,
  SelectLeast,
  SelectRegrIntercept,
  SelectRegrR2,
  SelectRegrSlope,
} from "../src/Select.ts";
import { DataType } from "../src/types.ts";
import { Field } from "../src/Field.ts";
import { SelectFunction } from "../src/SelectImpl.ts";

const createField = <T extends DataType>(type: T, name = "test") => Field(name, type);

Deno.test("Select (empty)", () => {
  const select = Select();

  assertEquals(select.fieldName, "*");
  assertEquals(select.value, "*");
  assertEquals(select.toString(), "*");
});

Deno.test("Select (error)", () => {
  // @ts-expect-error - This is a pure test, wouldn't fly in Typescript, but we got to test it for Javascript
  assertThrows(() => Select(1));
});

Deno.test("Select (setFunc)", () => {
  const select = Select("test");

  select.setFunc(SelectFunction.Log, "test");

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "ln(test, test)");
  assertEquals(select.toString(), "ln(test, test)");

  select.setFunc(SelectFunction.Log);

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "ln(test)");
  assertEquals(select.toString(), "ln(test)");
});

Deno.test("Select (basic string field)", () => {
  const select = Select("test");

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "test");
  assertEquals(select.toString(), "test");
});

Deno.test("Select (Field obj)", () => {
  const select = Select(createField(DataType.Text));

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "test");
  assertEquals(select.toString(), "test");
});

Deno.test("Select (count)", () => {
  const select = Select(createField(DataType.Number)).count();
  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "count(test)");
});

Deno.test("Select (distinct)", () => {
  const select = Select(createField(DataType.Number)).distinct();
  assertEquals(select.value, "distinct(test)");
});

Deno.test("Select (alias)", () => {
  const select = Select(createField(DataType.Number)).as("test2");

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "test as test2");

  assertThrows(() => Select().as("test2"));
});

Deno.test("Select (Number Functions)", () => {
  const createSelect = (type: DataType = DataType.Number) => Select(createField(type));

  assertEquals(createSelect().avg().value, "avg(test)");
  assertThrows(() => createSelect(DataType.Text).avg());

  assertEquals(createSelect().abs().value, "abs(test)");
  assertThrows(() => createSelect(DataType.Text).abs());

  assertEquals(createSelect().min().value, "min(test)");
  assertThrows(() => createSelect(DataType.Checkbox).min());

  assertEquals(createSelect().max().value, "max(test)");
  assertThrows(() => createSelect(DataType.Checkbox).max());

  assertEquals(createSelect().sum().value, "sum(test)");
  assertThrows(() => createSelect(DataType.Text).sum());

  assertEquals(createSelect().standardDeviationPopulation().value, "stddev_pop(test)");
  assertThrows(() => createSelect(DataType.Text).standardDeviationPopulation());

  assertEquals(createSelect().standardDeviationSample().value, "stddev_samp(test)");
  assertThrows(() => createSelect(DataType.Text).standardDeviationSample());
});

Deno.test("Select (Date Extraction)", () => {
  const createSelect = (type: DataType = DataType.FloatingTimestamp) => Select(createField(type));

  assertEquals(createSelect().dateExtractDayOfDate().value, "date_extract_d(test)");
  assertThrows(() => createSelect(DataType.Text).dateExtractDayOfDate());

  assertEquals(createSelect().dateExtractDayOfWeek().value, "date_extract_dow(test)");
  assertThrows(() => createSelect(DataType.Text).dateExtractDayOfWeek());

  assertEquals(createSelect().dateExtractHourOfDay().value, "date_extract_hh(test)");
  assertThrows(() => createSelect(DataType.Text).dateExtractHourOfDay());

  assertEquals(createSelect().dateExtractMonth().value, "date_extract_m(test)");
  assertThrows(() => createSelect(DataType.Text).dateExtractMonth());

  assertEquals(createSelect().dateExtractMinute().value, "date_extract_mm(test)");
  assertThrows(() => createSelect(DataType.Text).dateExtractMinute());

  assertEquals(createSelect().dateExtractSeconds().value, "date_extract_ss(test)");
  assertThrows(() => createSelect(DataType.Text).dateExtractSeconds());

  assertEquals(createSelect().dateExtractWeekOfYear().value, "date_extract_woy(test)");
  assertThrows(() => createSelect(DataType.Text).dateExtractWeekOfYear());

  assertEquals(createSelect().dateExtractYear().value, "date_extract_y(test)");
  assertThrows(() => createSelect(DataType.Text).dateExtractYear());
});

Deno.test("Select (Date Truncation)", () => {
  const createSelect = (type: DataType = DataType.FloatingTimestamp) => Select(createField(type));

  assertEquals(createSelect().dateTruncYear().value, "date_trunc_y(test)");
  assertThrows(() => createSelect(DataType.Text).dateTruncYear());

  assertEquals(createSelect().dateTruncYearMonth().value, "date_trunc_ym(test)");
  assertThrows(() => createSelect(DataType.Text).dateTruncYearMonth());

  assertEquals(createSelect().dateTruncYearMonthDay().value, "date_trunc_ymd(test)");
  assertThrows(() => createSelect(DataType.Text).dateTruncYearMonthDay());
});

Deno.test("Select (Text functions", () => {
  const createSelect = (type: DataType = DataType.Text) => Select(createField(type));

  assertEquals(createSelect().lowerCase().value, "lower(test)");
  assertThrows(() => createSelect(DataType.Number).lowerCase());

  assertEquals(createSelect().upperCase().value, "upper(test)");
  assertThrows(() => createSelect(DataType.Number).upperCase());

  assertEquals(createSelect().length().value, "length(test)");
  assertThrows(() => createSelect(DataType.Number).length());

  assertEquals(createSelect().pad(1, "a", "LEFT").value, "pad_left(test, 1, 'a')");
  assertThrows(() => createSelect(DataType.Number).pad(1, "a", "LEFT"));

  assertEquals(createSelect().pad(1, "a", "RIGHT").value, "pad_right(test, 1, 'a')");
  assertThrows(() => createSelect(DataType.Number).pad(1, "a", "RIGHT"));

  // @ts-expect-error - testing invalid types
  assertThrows(() => createSelect().pad(1, "a", "CENTER"));
});

Deno.test("Select (Spatial functions)", () => {
  const createSelect = (type: DataType = DataType.Point) => Select(createField(type));

  assertEquals(
    createSelect().distanceInMeters(0, 0).value,
    "distance_in_meters(test, 'POINT(0, 0)')",
  );
  assertThrows(() => createSelect(DataType.Text).distanceInMeters(0, 0));

  assertEquals(createSelect().convexHull().value, "convex_hull(test)");
  assertThrows(() => createSelect(DataType.Text).convexHull());

  assertEquals(createSelect().numberOfVertices().value, "num_points(test)");
  assertThrows(() => createSelect(DataType.Text).numberOfVertices());

  assertEquals(createSelect(DataType.Line).simplify(0.1).value, "simplify(test, 0.1)");
  assertThrows(() => createSelect(DataType.Text).simplify(0.1));

  assertEquals(
    createSelect(DataType.Line).simplifyPreserveTopology(0.1).value,
    "simplify_preserve_topology(test, 0.1)",
  );
  assertThrows(() => createSelect(DataType.Text).simplifyPreserveTopology(0.1));

  assertEquals(createSelect(DataType.Line).extent().value, "extent(test)");
  assertThrows(() => createSelect(DataType.Text).extent());
});

Deno.test("Select (All)", () => {
  const select = SelectAll();

  assertEquals(select.fieldName, "*");
  assertEquals(select.value, "*");
});

Deno.test("Select Greatest", () => {
  const select = SelectGreatest(createField(DataType.Number), createField(DataType.Number));

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "greatest(test, test)");

  // @ts-ignore - testing invalid types
  assertThrows(() => SelectGreatest(createField(DataType.Text), createField(DataType.Checkbox)));
});

Deno.test("Select Least", () => {
  const select = SelectLeast(createField(DataType.Number), createField(DataType.Number));

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "least(test, test)");

  // @ts-ignore - testing invalid types
  assertThrows(() => SelectLeast(createField(DataType.Text), createField(DataType.Checkbox)));
});

Deno.test("Select RegrIntercept", () => {
  const select = SelectRegrIntercept(
    createField(DataType.Number),
    createField(DataType.Number),
  );

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "regr_intercept(test, test)");

  assertThrows(() =>
    // @ts-ignore - testing invalid types
    SelectRegrIntercept(createField(DataType.Text), createField(DataType.Checkbox))
  );
});

Deno.test("Select RegrSlope", () => {
  const select = SelectRegrSlope(
    createField(DataType.Number),
    createField(DataType.Number),
  );

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "regr_slope(test, test)");

  assertThrows(() =>
    // @ts-ignore - testing invalid types
    SelectRegrSlope(createField(DataType.Text), createField(DataType.Checkbox))
  );
});

Deno.test("Select RegrR2", () => {
  const select = SelectRegrR2(
    createField(DataType.Number),
    createField(DataType.Number),
  );

  assertEquals(select.fieldName, "test");
  assertEquals(select.value, "regr_r2(test, test)");

  assertThrows(() =>
    // @ts-ignore - testing invalid types
    SelectRegrR2(createField(DataType.Text), createField(DataType.Checkbox))
  );
});
