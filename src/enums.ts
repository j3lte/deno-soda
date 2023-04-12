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
