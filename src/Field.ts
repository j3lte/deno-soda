import { DataType } from "./types.ts";
import type { Field, FieldImpl } from "./types.ts";

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
