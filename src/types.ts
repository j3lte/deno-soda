import type { FieldObject } from "./Field.ts";
/**
 * The Socrata data types a field can have.
 *
 * Docs: https://dev.socrata.com/docs/datatypes/
 */
export enum DataType {
  /**
   * A boolean `true` / `false` value.
   *
   * Available in 2.0, 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/checkbox
   */
  Checkbox = "checkbox",
  /**
   * An absolute instant in time (date + time, in UTC).
   *
   * Available in 2.0, 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/fixed_timestamp
   */
  FixedTimestamp = "fixed_timestamp",
  /**
   * A date and time with no timezone (wall-clock).
   *
   * Available in 2.0, 2.1.
   *
   * @see https://dev.socrata.com/docs/datatypes/floating_timestamp
   */
  FloatingTimestamp = "floating_timestamp",
  /**
   * A geospatial line: an ordered series of connected points (WKT `LINESTRING`).
   *
   * Available in 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/line
   */
  Line = "line",
  /**
   * A legacy geo type holding latitude/longitude and an optional address.
   * Superseded by {@link Point}.
   *
   * Available in 2.0, 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/location
   */
  Location = "location",
  /**
   * A collection of lines (WKT `MULTILINESTRING`).
   *
   * Available in 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/multiline
   */
  MultiLine = "multiline",
  /**
   * A collection of points (WKT `MULTIPOINT`).
   *
   * Available in 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/multipoint
   */
  MultiPoint = "multipoint",
  /**
   * A collection of polygons (WKT `MULTIPOLYGON`).
   *
   * Available in 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/multipolygon
   */
  MultiPolygon = "multipolygon",
  /**
   * A numeric value (integer or decimal).
   *
   * Available in 2.0, 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/number
   */
  Number = "number",
  /**
   * A single geospatial coordinate, longitude/latitude (WKT `POINT`).
   *
   * Available in 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/point
   */
  Point = "point",
  /**
   * A geospatial area enclosed by a ring of points (WKT `POLYGON`).
   *
   * Available in 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/polygon
   */
  Polygon = "polygon",
  /**
   * A free-form string value.
   *
   * Available in 2.0, 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/text
   */
  Text = "text",
  /**
   * A hyperlink, with an optional description.
   *
   * Available in 2.0, 2.1, 3.0.
   *
   * @see https://dev.socrata.com/docs/datatypes/url
   */
  URL = "url",
  /** **Row Identifier** — internal tag used only when retrieving `:id`. Don't use directly. */
  RowIdentifier = "row_identifier",
  /** **Unknown** — internal default; disables type checking on a field. */
  _Unknown = "_unknown",
}

/** A {@link FieldObject} of any {@link DataType}. */
export type FieldImpl = FieldObject<DataType>;

/** Options for a {@link SodaQuery}. */
export interface Options {
  /** Strict mode. If enabled, this prevents the Query from changing the dataset ID after it has been set once */
  strict?: boolean;
}

export interface RequesOpts {
  method?: string;
  signal?: AbortSignal;
}

export interface ExtraDataFields {
  /** System field */
  ":id"?: string;
  /** System field */
  ":created_at"?: string;
  /** System field */
  ":updated_at"?: string;
}

/** Authentication options for a {@link SodaQuery} (app token, Basic auth or OAuth). */
export interface AuthOpts {
  /**
   * API token
   *
   * The Socrata Open Data API uses application tokens for two purposes:
   * Using an application token allows us to throttle by application, rather than via IP address, which gives you a higher throttling limit
   * Authentication using OAuth
   *
   * Docs: https://dev.socrata.com/docs/app-tokens.html
   */
  apiToken?: string;
  /**
   * Username (needs password) for Basic HTTP Auth
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#authenticating-using-http-basic-authentication
   */
  username?: string;
  /**
   * Password (needs username) for Basic HTTP Auth
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#authenticating-using-http-basic-authentication
   */
  password?: string;
  /**
   * OAuth Access Token
   *
   * Docs: https://dev.socrata.com/docs/authentication.html#using-an-oauth-20-access-token
   */
  accessToken?: string;
}

// export type Field<T> = {
//   name: string;
//   type: T;
// };

// export type FieldImpl =
//   | Field<DataType.Checkbox>
//   | Field<DataType.FixedTimestamp>
//   | Field<DataType.FloatingTimestamp>
//   | Field<DataType.Line>
//   | Field<DataType.Location>
//   | Field<DataType.MultiLine>
//   | Field<DataType.MultiPoint>
//   | Field<DataType.MultiPolygon>
//   | Field<DataType.Number>
//   | Field<DataType.Point>
//   | Field<DataType.Polygon>
//   | Field<DataType.Text>
//   | Field<DataType.URL>
//   | Field<DataType.RowIdentifier>
//   | Field<DataType._Unknown>;

/** A serialized query as a map of SoQL parameter names to values. */
export type QueryObj = Record<string, string | number | boolean>;

/** The resolved result of a request: an `error`, HTTP `status` and `data`. */
export type DataResponse<T> = Promise<{ error: Error | null; status: number; data: T }>;
