import { DataType, Field, FieldImpl, getFieldName, testFieldImpl } from "./Field.ts";
import { SelectFunction, SelectObject } from "./Select.ts";

/**
 * Shortcut for Select("*")
 */
export function SelectAll() {
  return new SelectObject("*");
}

function SelectMultipleFunc(
  func: SelectFunction,
  funcError: string,
  testArray: Array<DataType>,
  ...fields: Array<string | FieldImpl>
) {
  const tested = fields.every((field) =>
    typeof field === "string" ||
    testFieldImpl(field, ...testArray)
  );
  if (!tested) {
    throw new Error(funcError);
  }
  const sel = new SelectObject(fields[0]).setFunc(
    func,
    fields.slice(1).map((field) => getFieldName(field)).join(", "),
  );
  return sel;
}

/**
 * Returns the largest value among its arguments, ignoring NULLs.
 *
 * __This function works with 2.1 endpoint(s)__
 *
 * @url: https://dev.socrata.com/docs/functions/greatest.html
 */
export function SelectGreatest(
  ...fields: Array<
    string | Field<DataType.Text> | Field<DataType.Number> | Field<DataType.FloatingTimestamp>
  >
) {
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
 * __This function works with 2.1 endpoint(s)__
 *
 * @url: https://dev.socrata.com/docs/functions/least.html
 */
export function SelectLeast(
  ...fields: Array<
    string | Field<DataType.Text> | Field<DataType.Number> | Field<DataType.FloatingTimestamp>
  >
) {
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
 * __This function works with 2.1 endpoint(s)__
 *
 * @url: https://dev.socrata.com/docs/functions/regr_intercept.html
 */
export function SelectRegrIntercept(
  xField: string | Field<DataType.Number>,
  yField: string | Field<DataType.Number>,
) {
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
 * __This function works with 2.1 endpoint(s)__
 *
 * @url: https://dev.socrata.com/docs/functions/regr_r2.html
 */
export function SelectRegrR2(
  xField: string | Field<DataType.Number>,
  yField: string | Field<DataType.Number>,
) {
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
 * __This function works with 2.1 endpoint(s)__
 *
 * @url: https://dev.socrata.com/docs/functions/regr_slope.html
 */
export function SelectRegrSlope(
  xField: string | Field<DataType.Number>,
  yField: string | Field<DataType.Number>,
) {
  return SelectMultipleFunc(
    SelectFunction.RegrSlope,
    "Can only use REGR_SLOPE on Number fields",
    [DataType.Number],
    xField,
    yField,
  );
}
