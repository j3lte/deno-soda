import { DataType, Field, FieldImpl, testFieldImpl } from "./Field.ts";

export enum SelectFunction {
  Abs = "abs",
  Avg = "avg",
  Extent = "extent",
  Field = "field",
  Count = "count",
  ConvexHull = "convex_hull",
  DateExtractDayOfDate = "date_extract_d",
  DateExtractDayOfWeek = "date_extract_dow",
  DateExtractHourOfDay = "date_extract_hh",
  DateExtractMonth = "date_extract_m",
  DateExtractMinute = "date_extract_mm",
  DateExtractSeconds = "date_extract_ss",
  DateExtractWeekOfYear = "date_extract_woy",
  DateExtractYear = "date_extract_y",
  DateTruncYear = "date_trunc_y",
  DateTruncYearMonth = "date_trunc_ym",
  DateTruncYearMonthDay = "date_trunc_ymd",
  DistanceInMeter = "distance_in_meters",
  Distinct = "distinct",
  Greatest = "greatest",
  Least = "least",
  Length = "length",
  Log = "ln",
  LowerCase = "lower",
  Max = "max",
  Min = "min",
  NumberOfVertices = "num_points",
  PadLeft = "pad_left",
  PadRight = "pad_right",
  RegrIntercept = "regr_intercept",
  RegrR2 = "regr_r2",
  RegrSlope = "regr_slope",
  Simplify = "simplify",
  SimplifyPreserveTopology = "simplify_preserve_topology",
  StandardDeviationPopulation = "stddev_pop",
  StandardDeviationSampled = "stddev_samp",
  Sum = "sum",
  UpperCase = "upper",
  WithinBox = "within_box",
  WithinCircle = "within_circle",
  WithinPolygon = "within_polygon",
}

/**
 * SelectObject is used to build a select query
 *
 * Note: This is an internal class and should not be used directly
 */
export class SelectObject<T = DataType> {
  private fieldObj: FieldImpl | null = null;
  private field: string | null = null;

  private asField: string | null = null;
  private extraField: string | null = null;
  private func: SelectFunction = SelectFunction.Field;

  constructor(field?: string | FieldImpl) {
    if (typeof field === "undefined") {
      this.field = "*";
    } else if (typeof field === "string") {
      this.field = field;
    } else if (
      typeof field === "object" && field?.name && field?.type
    ) {
      this.fieldObj = field;
    } else {
      throw new Error(`Invalid field: ${field}`);
    }
  }

  get fieldName(): string {
    return this.field ?? this.fieldObj?.name ?? "*";
  }

  get value(): string {
    return this.toString();
  }

  setFunc(func: SelectFunction, extraField?: string): SelectObject<T> {
    this.func = func;
    this.extraField = extraField ?? null;
    return this;
  }

  toString(): string {
    const fieldName = this.fieldName;
    const field = this.func === SelectFunction.Field
      ? fieldName
      : `${this.func}(${fieldName}${this.extraField !== null ? `, ${this.extraField}` : ""})`;
    return this.asField ? `${field} as ${this.asField}` : field;
  }

  as(as: string): SelectObject<T> {
    if (this.fieldName === "*") {
      throw new Error("Cannot use AS on * (all fields)");
    }
    this.asField = as;
    return this;
  }

  /**
   * Works on fields of type Number
   */
  abs(): SelectObject<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error("Can only use ABS on Number fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Abs;
    return this;
  }

  /**
   * Works on fields of type Number
   * @url: https://dev.socrata.com/docs/functions/avg.html
   */
  avg(): SelectObject<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error("Can only use AVG on Number fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Avg;
    return this;
  }

  /**
   * Works on fields of type Number
   * @url: https://dev.socrata.com/docs/functions/sum.html
   */
  sum(): SelectObject<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error("Can only use SUM on Number fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Sum;
    return this;
  }

  /**
   * Works like SELECT COUNT(*)
   * @url: https://dev.socrata.com/docs/functions/count.html
   */
  count(): SelectObject<T> {
    this.extraField = null;
    this.func = SelectFunction.Count;
    return this;
  }

