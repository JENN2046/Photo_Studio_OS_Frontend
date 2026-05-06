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
  mockData?: T;
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
    message: "只读模型请求加载中。",
    errorMessage: null,
    canRetry: false,
    retry: () => undefined
  };
}

export function useBackendReadModel<T>({
  enabled = true,
  idleMessage,
  load,
  mockData,
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
      if (mockData) {
        setState({
          data: mockData,
          status: "ready",
          message: "正在显示本地只读模拟数据。",
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
        status: "missing-config",
        message: "未配置 VITE_BACKEND_API_BASE_URL。",
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
      message: "只读模型请求加载中。",
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
          message: "只读模型已加载。",
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
          message: "只读模型请求失败。",
          errorMessage:
            error instanceof Error
              ? error.message
              : "未知的只读模型错误",
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
