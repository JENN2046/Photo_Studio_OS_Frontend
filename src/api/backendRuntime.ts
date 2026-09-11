export type BackendRuntime =
  | { source: "mock"; baseUrl: null }
  | { source: "backend"; baseUrl: string };

/** Empty configuration selects the same-origin read API; only explicit mock is synthetic. */
export function resolveBackendRuntime(value?: string): BackendRuntime {
  const configured = value?.trim() ?? "";
  return configured === "mock"
    ? { source: "mock", baseUrl: null }
    : { source: "backend", baseUrl: configured || "/api/v2/read" };
}