  /**
   * Returns distinct set of records
   * @url: https://dev.socrata.com/docs/functions/distinct.html
   */
  distinct(): SelectObject<T> {
    this.extraField = null;
    this.func = SelectFunction.Distinct;
    return this;
  }

  /**
   * Returns the maximum of a given set of numbers
   *
   * Works on fields of type Number/Text/FloatingTimestamp/FixedTimestamp
   *
   * _This function works with 2.1 endpoint(s)_
   *
   * @url: https://dev.socrata.com/docs/functions/max.html
   */
  max(): SelectObject<
    | DataType.Number
    | DataType.Text
    | DataType.FloatingTimestamp
    | DataType.FixedTimestamp
  > {
    if (
      !testFieldImpl(
        this.fieldObj,
        DataType.Number,
        DataType.Text,
        DataType.FloatingTimestamp,
        DataType.FixedTimestamp,
      )
    ) {
      throw new Error(
        "Can only use MAX on Number/Text/FloatingTimestamp/FixedTimestamp fields",
      );
    }
    this.extraField = null;
    this.func = SelectFunction.Max;
    return this;
  }

  /**
   * Returns the minimum of a given set of numbers
   *
   * Works on fields of type Number/Text/FloatingTimestamp/FixedTimestamp
   *
   * _This function works with 2.1 endpoint(s)_
   *
   * @url: https://dev.socrata.com/docs/functions/min.html
   */
  min(): SelectObject<
    | DataType.Number
    | DataType.Text
    | DataType.FloatingTimestamp
    | DataType.FixedTimestamp
  > {
    if (
      !testFieldImpl(
        this.fieldObj,
        DataType.Number,
        DataType.Text,
        DataType.FloatingTimestamp,
        DataType.FixedTimestamp,
      )
    ) {
      throw new Error(
        "Can only use MIN on Number/Text/FloatingTimestamp/FixedTimestamp fields",
      );
    }
    this.extraField = null;
    this.func = SelectFunction.Min;
    return this;
  }

  /**
   * Works on fields of type Point/MultiPoint/Line/MultiLine/Polygon/MultiPolygon
   *
   * Returns the minimum convex geometry that encloses all of another geometry's points.
   *
   * @url: https://dev.socrata.com/docs/functions/convex_hull.html
   */
  convexHull(): SelectObject<
    | DataType.Point
    | DataType.MultiPoint
    | DataType.Line
    | DataType.MultiLine
    | DataType.Polygon
    | DataType.MultiPolygon
  > {
    if (
      !testFieldImpl(
        this.fieldObj,
        DataType.Point,
        DataType.MultiPoint,
        DataType.Line,
        DataType.MultiLine,
        DataType.Polygon,
        DataType.MultiPolygon,
      )
    ) {
      throw new Error(
        "Can only use CONVEX_HULL on Point/MultiPoint/Line/MultiLine/Polygon/MultiPolygon fields",
      );
    }
    this.extraField = null;
    this.func = SelectFunction.ConvexHull;
    return this;
  }

  private dateExtract(
    funcName: string,
    func: SelectFunction,
  ): SelectObject<DataType.FloatingTimestamp> {
    if (!testFieldImpl(this.fieldObj, DataType.FloatingTimestamp)) {
      throw new Error(`Can only use ${funcName} on Floating Timestamp fields`);
    }
    this.extraField = null;
    this.func = func;
    return this;
  }

