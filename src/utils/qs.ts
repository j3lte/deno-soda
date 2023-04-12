// Copied & modified from https://github.com/ydeshayes/to-querystring/blob/master/src/index.ts
// MIT License
// Copyright (c) 2023 Yann Deshayes

type Options = {
  prefix?: string;
};

// deno-lint-ignore ban-types
export type Param = string | number | boolean | object | Array<Param>;
export type Params = Array<Param> | Record<string, Param>;

const keyValueToQueryString = (
  key: string,
  value: Record<string, Param> | Param,
  queryString: string,
  isArray: boolean,
  options: Options,
): string => {
  const arrayPrefix = isArray ? options.prefix || "" : "";

  if (typeof value === "object") {
    const tmpQueryString = `${key}${arrayPrefix}${queryString && "]"}[`;

    return `${
      toQS(
        value as Record<string, Param>,
        `${queryString}${tmpQueryString}`,
        options,
      )
    }`;
  }

  if (queryString && queryString.length) {
    return `${queryString}${key}]${arrayPrefix}=${encodeURIComponent(value)}`;
  }

  return `${key}${arrayPrefix}=${encodeURIComponent(value)}`;
};

const arrayQS = (
  key: string,
  values: Array<Params | Param>,
  queryString: string,
  options: Options,
): string =>
  values.map((value) => keyValueToQueryString(key, value, queryString, true, options)).join(
    "&",
  );

export const toQS = (
  params: Params,
  queryString = "",
  options: Options = {},
): string => {
  if (Array.isArray(params)) {
    return params.map((value, index) =>
      keyValueToQueryString(`${index}`, value, queryString, true, options)
    ).join("&").replace(/%20/g, "+");
  }

  return Object.keys(params)
    .filter((key) => params[key] !== undefined) // Can be 0
    .map((key) =>
      (params[key] && Array.isArray(params[key]))
        ? arrayQS(`${key}`, params[key] as Array<Params | Param>, queryString, options)
        : keyValueToQueryString(key, params[key], queryString, false, options)
    ).join("&").replace(/%20/g, "+");
};
