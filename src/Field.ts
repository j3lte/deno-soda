import { DataType, FieldImpl } from "./types.ts";

export const testFieldImpl = (field: FieldImpl | null, ...types: DataType[]): boolean =>
  field === null || field?.type === DataType._Unknown || types.includes(field.type);

export const getFieldName = (field: string | FieldImpl): string => {
  return typeof field === "string" ? field : field.name;
};
export class FieldObject<T extends DataType> {
  readonly name: string;
  readonly type: T;

  constructor(name: string, type: T) {
    this.name = name;
    this.type = type;
  }

  toString(): string {
    return this.name;
  }
}

function Field(name: string): FieldObject<DataType._Unknown>;
function Field<T extends DataType>(name: string, type: T): FieldObject<T>;
function Field<T extends DataType>(name: string, type?: T): FieldObject<T | DataType._Unknown> {
  return new FieldObject(name, type ?? DataType._Unknown);
}

export { Field };

export const SystemFields: {
  Id: FieldObject<DataType.RowIdentifier>;
  CreatedAt: FieldObject<DataType.FixedTimestamp>;
  UpdatedAt: FieldObject<DataType.FixedTimestamp>;
} = {
  /** System field: **:id**, Only works in 2.1 */
  Id: Field(":id", DataType.RowIdentifier),
  /** System field: **:created_at**, Only works in 2.1 */
  CreatedAt: Field(":created_at", DataType.FixedTimestamp),
  /** System field: **:updated_at**, Only works in 2.1 */
  UpdatedAt: Field(":updated_at", DataType.FixedTimestamp),
};
