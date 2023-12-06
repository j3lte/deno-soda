import { FieldObject } from "./Field.ts";
/**
 * The different types of data that can be used in a field
 */
export enum DataType {
  /** Type: **Checkbox**, available in 2.0 and 2.1 */
  Checkbox = "checkbox",
  /** Type: **Fixed Timestamp**, available in 2.0 and 2.1 */
  FixedTimestamp = "fixed_timestamp",
  /** Type: **Floating Timestamp**, available in 2.0 and 2.1 */
  FloatingTimestamp = "floating_timestamp",
  /** Type: **Line**, available in 2.1 */
  Line = "line",
  /** Type: **Location**, available in 2.0 and 2.1 */
  Location = "location",
  /** Type: **MultiLine**, available in 2.1 */
  MultiLine = "multiline",
  /** Type: **MultiPoint**, available in 2.1 */
  MultiPoint = "multipoint",
  /** Type: **MultiPolygon**, available in 2.1 */
  MultiPolygon = "multipolygon",
  /** Type: **Number**, available in 2.0 and 2.1 */
  Number = "number",
  /** Type: **Point**, available in 2.1 */
  Point = "point",
  /** Type: **Polygon**, available in 2.1 */
  Polygon = "polygon",
  /** Type: **Text**, available in 2.0 and 2.1 */
  Text = "text",
  /** Type: **URL**, available in 2.0 and 2.1 */
  URL = "url",
  /** Type: **ROW Identifier**, special tag that is only used when retrieving IDs. Don't use */
  RowIdentifier = "row_identifier",
  /** Type: **Unknown** */
  _Unknown = "_unknown",
}

export type FieldImpl = FieldObject<DataType>;

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

export type QueryObj = Record<string, string | number | boolean>;
export type DataResponse<T> = Promise<{ error: Error | null; status: number; data: T }>;
