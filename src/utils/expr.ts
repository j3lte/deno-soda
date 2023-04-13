import { Where } from "../Where.ts";

// function isNumber(obj: string): boolean {
//   return !Number.isNaN(parseFloat(obj));
// }

type Literal = string | number;

export function handleLiteral(literal: Literal): Literal {
  if (typeof literal === "string") {
    return `'${literal}'`;
    // } else if (isNumber(literal.toString())) {
    //   return literal;
  }
  return literal;
}

export function addExpr(
  target: string[],
  args: Array<string | Record<string, string> | Where>,
): void {
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
}

function and(...classes: string[]): string {
  return classes.map((c) => `(${c})`).join(" and ");
}
function or(...classes: string[]): string {
  return classes.map((c) => `(${c})`).join(" or ");
}

export const expr = {
  and,
  or,
};
