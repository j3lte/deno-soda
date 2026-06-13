import { DataType, type FieldImpl } from "./types.ts";

export const testFieldImpl = (field: FieldImpl | null, ...types: DataType[]): boolean =>
  field === null || field?.type === DataType._Unknown || types.includes(field.type);

export const getFieldName = (field: string | FieldImpl): string => {
  return typeof field === "string" ? field : field.name;
};
/**
 * A named field with an associated {@link DataType}, used for type-safe queries.
 *
 * @example
 * ```ts
 * const borough = new FieldObject("borough", DataType.Text);
 * Where.eq(borough, "MANHATTAN"); // borough = 'MANHATTAN'
 * ```
 */
export class FieldObject<T extends DataType> {
  /** The field (column) name. */
  readonly name: string;
  /** The field's {@link DataType}. */
  readonly type: T;

  constructor(name: string, type: T) {
    this.name = name;
    this.type = type;
  }

  /** Render the field as its name. */
  toString(): string {
    return this.name;
  }
}

/**
 * Create a {@link FieldObject}. Without a type it defaults to
 * `DataType._Unknown` (no type checking); pass a {@link DataType} for type-safe
 * use in `select`, `where` and `groupBy`.
 *
 * @param name The field (column) name
 * @param type Optional {@link DataType} of the field
 *
 * @example
 * ```ts
 * Field("borough"); // untyped field
 * Field("score", DataType.Number); // typed Number field
 * ```
 */
function Field(name: string): FieldObject<DataType._Unknown>;
function Field<T extends DataType>(name: string, type: T): FieldObject<T>;
function Field<T extends DataType>(name: string, type?: T): FieldObject<T | DataType._Unknown> {
  return new FieldObject(name, type ?? DataType._Unknown);
}

export { Field };

/**
 * Socrata system fields (`:id`, `:created_at`, `:updated_at`). Only work on the 2.1 endpoint.
 *
 * @example
 * ```ts
 * query.select(SystemFields.Id, SystemFields.CreatedAt).orderBy(Order.by(SystemFields.Id.name).asc);
 * ```
 */
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
