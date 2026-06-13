import type { FieldImpl } from "./types.ts";
import { testFieldImpl } from "./Field.ts";
import { DataType } from "./types.ts";

/**
 * SoQL functions that can be applied to a {@link SelectImpl} field.
 *
 * The string value of each member is the function name as understood by the
 * Socrata Open Data API.
 *
 * Docs: https://dev.socrata.com/docs/functions/
 */
export enum SelectFunction {
  /** Absolute value of a number. */
  Abs = "abs",
  /** Average of a set of numbers. */
  Avg = "avg",
  /** Bounding box that encloses a set of geometries. */
  Extent = "extent",
  /** Plain field, i.e. no function applied. */
  Field = "field",
  /** Count of rows. */
  Count = "count",
  /** Smallest convex geometry enclosing a geometry's points. */
  ConvexHull = "convex_hull",
  /** Extract the day of the month from a floating timestamp. */
  DateExtractDayOfDate = "date_extract_d",
  /** Extract the day of the week (0-6) from a floating timestamp. */
  DateExtractDayOfWeek = "date_extract_dow",
  /** Extract the hour of the day (0-23) from a floating timestamp. */
  DateExtractHourOfDay = "date_extract_hh",
  /** Extract the month from a floating timestamp. */
  DateExtractMonth = "date_extract_m",
  /** Extract the minute from a floating timestamp. */
  DateExtractMinute = "date_extract_mm",
  /** Extract the second from a floating timestamp. */
  DateExtractSeconds = "date_extract_ss",
  /** Extract the week of the year (0-51) from a floating timestamp. */
  DateExtractWeekOfYear = "date_extract_woy",
  /** Extract the year from a floating timestamp. */
  DateExtractYear = "date_extract_y",
  /** Truncate a floating timestamp at the year. */
  DateTruncYear = "date_trunc_y",
  /** Truncate a floating timestamp at the year/month. */
  DateTruncYearMonth = "date_trunc_ym",
  /** Truncate a floating timestamp at the year/month/day. */
  DateTruncYearMonthDay = "date_trunc_ymd",
  /** Distance in meters between two points. */
  DistanceInMeter = "distance_in_meters",
  /** Distinct set of values. */
  Distinct = "distinct",
  /** Largest value among the arguments, ignoring NULLs. */
  Greatest = "greatest",
  /** Smallest value among the arguments, ignoring NULLs. */
  Least = "least",
  /** Length of a text value. */
  Length = "length",
  /** Natural logarithm of a number. */
  Log = "ln",
  /** Lower-cased text. */
  LowerCase = "lower",
  /** Maximum value. */
  Max = "max",
  /** Minimum value. */
  Min = "min",
  /** Number of vertices in a geospatial record. */
  NumberOfVertices = "num_points",
  /** Left-pad a text value. */
  PadLeft = "pad_left",
  /** Right-pad a text value. */
  PadRight = "pad_right",
  /** Y-intercept of the linear least squares fit. */
  RegrIntercept = "regr_intercept",
  /** Square of the correlation coefficient (r²). */
  RegrR2 = "regr_r2",
  /** Slope of the linear least squares fit. */
  RegrSlope = "regr_slope",
  /** Reduce the number of vertices in a line or polygon. */
  Simplify = "simplify",
  /** Simplify a geometry while preserving topology. */
  SimplifyPreserveTopology = "simplify_preserve_topology",
  /** Population standard deviation. */
  StandardDeviationPopulation = "stddev_pop",
  /** Sample standard deviation. */
  StandardDeviationSampled = "stddev_samp",
  /** Sum of a set of numbers. */
  Sum = "sum",
  /** Upper-cased text. */
  UpperCase = "upper",
  /** Remove accents (diacritics) from text. */
  Unaccent = "unaccent",
  /** Whether a location falls within a bounding box. */
  WithinBox = "within_box",
  /** Whether a location falls within a circle. */
  WithinCircle = "within_circle",
  /** Whether a location falls within a polygon. */
  WithinPolygon = "within_polygon",
}

/**
 * SelectImpl is used to build a select query
 *
 * Note: This is an internal class and should not be used directly
 */
export class SelectImpl<T = DataType> {
  private fieldObj: FieldImpl | null = null;
  private field: string | null = null;

