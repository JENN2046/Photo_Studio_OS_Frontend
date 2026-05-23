import { useEffect, useState } from "react";
import { ReadModelHttpError } from "../../api/backendReadModels";
import { createCommandCenterClient } from "../../api/client";
import type { CommandCenterSnapshot } from "../../api/types";

export type CommandCenterSnapshotStatus =
  | "loading"
  | "ready"
  | "error"
  | "forbidden"
  | "invalid-id";
export type CommandCenterDebugState =
  | "live"
  | "loading"
  | "error"
  | "forbidden"
  | "invalid-id";
export type CommandCenterRuntimeSource =
  | "initializing"
  | "mock"
  | "mock-error"
  | "backend"
  | "backend-error"
  | "debug";

export interface CommandCenterRuntimeView {
  source: CommandCenterRuntimeSource;
  sourceLabel: string;
  transportLabel: string;
  boundaryLabel: string;
}

interface CommandCenterSnapshotState {
  snapshot: CommandCenterSnapshot | null;
  status: CommandCenterSnapshotStatus;
  errorMessage: string | null;
  debugState: CommandCenterDebugState;
  canRetry: boolean;
  runtime: CommandCenterRuntimeView;
  retry: () => void;
}

type CommandCenterSnapshotDataState = Omit<CommandCenterSnapshotState, "retry">;

const baseLoadingState: CommandCenterSnapshotDataState = {
  snapshot: null,
  status: "loading",
  errorMessage: null,
  debugState: "live",
  canRetry: import.meta.env.DEV,
  runtime: createLiveRuntimeView("loading")
};

function hasBackendRuntime(): boolean {
  return Boolean(import.meta.env.VITE_BACKEND_API_BASE_URL?.trim());
}

function createRuntimeView({
  source,
  sourceLabel,
  transportLabel
}: {
  source: CommandCenterRuntimeSource;
  sourceLabel: string;
  transportLabel: string;
}): CommandCenterRuntimeView {
  return {
    source,
    sourceLabel,
    transportLabel,
    boundaryLabel: "mock-first / read-only"
  };
}

function createLiveRuntimeView(
  status: CommandCenterSnapshotStatus
): CommandCenterRuntimeView {
  const hasBackend = hasBackendRuntime();

  if (status === "forbidden") {
    return createRuntimeView({
      source: hasBackend ? "backend-error" : "mock-error",
      sourceLabel: hasBackend ? "后端只读" : "本地模拟",
      transportLabel: "权限不足"
    });
  }

  if (status === "invalid-id") {
    return createRuntimeView({
      source: hasBackend ? "backend-error" : "mock-error",
      sourceLabel: hasBackend ? "后端只读" : "本地模拟",
      transportLabel: "ID 未找到"
    });
  }

  if (status === "error") {
    return createRuntimeView({
      source: hasBackend ? "backend-error" : "mock-error",
      sourceLabel: hasBackend ? "后端只读" : "本地模拟",
      transportLabel: hasBackend ? "请求失败" : "模拟读取失败"
    });
  }

  if (hasBackend) {
    return createRuntimeView({
      source: "backend",
      sourceLabel: "后端只读",
      transportLabel: status === "ready" ? "已连接" : "请求中"
    });
  }

  return createRuntimeView({
    source: status === "loading" ? "initializing" : "mock",
    sourceLabel: status === "loading" ? "初始化" : "本地模拟",
    transportLabel: status === "loading" ? "准备模拟快照" : "后端未配置"
  });
}

function createDebugRuntimeView(): CommandCenterRuntimeView {
  return createRuntimeView({
    source: "debug",
    sourceLabel: "DEV 调试",
    transportLabel: "命令中心边界态演练"
  });
}

function getDebugState(): CommandCenterDebugState {
  if (typeof window === "undefined" || !import.meta.env.DEV) {
    return "live";
  }

  const stateParam = new URLSearchParams(window.location.search).get(
    "commandCenterState"
  );

  if (
    stateParam === "loading" ||
    stateParam === "error" ||
    stateParam === "forbidden" ||
    stateParam === "invalid-id"
  ) {
    return stateParam;
  }

  return "live";
}

function getFailureStatus(error: unknown): Exclude<
  CommandCenterSnapshotStatus,
  "loading" | "ready"
> {
  if (error instanceof ReadModelHttpError) {
    if (error.statusCode === 403) {
      return "forbidden";
    }

    if (error.statusCode === 404) {
      return "invalid-id";
    }
  }

  return "error";
}

function getFailureMessage(
  error: unknown,
  status: Exclude<CommandCenterSnapshotStatus, "loading" | "ready">
): string {
  if (status === "forbidden") {
    return "权限不足，无法访问命令中心只读快照。";
  }

  if (status === "invalid-id") {
    return "请求的命令中心只读快照无效或未找到。";
  }

  return error instanceof Error
    ? error.message
    : "Unable to load command center snapshot";
}

export function useCommandCenterSnapshot(
  accessToken: string | null
): CommandCenterSnapshotState {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] =
    useState<CommandCenterSnapshotDataState>(baseLoadingState);

  const retry = () => {
    setState(baseLoadingState);
    setReloadToken((current) => current + 1);
  };

  useEffect(() => {
    let isCurrent = true;
    const debugState = getDebugState();

    if (debugState === "loading") {
      setState({
        snapshot: null,
        status: "loading",
        errorMessage: null,
        debugState,
        canRetry: true,
        runtime: createDebugRuntimeView()
      });

      return () => {
        isCurrent = false;
      };
    }

    if (debugState === "error") {
      setState({
        snapshot: null,
        status: "error",
        errorMessage: "Simulated read boundary fault for internal debug",
        debugState,
        canRetry: true,
        runtime: createDebugRuntimeView()
      });

      return () => {
        isCurrent = false;
      };
    }

    if (debugState === "forbidden" || debugState === "invalid-id") {
      const status = debugState;
      setState({
        snapshot: null,
        status,
        errorMessage: getFailureMessage(null, status),
        debugState,
        canRetry: false,
        runtime: createDebugRuntimeView()
      });

      return () => {
        isCurrent = false;
      };
    }

    createCommandCenterClient(accessToken)
      .getSnapshot()
      .then((snapshot) => {
        if (!isCurrent) {
          return;
        }

        setState({
          snapshot,
          status: "ready",
          errorMessage: null,
          debugState,
          canRetry: import.meta.env.DEV,
          runtime: createLiveRuntimeView("ready")
        });
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        const status = getFailureStatus(error);
        setState({
          snapshot: null,
          status,
          errorMessage: getFailureMessage(error, status),
          debugState,
          canRetry: import.meta.env.DEV && status !== "forbidden",
          runtime: createLiveRuntimeView(status)
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [accessToken, reloadToken]);

  return {
    ...state,
    retry
  };
}
