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

export type Field<T> = {
  name: string;
  type: T;
};

// export type FieldImpl = Field<DataType>;
export type FieldImpl =
  | Field<DataType.Checkbox>
  | Field<DataType.FixedTimestamp>
  | Field<DataType.FloatingTimestamp>
  | Field<DataType.Line>
  | Field<DataType.Location>
  | Field<DataType.MultiLine>
  | Field<DataType.MultiPoint>
  | Field<DataType.MultiPolygon>
  | Field<DataType.Number>
  | Field<DataType.Point>
  | Field<DataType.Polygon>
  | Field<DataType.Text>
  | Field<DataType.URL>
  | Field<DataType.RowIdentifier>
  | Field<DataType._Unknown>;

export const testFieldImpl = (field: FieldImpl | null, ...types: DataType[]): boolean =>
  field === null || types.includes(field.type);

export const getFieldName = (field: string | FieldImpl): string => {
  return typeof field === "string" ? field : field.name;
};

export const SystemFields: {
  Id: Field<DataType.RowIdentifier>;
  CreatedAt: Field<DataType.FixedTimestamp>;
  UpdatedAt: Field<DataType.FixedTimestamp>;
} = {
  /** System field: **:id**, Only works in 2.1 */
  Id: {
    name: ":id",
    type: DataType.RowIdentifier,
  },
  /** System field: **:created_at**, Only works in 2.1 */
  CreatedAt: {
    name: ":created_at",
    type: DataType.FixedTimestamp,
  },
  /** System field: **:updated_at**, Only works in 2.1 */
  UpdatedAt: {
    name: ":updated_at",
    type: DataType.FixedTimestamp,
  },
};
