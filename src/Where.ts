// deno-lint-ignore-file no-explicit-any
// TODO: Replace `any` with proper types

// Copied and modified from https://github.com/manyuanrong/sql-builder/blob/master/where.ts
// Copyright (c) 2019 EnokMan
// MIT License

import { replaceParams, SupportTypeElement } from "./utils/param.ts";
import { DataType, Field, FieldImpl, getFieldName } from "./Field.ts";

type BasicType = Exclude<SupportTypeElement, null | undefined | boolean>;

export class Where {
  private expr: string;
  private params: SupportTypeElement[];

  constructor(expr: string, params: SupportTypeElement[]) {
    this.expr = expr;
    this.params = params;
  }

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return replaceParams(this.expr, this.params);
  }

  static expr(expr: string, ...params: SupportTypeElement[]): Where {
    return new Where(expr, params);
  }

  static eq(field: string | FieldImpl, value: any) {
    if (value === null) {
      return this.isNull(field);
    }
    return this.expr("?? = ?", getFieldName(field), value);
  }

  /**
   * eq from object
   * @param data
   */
  static from(data: Record<string, SupportTypeElement>): Where {
    const conditions = Object.keys(data).map((key) => this.eq(key, data[key]));
    return this.and(...conditions);
  }

  static gt(
    field: string | FieldImpl,
    value: BasicType,
  ) {
    return this.expr("?? > ?", getFieldName(field), value);
  }

  static gte(
    field: string | FieldImpl,
    value: BasicType,
  ) {
    return this.expr("?? >= ?", getFieldName(field), value);
  }

  static lt(
    field: string | FieldImpl,
    value: BasicType,
  ) {
    return this.expr("?? < ?", getFieldName(field), value);
  }

  static lte(
    field: string | FieldImpl,
    value: BasicType,
  ) {
    return this.expr("?? <= ?", getFieldName(field), value);
  }

  static ne(field: string | FieldImpl, value: SupportTypeElement) {
    if (value === null) {
      return this.isNotNull(field);
    }
    return this.expr("?? != ?", getFieldName(field), value);
  }

  static isNull(field: string | FieldImpl) {
    return this.expr("?? IS NULL", getFieldName(field));
  }

  static isNotNull(field: string | FieldImpl) {
    return this.expr("?? IS NOT NULL", getFieldName(field));
  }

  static in(field: string | FieldImpl, ...values: any[]) {
    const params = values.length > 1 ? values : values[0];
    return this.expr("?? in ?", getFieldName(field), params);
  }

  static notIn(field: string | FieldImpl, ...values: any[]) {
    const params: any[] = values.length > 1 ? values : values[0];
    return this.expr("?? not in ?", getFieldName(field), params as any);
  }

  static like(field: string | FieldImpl, value: any) {
    return this.expr("?? like ?", getFieldName(field), value);
  }

  static notLike(field: string | FieldImpl, value: any) {
    return this.expr("?? not like ?", getFieldName(field), value);
  }

  /**
   * Select records where the value of a field is between two values
   *
   * Works with the following datatypes:
   * - Number
   * - Floating timestamp
   * - Fixed timestamp
   * - Text
   *
   * This function works with 2.1 endpoint(s)
   *
   * @param field  field name or Field instance
   * @param startValue  start value
   * @param endValue end value
   */
  static between(
    field:
      | string
      | Field<DataType.Number>
      | Field<DataType.FloatingTimestamp>
      | Field<DataType.FixedTimestamp>
      | Field<DataType.Text>,
    startValue: any,
    endValue: any,
  ) {
    return this.expr(
      "?? between ? and ?",
      getFieldName(field),
      startValue,
      endValue,
    );
  }

  static notBetween(
    field:
      | string
      | Field<DataType.Number>
      | Field<DataType.FloatingTimestamp>
      | Field<DataType.FixedTimestamp>
      | Field<DataType.Text>,
    startValue: any,
    endValue: any,
  ) {
    return this.expr(
      "?? not between ? and ?",
      getFieldName(field),
      startValue,
      endValue,
    );
  }

  static field(name: string | FieldImpl) {
    const fName = getFieldName(name);
    return {
      gt: (value: BasicType) => this.gt(fName, value),
      gte: (value: BasicType) => this.gte(fName, value),
      lt: (value: BasicType) => this.lt(fName, value),
      lte: (value: BasicType) => this.lte(fName, value),
      ne: (value: SupportTypeElement) => this.ne(fName, value),
      eq: (value: SupportTypeElement) => this.eq(fName, value),
      isNull: () => this.isNull(fName),
      isNotNull: () => this.isNotNull(fName),
      in: (...values: any[]) => this.in(fName, ...values),
      notIn: (...values: any[]) => this.notIn(fName, ...values),
      like: (value: any) => this.like(fName, value),
      notLike: (value: any) => this.notLike(fName, value),
      between: (start: any, end: any) => this.between(fName, start, end),
      notBetween: (start: any, end: any) => this.notBetween(fName, start, end),
      withinBox: (latNW: number, lonNW: number, latSE: number, lonSE: number) =>
        this.withinBox(fName, latNW, lonNW, latSE, lonSE),
      withinCircle: (lat: number, lon: number, radius: number) =>
        this.withinCircle(fName, lat, lon, radius),
      startsWith: (value: string) => this.startsWith(fName, value),
      intersects: (value: string) => this.intersects(fName, value),
    };
  }

  static and(...expr: (null | undefined | Where)[]): Where {
    const sql = `(${
      expr
        .filter((e) => e)
        .map((e) => e!.value)
        .join(" AND ")
    })`;
    return new Where(sql, []);
  }

  static or(...expr: (null | undefined | Where)[]): Where {
    const sql = `(${
      expr
        .filter((e) => e)
        .map((e) => e!.value)
        .join(" OR ")
    })`;
    return new Where(sql, []);
  }

  // Specific methods

  /**
   * This function is used on fields of type `Location` to find records within a given box. This takes the form of a rectangle, with the northwest corner and southeast corner specified by latitude and longitude.
   * @param field The field to search
   * @param latNW The latitude of the northwest corner of the box
   * @param lonNW The longitude of the northwest corner of the box
   * @param latSE The latitude of the southeast corner of the box
   * @param lonSE The longitude of the southeast corner of the box
   */
  static withinBox(
    field: string | Field<DataType.Location>,
    latNW: number,
    lonNW: number,
    latSE: number,
    lonSE: number,
  ) {
    return this.expr(
      "within_box(??, ?, ?, ?, ?)",
      getFieldName(field),
      latNW,
      lonNW,
      latSE,
      lonSE,
    );
  }

  /**
   * This function is used on fields of type `Location` to find records within a given circle
   * @param field The field to search
   * @param lat The latitude of the center of the circle
   * @param lon The longitude of the center of the circle
   * @param radius The radius of the circle in meters
   */
  static withinCircle(
    field: string | Field<DataType.Location>,
    lat: number,
    lon: number,
    radius: number,
  ) {
    return this.expr(
      "within_circle(??, ?, ?, ?)",
      getFieldName(field),
      lat,
      lon,
      radius,
    );
  }

  /**
   * This function is used on fields of type `Text` to find records that start with a given string
   * @param field The field to search
   * @param value The value to search for
   */
  static startsWith(field: string | Field<DataType.Text>, value: string) {
    return this.expr("starts_with(??, ?)", getFieldName(field), value);
  }

  /**
   * Allows you to compare two geospatial types to see if they intersect or overlap each other
   *
   * _Note: This function is only available on the 2.1 endpoint_
   *
   * @url https://dev.socrata.com/docs/functions/intersects.html
   *
   * @param field The field to search
   * @param value The value to search for. This should be of format 'POINT (...)' or 'POLYGON (...)'. See the link above for more details
   */
  static intersects(
    field:
      | string
      | Field<DataType.Point>
      | Field<DataType.Polygon>
      | Field<DataType.Line>
      | Field<DataType.MultiPoint>
      | Field<DataType.MultiLine>
      | Field<DataType.MultiPolygon>,
    value: string,
  ) {
    return this.expr("intersects(??, ?)", getFieldName(field), value);
  }
}
