import { crypto } from "../dev_deps.ts";

const createHash = (buf: ArrayBuffer): Promise<string> => {
  const hash = crypto.subtle.digest("SHA-256", buf).then((hash) =>
    // ArrayBuffer to hex string;
    Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
  return hash;
};

const store = new Map<string, Response>();
const originalFetch = globalThis.fetch;

/** Generates a string out of a `Request` object. */
export async function getRequestString(request: Request): Promise<string> {
  request = request.clone();
  const hash = await createHash(await request.arrayBuffer());

  return (
    request.url +
    request.method +
    JSON.stringify(Object.fromEntries(request.headers.entries())) +
    hash.toString() +
    request.cache +
    request.credentials +
    request.mode +
    request.redirect +
    request.destination +
    request.integrity +
    request.referrer +
    request.referrerPolicy
  );
}

/** Mock fetch() requests
 *
 * Returns the provided response when a fetch() call's request matche
 * the provided request object.
 *
 * @throws 'request not mocked' error if the request of fetch() isn't in the store.
 */
export async function mockFetch(request: Request, response: Response): Promise<void> {
  store.set(await getRequestString(request), response);

  globalThis.fetch = async function fetch(
    input: string | URL | Request,
    init?: RequestInit | undefined,
  ): Promise<Response> {
    if (input instanceof URL) {
      input = input.toString();
    }
    const originalRequest = new Request(input, init);
    const requestString = await getRequestString(originalRequest);

    if (!store.has(requestString)) {
      const info = [
        `request: ${requestString}`,
        `input: ${input}`,
        `init: ${JSON.stringify(init)}`,
      ].join("\n");
      throw Error(`request not mocked: \n${info}`);
    }

    return store.get(requestString)!.clone();
  };
}

/** Restore original fetch(). */
export function unMockFetch(): void {
  globalThis.fetch = originalFetch;
}
