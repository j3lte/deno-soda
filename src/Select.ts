import type { Field, FieldImpl } from "./types.ts";
import { DataType } from "./enums.ts";

import { getFieldName, testFieldImpl } from "./Field.ts";
import { SelectFunction, SelectImpl } from "./SelectImpl.ts";

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
    string | Field<DataType.Text> | Field<DataType.Number> | Field<DataType.FloatingTimestamp>
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
    string | Field<DataType.Text> | Field<DataType.Number> | Field<DataType.FloatingTimestamp>
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
  xField: string | Field<DataType.Number>,
  yField: string | Field<DataType.Number>,
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
  xField: string | Field<DataType.Number>,
  yField: string | Field<DataType.Number>,
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
  xField: string | Field<DataType.Number>,
  yField: string | Field<DataType.Number>,
): SelectImpl {
  return SelectMultipleFunc(
    SelectFunction.RegrSlope,
    "Can only use REGR_SLOPE on Number fields",
    [DataType.Number],
    xField,
    yField,
  );
}

function Select(): SelectImpl<DataType._Unknown>;
function Select<T extends string>(field: T): SelectImpl<DataType._Unknown>;
function Select<T extends FieldImpl>(field: T): SelectImpl<T["type"]>;
function Select<T extends DataType>(field: Field<T>): SelectImpl<T>;
function Select(field?: string | FieldImpl): SelectImpl<DataType._Unknown> {
  return new SelectImpl(field);
}
export { Select };