  /**
   * Extracts the day from the date as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_extract_d.html
   */
  dateExtractDayOfDate(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_EXTRACT_DAY_OF_DATE",
      SelectFunction.DateExtractDayOfDate,
    );
  }

  /**
   * Extracts the day of the week as an integer between 0 and 6 (inclusive).
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_extract_dow.html
   */
  dateExtractDayOfWeek(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_EXTRACT_DAY_OF_WEEK",
      SelectFunction.DateExtractDayOfWeek,
    );
  }

  /**
   * Extracts the hour of the day as an integer between 0 and 23 (inclusive).
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_extract_hh.html
   */
  dateExtractHourOfDay(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_EXTRACT_HOUR_OF_DAY",
      SelectFunction.DateExtractHourOfDay,
    );
  }

  /**
   * Extracts the month as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_extract_m.html
   */
  dateExtractMonth(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_EXTRACT_MONTH",
      SelectFunction.DateExtractMonth,
    );
  }

  /**
   * Extracts the minute from the time as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_extract_mm.html
   */
  dateExtractMinute(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_EXTRACT_MINUTE",
      SelectFunction.DateExtractMinute,
    );
  }

  /**
   * Extracts the second from the time as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_extract_ss.html
   */
  dateExtractSeconds(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_EXTRACT_SECOND",
      SelectFunction.DateExtractSeconds,
    );
  }

  /**
   * Extracts the week of the year as an integer between 0 and 51 (inclusive).
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_extract_woy.html
   */
  dateExtractWeekOfYear(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_EXTRACT_WEEK_OF_YEAR",
      SelectFunction.DateExtractWeekOfYear,
    );
  }

  /**
   * Extracts the year as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_extract_y.html
   */
  dateExtractYear(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_EXTRACT_YEAR",
      SelectFunction.DateExtractYear,
    );
  }

  /**
   * Truncates a calendar date at the year threshold
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.0 and 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_trunc_y.html
   */
  dateTruncYear(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract("DATE_TRUNC_Y", SelectFunction.DateTruncYear);
  }

  /**
   * Truncates a calendar date at the year/month threshold
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.0 and 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_trunc_ym.html
   */
  dateTruncYearMonth(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract("DATE_TRUNC_YM", SelectFunction.DateTruncYearMonth);
  }

  /**
   * Truncates a calendar date at the year/month/date threshold
   *
   * Works on fields of type Floating Timestamp
   *
   * __This function works with 2.0 and 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/date_trunc_ymd.html
   */
  dateTruncYearMonthDay(): SelectObject<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_TRUNC_YMD",
      SelectFunction.DateTruncYearMonthDay,
    );
  }

  /**
   * Works on fields of type Point
   * @url: https://dev.socrata.com/docs/functions/distance_in_meters.html
   */
  distanceInMeters(lat: number, lon: number): SelectObject<DataType.Point> {
    if (!testFieldImpl(this.fieldObj, DataType.Point)) {
      throw new Error("Can only use DISTANCE_IN_METERS on Point fields");
    }
    this.extraField = `'POINT(${lon}, ${lat})'`;
    this.func = SelectFunction.DistanceInMeter;
    return this;
  }

  /**
   * Works on fields of type Text
   */
  lowerCase(): SelectObject<DataType.Text> {
    if (!testFieldImpl(this.fieldObj, DataType.Text)) {
      throw new Error("Can only use LOWER_CASE on Text fields");
    }
    this.extraField = null;
    this.func = SelectFunction.LowerCase;
    return this;
  }

  /**
   * Works on fields of type Text
   */
  upperCase(): SelectObject<DataType.Text> {
    if (!testFieldImpl(this.fieldObj, DataType.Text)) {
      throw new Error("Can only use UPPER_CASE on Text fields");
    }
    this.extraField = null;
    this.func = SelectFunction.UpperCase;
    return this;
  }

  /**
   * Works on fields of type Text
   */
  length(): SelectObject<DataType.Text> {
    if (!testFieldImpl(this.fieldObj, DataType.Text)) {
      throw new Error("Can only use LENGTH on Text fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Length;
    return this;
  }

  pad(length: number, pad: string, type: "LEFT" | "RIGHT"): SelectObject<DataType.Text> {
    if (!testFieldImpl(this.fieldObj, DataType.Text)) {
      throw new Error("Can only use PAD on Text fields");
    }
    if (type !== "LEFT" && type !== "RIGHT") {
      throw new Error("Type must be either LEFT or RIGHT");
    }
    this.extraField = `${length}, '${pad}'`;
    this.func = type === "LEFT" ? SelectFunction.PadLeft : SelectFunction.PadRight;
    return this;
  }

  standardDeviationSample(): SelectObject<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error(
        "Can only use STANDARD_DEVIATION_SAMPLE on Number fields",
      );
    }
    this.extraField = null;
    this.func = SelectFunction.StandardDeviationSampled;
    return this;
  }

  standardDeviationPopulation(): SelectObject<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error(
        "Can only use STANDARD_DEVIATION_POPULATION on Number fields",
      );
    }
    this.extraField = null;
    this.func = SelectFunction.StandardDeviationPopulation;
    return this;
  }

  /**
   * Returns the number of vertices in a geospatial data record
   *
   * Works on fields of type Polygon, Line, Point, MultiPoint, MultiLine, MultiPolygon
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/num_points.html
   */
  numberOfVertices(): SelectObject<
    | DataType.Polygon
    | DataType.Line
    | DataType.Point
    | DataType.MultiPoint
    | DataType.MultiLine
    | DataType.MultiPolygon
  > {
    if (
      !testFieldImpl(
        this.fieldObj,
        DataType.Polygon,
        DataType.Line,
        DataType.Point,
        DataType.MultiPoint,
        DataType.MultiLine,
        DataType.MultiPolygon,
      )
    ) {
      throw new Error("Can only use NUM_POINTS on Polygon fields");
    }
    this.extraField = null;
    this.func = SelectFunction.NumberOfVertices;
    return this;
  }

  /**
   * Reduces the number of vertices in a line or polygon
   *
   * @param tolerance The tolerance to use when simplifying the geometry, in meters
   *
   * @url: https://dev.socrata.com/docs/functions/simplify.html
   */
  simplify(tolerance: number): SelectObject<
    | DataType.Line
    | DataType.MultiLine
    | DataType.Polygon
    | DataType.MultiPolygon
  > {
    if (
      !testFieldImpl(
        this.fieldObj,
        DataType.Line,
        DataType.MultiLine,
        DataType.Polygon,
        DataType.MultiPolygon,
      )
    ) {
      throw new Error(
        "Can only use SIMPLIFY on Line/MultiLine/Polygon/MultiPolygon fields",
      );
    }
    this.extraField = `${tolerance}`;
    this.func = SelectFunction.Simplify;
    return this;
  }

  /**
   * Reduces the number of vertices in a line or polygon, preserving topology
   *
   * @param tolerance  The tolerance to use when simplifying the geometry, in meters
   *
   * @url: https://dev.socrata.com/docs/functions/simplify_preserve_topology.html
   */
  simplifyPreserveTopology(tolerance: number): SelectObject<
    | DataType.Line
    | DataType.MultiLine
    | DataType.Polygon
    | DataType.MultiPolygon
  > {
    if (
      !testFieldImpl(
        this.fieldObj,
        DataType.Line,
        DataType.MultiLine,
        DataType.Polygon,
        DataType.MultiPolygon,
      )
    ) {
      throw new Error(
        "Can only use SIMPLIFY_PRESERVE_TOPOLOGY on Line/MultiLine/Polygon/MultiPolygon fields",
      );
    }
    this.extraField = `${tolerance}`;
    this.func = SelectFunction.SimplifyPreserveTopology;
    return this;
  }

  /**
   * Returns a bounding box that encloses a set of geometries
   *
   * Works on fields of type Point, MultiPoint, Line, MultiLine, Polygon, MultiPolygon
   *
   * __This function works with 2.1 endpoint(s)__
   *
   * @url: https://dev.socrata.com/docs/functions/extent.html
   */
  extent(): SelectObject<
    | DataType.Point
    | DataType.MultiPoint
    | DataType.Line
    | DataType.MultiLine
    | DataType.Polygon
    | DataType.MultiPolygon
  > {
    if (
      !testFieldImpl(
        this.fieldObj,
        DataType.Point,
        DataType.MultiPoint,
        DataType.Line,
        DataType.MultiLine,
        DataType.Polygon,
        DataType.MultiPolygon,
      )
    ) {
      throw new Error(
        "Can only use EXTENT on Point/MultiPoint/Line/MultiLine/Polygon/MultiPolygon fields",
      );
    }
    this.extraField = null;
    this.func = SelectFunction.Extent;
    return this;
  }
}

function Select(): SelectObject<DataType._Unknown>;
function Select<T extends string>(field: T): SelectObject<DataType._Unknown>;
function Select<T extends FieldImpl>(field: T): SelectObject<T["type"]>;
function Select<T extends DataType>(field: Field<T>): SelectObject<T>;
function Select(field?: string | FieldImpl): SelectObject<DataType._Unknown> {
  return new SelectObject(field);
}
export { Select };
