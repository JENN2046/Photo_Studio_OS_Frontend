import { useEffect, useState, type DependencyList } from "react";
import type { BackendReadModelRequestOptions } from "../../api/backendReadModels";

export type BackendReadModelStatus =
  | "missing-config"
  | "idle"
  | "loading"
  | "ready"
  | "error";

interface BackendReadModelRuntime {
  baseUrl: string;
  options: BackendReadModelRequestOptions;
}

export interface BackendReadModelState<T> {
  data: T | null;
  status: BackendReadModelStatus;
  message: string;
  errorMessage: string | null;
  canRetry: boolean;
  retry: () => void;
}

interface UseBackendReadModelOptions<T> {
  enabled?: boolean;
  idleMessage: string;
  load: (runtime: BackendReadModelRuntime) => Promise<T>;
  deps: DependencyList;
}

function getBackendReadModelRuntime(): BackendReadModelRuntime | null {
  const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  return {
    baseUrl,
    options: {
      headers: {
        "x-user-role": import.meta.env.VITE_BACKEND_USER_ROLE ?? "owner",
        "x-user-name":
          import.meta.env.VITE_BACKEND_USER_NAME ?? "Frontend Operator"
      }
    }
  };
}

function getBaseState<T>(): BackendReadModelState<T> {
  return {
    data: null,
    status: "loading",
    message: "Read model request is loading.",
    errorMessage: null,
    canRetry: false,
    retry: () => undefined
  };
}

export function useBackendReadModel<T>({
  enabled = true,
  idleMessage,
  load,
  deps
}: UseBackendReadModelOptions<T>): BackendReadModelState<T> {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<BackendReadModelState<T>>(getBaseState);

  const retry = () => {
    setReloadToken((current) => current + 1);
  };

  useEffect(() => {
    let isCurrent = true;

    if (!enabled) {
      setState({
        data: null,
        status: "idle",
        message: idleMessage,
        errorMessage: null,
        canRetry: false,
        retry
      });

      return () => {
        isCurrent = false;
      };
    }

    const runtime = getBackendReadModelRuntime();

    if (!runtime) {
      setState({
        data: null,
        status: "missing-config",
        message: "VITE_BACKEND_API_BASE_URL is not configured.",
        errorMessage: null,
        canRetry: false,
        retry
      });

      return () => {
        isCurrent = false;
      };
    }

    setState({
      data: null,
      status: "loading",
      message: "Read model request is loading.",
      errorMessage: null,
      canRetry: false,
      retry
    });

    load(runtime)
      .then((data) => {
        if (!isCurrent) {
          return;
        }

        setState({
          data,
          status: "ready",
          message: "Read model loaded.",
          errorMessage: null,
          canRetry: true,
          retry
        });
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setState({
          data: null,
          status: "error",
          message: "Read model request failed.",
          errorMessage:
            error instanceof Error ? error.message : "Unknown read model error",
          canRetry: true,
          retry
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [...deps, enabled, idleMessage, reloadToken]);

  return {
    ...state,
    retry
  };
}
