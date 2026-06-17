import { useEffect, useState, type DependencyList } from "react";
import type { BackendReadModelRequestOptions } from "../../api/backendReadModels";
import { ReadModelHttpError } from "../../api/backendReadModels";

export type BackendReadModelStatus =
  | "missing-config"
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "partial"
  | "stale"
  | "forbidden"
  | "invalid-id"
  | "error";

export type BackendReadModelSource =
  | "initializing"
  | "idle"
  | "mock"
  | "missing-config"
  | "backend"
  | "backend-error"
  | "backend-forbidden"
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
  accessToken?: string | null;
  enabled?: boolean;
  idleMessage: string;
  load: (runtime: BackendReadModelRuntime) => Promise<T>;
  mockData?: T;
  classifyData?: (data: T) => BackendReadModelDataState;
  deps: DependencyList;
}

export interface BackendReadModelDataState {
  status: Extract<BackendReadModelStatus, "ready" | "empty" | "partial" | "stale">;
  message: string;
  canRetry: boolean;
  transportLabel: string;
}

function createReadyDataState(): BackendReadModelDataState {
  return {
    status: "ready",
    message: "只读模型已加载。",
    canRetry: true,
    transportLabel: "已连接"
  };
}

function createBackendHeaders(accessToken: string | null): HeadersInit {
  if (accessToken) {
    return {
      authorization: `Bearer ${accessToken}`
    };
  }

  return {
    "x-user-role": import.meta.env.VITE_BACKEND_USER_ROLE ?? "operator",
    "x-user-name":
      import.meta.env.VITE_BACKEND_USER_NAME ?? "Frontend Operator"
  };
}

function getBackendReadModelRuntime(
  accessToken: string | null
): BackendReadModelRuntime | null {
  const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL?.trim() ?? "";

  // 同源部署：空串也返回 runtime（baseUrl 为空串，请求走同源相对路径）
  // 仅当环境变量显式设置为 "mock" 时才返回 null（走 mock/missing-config）
  if (baseUrl === "mock") {
    return null;
  }

  return {
    baseUrl,
    options: {
      headers: createBackendHeaders(accessToken)
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
  accessToken = null,
  enabled = true,
  idleMessage,
  load,
  mockData,
  classifyData,
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

    const runtime = getBackendReadModelRuntime(accessToken);

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

        const dataState = classifyData ? classifyData(data) : createReadyDataState();

        setState({
          data,
          status: dataState.status,
          message: dataState.message,
          errorMessage: null,
          canRetry: dataState.canRetry,
          runtime: createRuntimeView({
            source: "backend",
            sourceLabel: "后端只读",
            transportLabel: dataState.transportLabel
          }),
          retry
        });
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        const statusCode =
          error instanceof ReadModelHttpError ? error.statusCode : 0;
        let status: BackendReadModelStatus;
        let message: string;
        let source: BackendReadModelSource;
        let transportLabel: string;

        if (statusCode === 403) {
          status = "forbidden";
          message = "权限不足，无法访问该只读模型。";
          source = "backend-forbidden";
          transportLabel = "权限不足";
        } else if (statusCode === 404) {
          status = "invalid-id";
          message = "请求的 ID 未找到或不属于当前工作区。";
          source = "backend-error";
          transportLabel = "ID 未找到";
        } else {
          status = "error";
          message = "只读模型请求失败。";
          source = "backend-error";
          transportLabel = "请求失败";
        }

        setState({
          data: null,
          status,
          message,
          errorMessage:
            error instanceof Error
              ? error.message
              : "未知的只读模型错误",
          canRetry: true,
          runtime: createRuntimeView({ source, sourceLabel: "后端只读", transportLabel }),
          retry
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [...deps, accessToken, enabled, idleMessage, reloadToken, classifyData]);

  return {
    ...state,
    retry
  };
}
