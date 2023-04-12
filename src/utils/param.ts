export type SupportTypeElement =
  | string
  | Date
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>;
export type SupportType = SupportTypeElement | SupportTypeElement[];

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const days = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
  return `${year}-${month}-${days} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function escapeString(str: string) {
  return str.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function replaceParams(
  sql: string,
  params?: null | SupportType[],
): string {
  if (!params) return sql;
  let paramIndex = 0;
  sql = sql.replace(
    /('[^'\\]*(?:\\.[^'\\]*)*')|("[^"\\]*(?:\\.[^"\\]*)*")|(\?\?)|(\?)/g,
    (str) => {
      if (paramIndex >= params.length || /".*"/g.test(str) || /'.*'/g.test(str)) return str;
      if (str === "??") {
        const val = params[paramIndex++];
        if (Array.isArray(val)) {
          return `(${val.map((item) => replaceParams("??", [item])).join(",")})`;
        } else if (val === "*") {
          return val;
        } else if (typeof val === "string" && val.includes(".")) {
          return replaceParams(val.split(".").map(() => "??").join("."), val.split("."));
        } else if (typeof val === "string" && val.match(/ as /i)) {
          return replaceParams(val.split(/ as /i).map(() => "??").join(" AS "), val.split(/ as /i));
        } else {
          // return ["`", val, "`"].join("");
          return `\`${val}\``;
        }
      }
      // value
      const val = params[paramIndex++];
      if (val === null || typeof val === "undefined") return "NULL";
      switch (typeof val) {
        case "object":
          if (val instanceof Date) return `'${formatDate(val)}'`;
          if (Array.isArray(val)) {
            return `(${
              val
                .map((item) => replaceParams("?", [item]))
                .join(",")
            })`;
          }
          throw new Error(
            `Unsupported argument type in your sql query: ${
              (val as Record<string, unknown>).constructor.name
            }`,
          );
        case "string":
          return `'${escapeString(val)}'`;
        case "number":
        case "boolean":
        default:
          return `${val}`;
      }
    },
  );
  return sql;
}
