import { DataType } from "./enums.ts";

export type Field<T> = {
  name: string;
  type: T;
};

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

export type QueryObj = Record<string, string | number | boolean>;
export type DataResponse<T> = Promise<{ error: Error | null; status: number; data: T }>;
