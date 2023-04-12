import { Where } from "../Where.ts";

const isNumber = (obj: string) => !isNaN(parseFloat(obj));

// TODO(@j3lte) might be wrong, could only be used for string literals, thus adding '' when string
export const handleLiteral = (
  literal: string | number,
):
  | string
  | number => (typeof literal === "string"
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

export const expr: {
  and: (...clauses: string[]) => string;
  or: (...clauses: string[]) => string;
} = {
  and: (...clauses: string[]) => clauses.map((clause) => `(${clause})`).join(" and "),
  or: (...clauses: string[]) => clauses.map((clause) => `(${clause})`).join(" or "),
};
