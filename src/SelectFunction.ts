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
