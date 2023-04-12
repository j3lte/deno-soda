import { Where } from "../Where.ts";

const isNumber = (obj: string) => !isNaN(parseFloat(obj));

// TODO: might be wrong, could only be used for string literals, thus adding '' when string
export const handleLiteral = (
  literal: string | number,
) => (typeof literal === "string"
  ? `'${literal}'`
  : (isNumber(literal.toString()) ? literal : literal));

export const addExpr = (target: string[], args: Array<string | Record<string, string> | Where>) => {
  args.forEach((arg) => {
    if (arg instanceof Where) {
      target.push(arg.value);
    } else if (typeof arg === "string") {
      target.push(arg);
    } else {
      Object.entries(arg).forEach(([k, v]) => {
        target.push(`${k} = ${handleLiteral(v)}`);
      });
    }
  });
};

export const expr = {
  and: (...clauses: string[]) => clauses.map((clause) => `(${clause})`).join(" and "),
  or: (...clauses: string[]) => clauses.map((clause) => `(${clause})`).join(" or "),
  gt: (column: string, literal: string | number) => `${column} > ${handleLiteral(literal)}`,
  gte: (column: string, literal: string | number) => `${column} >= ${handleLiteral(literal)}`,
  lt: (column: string, literal: string | number) => `${column} < ${handleLiteral(literal)}`,
  lte: (column: string, literal: string | number) => `${column} <= ${handleLiteral(literal)}`,
  eq: (column: string, literal: string | number) => `${column} = ${handleLiteral(literal)}`,
};