  private asField: string | null = null;
  private extraField: string | null = null;
  private func: SelectFunction = SelectFunction.Field;
  private rawExpr: string | null = null;

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

  /**
   * Build a raw `case(...)` select from already-rendered argument strings.
   *
   * @param args The flattened condition/value argument strings
   */
  static case(args: string[]): SelectImpl {
    const impl = new SelectImpl("case");
    impl.rawExpr = `case(${args.join(", ")})`;
    return impl;
  }

  /** The name of the underlying field. */
  get fieldName(): string {
    // this.field is only null when fieldObj is not null
    return this.field ?? this.fieldObj!.name;
  }

  /** The select expression as a SoQL string (alias for {@link toString}). */
  get value(): string {
    return this.toString();
  }

  /**
   * Set the SoQL function (and optional extra argument) to apply to the field.
   *
   * @param func The function to apply
   * @param extraField Optional extra argument passed to the function
   */
  setFunc(func: SelectFunction, extraField?: string): SelectImpl<T> {
    this.func = func;
    this.extraField = extraField ?? null;
    return this;
  }

  /** Render the select as a SoQL expression string. */
  toString(): string {
    if (this.rawExpr !== null) {
      return this.asField ? `${this.rawExpr} as ${this.asField}` : this.rawExpr;
    }
    const fieldName = this.fieldName;
    const field = this.func === SelectFunction.Field
      ? fieldName
      : `${this.func}(${fieldName}${this.extraField !== null ? `, ${this.extraField}` : ""})`;
    return this.asField ? `${field} as ${this.asField}` : field;
  }

  /**
   * Alias the selected field (`field AS alias`).
   *
   * @param as The alias to use
   * @throws If used on `*` (all fields)
   */
  as(as: string): SelectImpl<T> {
    if (this.fieldName === "*") {
      throw new Error("Cannot use AS on * (all fields)");
    }
    this.asField = as;
    return this;
  }

  /**
   * Works on fields of type Number
   */
  abs(): SelectImpl<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error("Can only use ABS on Number fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Abs;
    return this;
  }

  /**
   * Natural logarithm.
   *
   * Works on fields of type Number
   *
   * Docs: https://dev.socrata.com/docs/functions/ln
   */
  log(): SelectImpl<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error("Can only use LN on Number fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Log;
    return this;
  }

  /**
   * Works on fields of type Number
   *
   * Docs: https://dev.socrata.com/docs/functions/avg.html
   */
  avg(): SelectImpl<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error("Can only use AVG on Number fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Avg;
    return this;
  }

  /**
   * Works on fields of type Number
   *
   * Docs: https://dev.socrata.com/docs/functions/sum.html
   */
  sum(): SelectImpl<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error("Can only use SUM on Number fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Sum;
    return this;
  }

  /**
   * Works like SELECT COUNT(*)
   *
   * Docs: https://dev.socrata.com/docs/functions/count.html
   */
  count(): SelectImpl<T> {
    this.extraField = null;
    this.func = SelectFunction.Count;
    return this;
  }

  /**
   * Returns distinct set of records
   *
   * Docs: https://dev.socrata.com/docs/functions/distinct.html
   */
  distinct(): SelectImpl<T> {
    this.extraField = null;
    this.func = SelectFunction.Distinct;
    return this;
  }

