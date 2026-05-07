import { useEffect, useState, type DependencyList } from "react";
import type { BackendReadModelRequestOptions } from "../../api/backendReadModels";

export type BackendReadModelStatus =
  | "missing-config"
  | "idle"
  | "loading"
  | "ready"
  | "error";

export type BackendReadModelSource =
  | "initializing"
  | "idle"
  | "mock"
  | "missing-config"
  | "backend"
  | "backend-error"
  | "debug";

export interface BackendReadModelRuntimeView {
  source: BackendReadModelSource;
  sourceLabel: string;
  transportLabel: string;
  boundaryLabel: string;
}

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
  runtime: BackendReadModelRuntimeView;
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
    runtime: createRuntimeView({
      source: "initializing",
      sourceLabel: "初始化",
      transportLabel: "等待只读模型"
    }),
    retry: () => undefined
  };
}

function createRuntimeView({
  source,
  sourceLabel,
  transportLabel
}: {
  source: BackendReadModelSource;
  sourceLabel: string;
  transportLabel: string;
}): BackendReadModelRuntimeView {
  return {
    source,
    sourceLabel,
    transportLabel,
    boundaryLabel: "mock-first / read-only"
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
        runtime: createRuntimeView({
          source: "idle",
          sourceLabel: "等待上下文",
          transportLabel: "未发起请求"
        }),
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
          runtime: createRuntimeView({
            source: "mock",
            sourceLabel: "本地模拟",
            transportLabel: "后端未配置"
          }),
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
        runtime: createRuntimeView({
          source: "missing-config",
          sourceLabel: "未配置",
          transportLabel: "VITE_BACKEND_API_BASE_URL 缺失"
        }),
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
      runtime: createRuntimeView({
        source: "backend",
        sourceLabel: "后端只读",
        transportLabel: "请求中"
      }),
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
          runtime: createRuntimeView({
            source: "backend",
            sourceLabel: "后端只读",
            transportLabel: "已连接"
          }),
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
          runtime: createRuntimeView({
            source: "backend-error",
            sourceLabel: "后端只读",
            transportLabel: "请求失败"
          }),
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
