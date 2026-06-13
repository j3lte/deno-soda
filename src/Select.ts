import type { FieldImpl } from "./types.ts";
import { DataType } from "./types.ts";

import { type FieldObject, getFieldName, testFieldImpl } from "./Field.ts";
import { SelectFunction, SelectImpl } from "./SelectImpl.ts";
import { Where } from "./Where.ts";
import { replaceParams, type SupportTypeElement } from "./utils/param.ts";

/**
 * Shortcut for Select("*")
 */
export function SelectAll(): SelectImpl {
  return new SelectImpl("*");
}

function SelectMultipleFunc(
  func: SelectFunction,
  funcError: string,
  testArray: Array<DataType>,
  ...fields: Array<string | FieldImpl>
): SelectImpl {
  const tested = fields.every((field) =>
    typeof field === "string" ||
    testFieldImpl(field, ...testArray)
  );
  if (!tested) {
    throw new Error(funcError);
  }
  const sel = new SelectImpl(fields[0]).setFunc(
    func,
    fields.slice(1).map((field) => getFieldName(field)).join(", "),
  );
  return sel;
}

/**
 * Returns the largest value among its arguments, ignoring NULLs.
 *
 * Docs: https://dev.socrata.com/docs/functions/greatest.html
 */
export function SelectGreatest(
  ...fields: Array<
    | string
    | FieldObject<DataType.Text>
    | FieldObject<DataType.Number>
    | FieldObject<DataType.FloatingTimestamp>
  >
): SelectImpl {
  return SelectMultipleFunc(
    SelectFunction.Greatest,
    "Can only use LARGEST on Text, Number, and Floating Timestamp fields",
    [DataType.Text, DataType.Number, DataType.FloatingTimestamp],
    ...fields,
  );
}

/**
 * Returns the smallest value among its arguments, ignoring NULLs.
 *
 * Docs: https://dev.socrata.com/docs/functions/least.html
 */
export function SelectLeast(
  ...fields: Array<
    | string
    | FieldObject<DataType.Text>
    | FieldObject<DataType.Number>
    | FieldObject<DataType.FloatingTimestamp>
  >
): SelectImpl {
  return SelectMultipleFunc(
    SelectFunction.Least,
    "Can only use LEAST on Text, Number, and Floating Timestamp fields",
    [DataType.Text, DataType.Number, DataType.FloatingTimestamp],
    ...fields,
  );
}

/**
 * Returns the y-intercept of the linear least squares fit
 *
 * Docs: https://dev.socrata.com/docs/functions/regr_intercept.html
 */
export function SelectRegrIntercept(
  xField: string | FieldObject<DataType.Number>,
  yField: string | FieldObject<DataType.Number>,
): SelectImpl {
  return SelectMultipleFunc(
    SelectFunction.RegrIntercept,
    "Can only use REGR_INTERCEPT on Number fields",
    [DataType.Number],
    xField,
    yField,
  );
}

/**
 * Returns the square of the correlation coefficient (r²)
 *
 * Docs: https://dev.socrata.com/docs/functions/regr_r2.html
 */
export function SelectRegrR2(
  xField: string | FieldObject<DataType.Number>,
  yField: string | FieldObject<DataType.Number>,
): SelectImpl {
  return SelectMultipleFunc(
    SelectFunction.RegrR2,
    "Can only use REGR_R2 on Number fields",
    [DataType.Number],
    xField,
    yField,
  );
}

/**
 * Returns the slope of the linear least squares fit
 *
 * Docs: https://dev.socrata.com/docs/functions/regr_slope.html
 */
export function SelectRegrSlope(
  xField: string | FieldObject<DataType.Number>,
  yField: string | FieldObject<DataType.Number>,
): SelectImpl {
  return SelectMultipleFunc(
    SelectFunction.RegrSlope,
    "Can only use REGR_SLOPE on Number fields",
    [DataType.Number],
    xField,
    yField,
  );
}

/**
 * Build a `case(...)` conditional select from `[condition, value]` pairs.
 *
 * Conditions are evaluated in order; the first true condition's value is
 * returned. Add a trailing `[true, default]` pair for a fallback.
 *
 * Docs: https://dev.socrata.com/docs/functions/case
 *
 * @param cases One or more `[condition, value]` tuples. The condition is a
 *   {@link Where} or a raw SoQL boolean string; the value is a literal.
 */
export function SelectCase(
  ...cases: Array<[Where | string, SupportTypeElement]>
): SelectImpl {
  const parts = cases.flatMap(([condition, value]) => {
    const cond = condition instanceof Where ? condition.value : condition;
    // Route values through replaceParams so single quotes are doubled and
    // Date/null/boolean render as valid SoQL — same escaping as Where values.
    return [cond, replaceParams("?", [value])];
  });
  return SelectImpl.case(parts);
}

/**
 * Create a {@link SelectImpl} for a field, used to build a `$select` clause.
 *
 * Pass nothing (or `"*"`) to select all columns, a string for a plain field, or
 * a typed {@link FieldObject} to enable type-checked aggregate/scalar functions.
 *
 * @param field Field name or {@link FieldImpl} instance (omit for all fields)
 */
function Select(): SelectImpl<DataType._Unknown>;
function Select<T extends string>(field: T): SelectImpl<DataType._Unknown>;
function Select<T extends FieldImpl>(field: T): SelectImpl<T["type"]>;
function Select<T extends DataType>(field: FieldObject<T>): SelectImpl<T>;
function Select(field?: string | FieldImpl): SelectImpl<DataType._Unknown> {
  return new SelectImpl(field);
}
export { Select };