  /**
   * Returns the maximum of a given set of numbers
   *
   * Works on fields of type Number/Text/FloatingTimestamp/FixedTimestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/max.html
   */
  max(): SelectImpl<
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
   * Docs: https://dev.socrata.com/docs/functions/min.html
   */
  min(): SelectImpl<
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
   * Docs: https://dev.socrata.com/docs/functions/convex_hull.html
   */
  convexHull(): SelectImpl<
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
  ): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_extract_d.html
   */
  dateExtractDayOfDate(): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_extract_dow.html
   */
  dateExtractDayOfWeek(): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_extract_hh.html
   */
  dateExtractHourOfDay(): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_extract_m.html
   */
  dateExtractMonth(): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_extract_mm.html
   */
  dateExtractMinute(): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_extract_ss.html
   */
  dateExtractSeconds(): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_extract_woy.html
   */
  dateExtractWeekOfYear(): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_extract_y.html
   */
  dateExtractYear(): SelectImpl<DataType.FloatingTimestamp> {
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
   * Docs: https://dev.socrata.com/docs/functions/date_trunc_y.html
   */
  dateTruncYear(): SelectImpl<DataType.FloatingTimestamp> {
    return this.dateExtract("DATE_TRUNC_Y", SelectFunction.DateTruncYear);
  }

  /**
   * Truncates a calendar date at the year/month threshold
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_trunc_ym.html
   */
  dateTruncYearMonth(): SelectImpl<DataType.FloatingTimestamp> {
    return this.dateExtract("DATE_TRUNC_YM", SelectFunction.DateTruncYearMonth);
  }

  /**
   * Truncates a calendar date at the year/month/date threshold
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_trunc_ymd.html
   */
  dateTruncYearMonthDay(): SelectImpl<DataType.FloatingTimestamp> {
    return this.dateExtract(
      "DATE_TRUNC_YMD",
      SelectFunction.DateTruncYearMonthDay,
    );
  }

  /**
   * Works on fields of type Point
   *
   * Docs: https://dev.socrata.com/docs/functions/distance_in_meters.html
   */
  distanceInMeters(lat: number, lon: number): SelectImpl<DataType.Point> {
    if (!testFieldImpl(this.fieldObj, DataType.Point)) {
      throw new Error("Can only use DISTANCE_IN_METERS on Point fields");
    }
    this.extraField = `'POINT (${lon} ${lat})'`;
    this.func = SelectFunction.DistanceInMeter;
    return this;
  }

  /**
   * Works on fields of type Text
   */
  lowerCase(): SelectImpl<DataType.Text> {
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
  upperCase(): SelectImpl<DataType.Text> {
    if (!testFieldImpl(this.fieldObj, DataType.Text)) {
      throw new Error("Can only use UPPER_CASE on Text fields");
    }
    this.extraField = null;
    this.func = SelectFunction.UpperCase;
    return this;
  }

  /**
   * Remove accents (diacritical marks) from text.
   *
   * Works on fields of type Text
   *
   * Docs: https://dev.socrata.com/docs/functions/unaccent
   */
  unaccent(): SelectImpl<DataType.Text> {
    if (!testFieldImpl(this.fieldObj, DataType.Text)) {
      throw new Error("Can only use UNACCENT on Text fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Unaccent;
    return this;
  }

  /**
   * Works on fields of type Text
   */
  length(): SelectImpl<DataType.Text> {
    if (!testFieldImpl(this.fieldObj, DataType.Text)) {
      throw new Error("Can only use LENGTH on Text fields");
    }
    this.extraField = null;
    this.func = SelectFunction.Length;
    return this;
  }

  /**
   * Pad a text field to a given length with a pad string.
   *
   * Works on fields of type Text
   *
   * @param length Target length
   * @param pad The string to pad with
   * @param type Pad on the `LEFT` or `RIGHT`
   */
  pad(length: number, pad: string, type: "LEFT" | "RIGHT"): SelectImpl<DataType.Text> {
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

  /**
   * Sample standard deviation.
   *
   * Works on fields of type Number
   */
  standardDeviationSample(): SelectImpl<DataType.Number> {
    if (!testFieldImpl(this.fieldObj, DataType.Number)) {
      throw new Error(
        "Can only use STANDARD_DEVIATION_SAMPLE on Number fields",
      );
    }
    this.extraField = null;
    this.func = SelectFunction.StandardDeviationSampled;
    return this;
  }

  /**
   * Population standard deviation.
   *
   * Works on fields of type Number
   */
  standardDeviationPopulation(): SelectImpl<DataType.Number> {
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
   * Docs: https://dev.socrata.com/docs/functions/num_points.html
   */
  numberOfVertices(): SelectImpl<
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
   * Docs: https://dev.socrata.com/docs/functions/simplify.html
   */
  simplify(tolerance: number): SelectImpl<
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
   * Docs: https://dev.socrata.com/docs/functions/simplify_preserve_topology.html
   */
  simplifyPreserveTopology(tolerance: number): SelectImpl<
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
   * Docs: https://dev.socrata.com/docs/functions/extent.html
   */
  extent(): SelectImpl<
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
