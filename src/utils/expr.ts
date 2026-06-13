import { Where } from "../Where.ts";
import { getFieldName } from "../Field.ts";
import type { FieldImpl } from "../types.ts";

type Literal = string | number;

/** An operand in an arithmetic expression: a field name, a nested expression, a number, or a {@link FieldImpl}. */
type Operand = string | number | FieldImpl;

export function handleLiteral(literal: Literal): Literal {
  if (typeof literal === "string") {
    return `'${literal}'`;
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

const resolveOperand = (operand: Operand): string =>
  typeof operand === "number" ? `${operand}` : getFieldName(operand);

const arithmetic = (op: string, operands: Operand[]): string =>
  `(${operands.map(resolveOperand).join(` ${op} `)})`;

function add(...operands: Operand[]): string {
  return arithmetic("+", operands);
}
function sub(...operands: Operand[]): string {
  return arithmetic("-", operands);
}
function mul(...operands: Operand[]): string {
  return arithmetic("*", operands);
}
function div(...operands: Operand[]): string {
  return arithmetic("/", operands);
}
function mod(...operands: Operand[]): string {
  return arithmetic("%", operands);
}
function pow(...operands: Operand[]): string {
  return arithmetic("^", operands);
}

/**
 * Helpers that build raw SoQL expression strings.
 *
 * `and` / `or` combine boolean clauses. The arithmetic helpers
 * (`add`/`sub`/`mul`/`div`/`mod`/`pow`) combine numeric operands with
 * `+ - * / % ^`; each wraps its result in parentheses, so they nest safely
 * (e.g. `mul(add("a", "b"), "c")` → `((a + b) * c)`).
 *
 * @example
 * ```ts
 * expr.and("borough = 'BRONX'", "status = 'Open'"); // (borough = 'BRONX') and (status = 'Open')
 * expr.or("borough = 'BRONX'", "borough = 'QUEENS'"); // (borough = 'BRONX') or (borough = 'QUEENS')
 * expr.mul("price", "qty"); // (price * qty)
 * ```
 */
export const expr = {
  and,
  or,
  add,
  sub,
  mul,
  div,
  mod,
  pow,
};
