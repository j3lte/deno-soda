import type { FieldImpl } from "./types.ts";
import { testFieldImpl } from "./Field.ts";
import { DataType } from "./types.ts";

import { SelectFunction } from "./SelectFunction.ts";
export { SelectFunction } from "./SelectFunction.ts";

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
   *
   * @example
   * ```ts
   * Select("incident_zip").as("zip"); // incident_zip as zip
   * ```
   */
  as(as: string): SelectImpl<T> {
    if (this.fieldName === "*") {
      throw new Error("Cannot use AS on * (all fields)");
    }
    this.asField = as;
    return this;
  }

  private setFn(
    func: SelectFunction,
    errorMessage: string,
    ...types: DataType[]
  ): this {
    if (types.length > 0 && !testFieldImpl(this.fieldObj, ...types)) {
      throw new Error(errorMessage);
    }
    this.extraField = null;
    this.func = func;
    return this;
  }

  /**
   * Absolute value. Works on fields of type Number.
   *
   * Note: not listed in the Socrata docs, but works on 2.1 endpoints.
   *
   * @example
   * ```ts
   * Select(Field("delta", DataType.Number)).abs().as("abs_delta"); // abs(delta) as abs_delta
   * ```
   */
  abs(): SelectImpl<DataType.Number> {
    return this.setFn(SelectFunction.Abs, "Can only use ABS on Number fields", DataType.Number);
  }

  /**
   * Natural logarithm.
   *
   * Works on fields of type Number
   *
   * Docs: https://dev.socrata.com/docs/functions/ln
   *
   * @example
   * ```ts
   * Select(Field("value", DataType.Number)).log().as("ln_value"); // ln(value) as ln_value
   * ```
   */
  log(): SelectImpl<DataType.Number> {
    return this.setFn(SelectFunction.Log, "Can only use LN on Number fields", DataType.Number);
  }

  /**
   * Works on fields of type Number
   *
   * Docs: https://dev.socrata.com/docs/functions/avg.html
   *
   * @example
   * ```ts
   * Select(Field("score", DataType.Number)).avg().as("avg_score"); // avg(score) as avg_score
   * ```
   */
  avg(): SelectImpl<DataType.Number> {
    return this.setFn(SelectFunction.Avg, "Can only use AVG on Number fields", DataType.Number);
  }

  /**
   * Works on fields of type Number
   *
   * Docs: https://dev.socrata.com/docs/functions/sum.html
   *
   * @example
   * ```ts
   * Select(Field("amount", DataType.Number)).sum().as("total_amount"); // sum(amount) as total_amount
   * ```
   */
  sum(): SelectImpl<DataType.Number> {
    return this.setFn(SelectFunction.Sum, "Can only use SUM on Number fields", DataType.Number);
  }

  /**
   * Works like SELECT COUNT(*)
   *
   * Docs: https://dev.socrata.com/docs/functions/count.html
   *
   * @example
   * ```ts
   * Select("*").count().as("total"); // count(*) as total
   * ```
   */
  count(): SelectImpl<T> {
    return this.setFn(SelectFunction.Count, "");
  }

  /**
   * Returns distinct set of records
   *
   * Docs: https://dev.socrata.com/docs/functions/distinct.html
   *
   * @example
   * ```ts
   * Select("borough").distinct(); // distinct(borough)
   * ```
   */
  distinct(): SelectImpl<T> {
    return this.setFn(SelectFunction.Distinct, "");
  }

  /**
   * Returns the maximum of a given set of numbers
   *
   * Works on fields of type Number/Text/FloatingTimestamp/FixedTimestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/max.html
   *
   * @example
   * ```ts
   * Select(Field("score", DataType.Number)).max().as("max_score"); // max(score) as max_score
   * ```
   */
  max(): SelectImpl<
    | DataType.Number
    | DataType.Text
    | DataType.FloatingTimestamp
    | DataType.FixedTimestamp
  > {
    return this.setFn(
      SelectFunction.Max,
      "Can only use MAX on Number/Text/FloatingTimestamp/FixedTimestamp fields",
      DataType.Number,
      DataType.Text,
      DataType.FloatingTimestamp,
      DataType.FixedTimestamp,
    );
  }

  /**
   * Returns the minimum of a given set of numbers
   *
   * Works on fields of type Number/Text/FloatingTimestamp/FixedTimestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/min.html
   *
   * @example
   * ```ts
   * Select(Field("score", DataType.Number)).min().as("min_score"); // min(score) as min_score
   * ```
   */
  min(): SelectImpl<
    | DataType.Number
    | DataType.Text
    | DataType.FloatingTimestamp
    | DataType.FixedTimestamp
  > {
    return this.setFn(
      SelectFunction.Min,
      "Can only use MIN on Number/Text/FloatingTimestamp/FixedTimestamp fields",
      DataType.Number,
      DataType.Text,
      DataType.FloatingTimestamp,
      DataType.FixedTimestamp,
    );
  }

  /**
   * Works on fields of type Point/MultiPoint/Line/MultiLine/Polygon/MultiPolygon
   *
   * Returns the minimum convex geometry that encloses all of another geometry's points.
   *
   * Docs: https://dev.socrata.com/docs/functions/convex_hull.html
   *
   * @example
   * ```ts
   * Select(Field("the_geom", DataType.Point)).convexHull().as("hull"); // convex_hull(the_geom) as hull
   * ```
   */
  convexHull(): SelectImpl<
    | DataType.Point
    | DataType.MultiPoint
    | DataType.Line
    | DataType.MultiLine
    | DataType.Polygon
    | DataType.MultiPolygon
  > {
    return this.setFn(
      SelectFunction.ConvexHull,
      "Can only use CONVEX_HULL on Point/MultiPoint/Line/MultiLine/Polygon/MultiPolygon fields",
      DataType.Point,
      DataType.MultiPoint,
      DataType.Line,
      DataType.MultiLine,
      DataType.Polygon,
      DataType.MultiPolygon,
    );
  }

  /**
   * Extracts the day from the date as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_extract_d.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateExtractDayOfDate().as("day");
   * // date_extract_d(created_date) as day
   * ```
   */
  dateExtractDayOfDate(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateExtractDayOfDate,
      "Can only use DATE_EXTRACT_DAY_OF_DATE on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Extracts the day of the week as an integer between 0 and 6 (inclusive).
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_extract_dow.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateExtractDayOfWeek().as("dow");
   * // date_extract_dow(created_date) as dow
   * ```
   */
  dateExtractDayOfWeek(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateExtractDayOfWeek,
      "Can only use DATE_EXTRACT_DAY_OF_WEEK on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Extracts the hour of the day as an integer between 0 and 23 (inclusive).
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_extract_hh.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateExtractHourOfDay().as("hour");
   * // date_extract_hh(created_date) as hour
   * ```
   */
  dateExtractHourOfDay(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateExtractHourOfDay,
      "Can only use DATE_EXTRACT_HOUR_OF_DAY on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Extracts the month as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_extract_m.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateExtractMonth().as("month");
   * // date_extract_m(created_date) as month
   * ```
   */
  dateExtractMonth(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateExtractMonth,
      "Can only use DATE_EXTRACT_MONTH on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Extracts the minute from the time as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_extract_mm.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateExtractMinute().as("minute");
   * // date_extract_mm(created_date) as minute
   * ```
   */
  dateExtractMinute(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateExtractMinute,
      "Can only use DATE_EXTRACT_MINUTE on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Extracts the second from the time as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_extract_ss.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateExtractSeconds().as("second");
   * // date_extract_ss(created_date) as second
   * ```
   */
  dateExtractSeconds(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateExtractSeconds,
      "Can only use DATE_EXTRACT_SECOND on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Extracts the week of the year as an integer between 0 and 51 (inclusive).
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_extract_woy.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateExtractWeekOfYear().as("week");
   * // date_extract_woy(created_date) as week
   * ```
   */
  dateExtractWeekOfYear(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateExtractWeekOfYear,
      "Can only use DATE_EXTRACT_WEEK_OF_YEAR on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Extracts the year as an integer.
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_extract_y.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateExtractYear().as("year");
   * // date_extract_y(created_date) as year
   * ```
   */
  dateExtractYear(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateExtractYear,
      "Can only use DATE_EXTRACT_YEAR on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Truncates a calendar date at the year threshold
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_trunc_y.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateTruncYear().as("year");
   * // date_trunc_y(created_date) as year
   * ```
   */
  dateTruncYear(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateTruncYear,
      "Can only use DATE_TRUNC_Y on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Truncates a calendar date at the year/month threshold
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_trunc_ym.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateTruncYearMonth().as("month");
   * // date_trunc_ym(created_date) as month
   * ```
   */
  dateTruncYearMonth(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateTruncYearMonth,
      "Can only use DATE_TRUNC_YM on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Truncates a calendar date at the year/month/date threshold
   *
   * Works on fields of type Floating Timestamp
   *
   * Docs: https://dev.socrata.com/docs/functions/date_trunc_ymd.html
   *
   * @example
   * ```ts
   * Select(Field("created_date", DataType.FloatingTimestamp)).dateTruncYearMonthDay().as("day");
   * // date_trunc_ymd(created_date) as day
   * ```
   */
  dateTruncYearMonthDay(): SelectImpl<DataType.FloatingTimestamp> {
    return this.setFn(
      SelectFunction.DateTruncYearMonthDay,
      "Can only use DATE_TRUNC_YMD on Floating Timestamp fields",
      DataType.FloatingTimestamp,
    );
  }

  /**
   * Works on fields of type Point
   *
   * Docs: https://dev.socrata.com/docs/functions/distance_in_meters.html
   *
   * @example
   * ```ts
   * Select(Field("the_geom", DataType.Point)).distanceInMeters(40.7128, -74.006).as("dist");
   * // distance_in_meters(the_geom, 'POINT (-74.006 40.7128)') as dist
   * ```
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
   *
   * @example
   * ```ts
   * Select(Field("borough", DataType.Text)).lowerCase().as("borough_lc"); // lower(borough) as borough_lc
   * ```
   */
  lowerCase(): SelectImpl<DataType.Text> {
    return this.setFn(
      SelectFunction.LowerCase,
      "Can only use LOWER_CASE on Text fields",
      DataType.Text,
    );
  }

  /**
   * Works on fields of type Text
   *
   * @example
   * ```ts
   * Select(Field("borough", DataType.Text)).upperCase().as("borough_uc"); // upper(borough) as borough_uc
   * ```
   */
  upperCase(): SelectImpl<DataType.Text> {
    return this.setFn(
      SelectFunction.UpperCase,
      "Can only use UPPER_CASE on Text fields",
      DataType.Text,
    );
  }

  /**
   * Remove accents (diacritical marks) from text.
   *
   * Works on fields of type Text
   *
   * Docs: https://dev.socrata.com/docs/functions/unaccent
   *
   * @example
   * ```ts
   * Select(Field("name", DataType.Text)).unaccent().as("name_clean"); // unaccent(name) as name_clean
   * ```
   */
  unaccent(): SelectImpl<DataType.Text> {
    return this.setFn(
      SelectFunction.Unaccent,
      "Can only use UNACCENT on Text fields",
      DataType.Text,
    );
  }

  /**
   * Length of the text. Works on fields of type Text.
   *
   * Note: not listed in the Socrata docs, but works on 2.1 endpoints.
   *
   * @example
   * ```ts
   * Select(Field("description", DataType.Text)).length().as("desc_len"); // length(description) as desc_len
   * ```
   */
  length(): SelectImpl<DataType.Text> {
    return this.setFn(
      SelectFunction.Length,
      "Can only use LENGTH on Text fields",
      DataType.Text,
    );
  }

  /**
   * Sample standard deviation.
   *
   * Works on fields of type Number
   *
   * @example
   * ```ts
   * Select(Field("score", DataType.Number)).standardDeviationSample().as("std_sample");
   * // stddev_samp(score) as std_sample
   * ```
   */
  standardDeviationSample(): SelectImpl<DataType.Number> {
    return this.setFn(
      SelectFunction.StandardDeviationSampled,
      "Can only use STANDARD_DEVIATION_SAMPLE on Number fields",
      DataType.Number,
    );
  }

  /**
   * Population standard deviation.
   *
   * Works on fields of type Number
   *
   * @example
   * ```ts
   * Select(Field("score", DataType.Number)).standardDeviationPopulation().as("std_pop");
   * // stddev_pop(score) as std_pop
   * ```
   */
  standardDeviationPopulation(): SelectImpl<DataType.Number> {
    return this.setFn(
      SelectFunction.StandardDeviationPopulation,
      "Can only use STANDARD_DEVIATION_POPULATION on Number fields",
      DataType.Number,
    );
  }

  /**
   * Returns the number of vertices in a geospatial data record
   *
   * Works on fields of type Polygon, Line, Point, MultiPoint, MultiLine, MultiPolygon
   *
   * Docs: https://dev.socrata.com/docs/functions/num_points.html
   *
   * @example
   * ```ts
   * Select(Field("the_geom", DataType.Polygon)).numberOfVertices().as("vertex_count");
   * // num_points(the_geom) as vertex_count
   * ```
   */
  numberOfVertices(): SelectImpl<
    | DataType.Polygon
    | DataType.Line
    | DataType.Point
    | DataType.MultiPoint
    | DataType.MultiLine
    | DataType.MultiPolygon
  > {
    return this.setFn(
      SelectFunction.NumberOfVertices,
      "Can only use NUM_POINTS on Polygon fields",
      DataType.Polygon,
      DataType.Line,
      DataType.Point,
      DataType.MultiPoint,
      DataType.MultiLine,
      DataType.MultiPolygon,
    );
  }

  /**
   * Reduces the number of vertices in a line or polygon
   *
   * @param tolerance The tolerance to use when simplifying the geometry, in meters
   *
   * Docs: https://dev.socrata.com/docs/functions/simplify.html
   *
   * @example
   * ```ts
   * Select(Field("the_geom", DataType.Polygon)).simplify(0.001).as("simplified");
   * // simplify(the_geom, 0.001) as simplified
   * ```
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
   *
   * @example
   * ```ts
   * Select(Field("the_geom", DataType.Point)).extent().as("bbox"); // extent(the_geom) as bbox
   * ```
   */
  extent(): SelectImpl<
    | DataType.Point
    | DataType.MultiPoint
    | DataType.Line
    | DataType.MultiLine
    | DataType.Polygon
    | DataType.MultiPolygon
  > {
    return this.setFn(
      SelectFunction.Extent,
      "Can only use EXTENT on Point/MultiPoint/Line/MultiLine/Polygon/MultiPolygon fields",
      DataType.Point,
      DataType.MultiPoint,
      DataType.Line,
      DataType.MultiLine,
      DataType.Polygon,
      DataType.MultiPolygon,
    );
  }
}
