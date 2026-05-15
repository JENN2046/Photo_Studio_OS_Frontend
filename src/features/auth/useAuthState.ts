import { useMemo } from "react";
import type { AuthState, Role, SessionState } from "./authTypes";

export type AuthDebugState = SessionState | "live";

export interface AuthRuntimeView {
  source: "mock" | "backend";
  sourceLabel: string;
  sessionLabel: string;
  roleLabel: string;
  permissionLabel: string;
}

function getRoleFromEnv(): Role | null {
  const envRole = import.meta.env.VITE_BACKEND_USER_ROLE?.trim();
  if (!envRole) return null;
  const validRoles: Role[] = [
    "admin",
    "operator",
    "photographer",
    "retoucher",
    "qc_reviewer",
    "client",
    "delivery_approver"
  ];
  return validRoles.includes(envRole as Role) ? (envRole as Role) : null;
}

function getAuthDebugState(params: URLSearchParams): AuthDebugState {
  if (!import.meta.env.DEV) return "live";

  const debug = params.get("authState")?.trim();
  if (debug === "signed-out") {
    return "no-auth";
  }

  const valid: SessionState[] = [
    "no-auth",
    "loading",
    "signed-in",
    "expired",
    "error",
    "forbidden",
    "insufficient-role"
  ];

  return valid.includes(debug as SessionState) ? (debug as SessionState) : "live";
}

function deriveSessionState(
  envRole: Role | null,
  debugState: AuthDebugState
): AuthState {
  if (debugState !== "live") {
    switch (debugState) {
      case "no-auth":
        return { session: "no-auth", role: null, message: "内部调试：模拟未登录状态。" };
      case "loading":
        return { session: "loading", role: null, message: "内部调试：模拟认证加载中。" };
      case "signed-in":
        return {
          session: "signed-in",
          role: envRole ?? "operator",
          message: "内部调试：模拟已登录管理员。"
        };
      case "expired":
        return {
          session: "expired",
          role: envRole ?? null,
          message: "内部调试：模拟会话过期。"
        };
      case "error":
        return {
          session: "error",
          role: null,
          message: "内部调试：模拟认证服务不可用。"
        };
      case "forbidden":
        return {
          session: "forbidden",
          role: envRole ?? "photographer",
          message: "内部调试：当前角色无权访问此页面。"
        };
      case "insufficient-role":
        return {
          session: "insufficient-role",
          role: envRole ?? "retoucher",
          message: "内部调试：当前角色仅有部分页面权限。"
        };
    }
  }

  if (envRole) {
    return {
      session: "signed-in",
      role: envRole,
      message: `只读认证就绪。角色：${envRole}`
    };
  }

  return {
    session: "signed-in",
    role: "operator",
    message: "本地模拟认证就绪。默认角色：运营"
  };
}

export function useAuthState(params: URLSearchParams): {
  auth: AuthState;
  debugState: AuthDebugState;
  runtime: AuthRuntimeView;
} {
  const debugState = getAuthDebugState(params);
  const envRole = getRoleFromEnv();
  const isDebug = debugState !== "live";

  const auth = useMemo(
    () => deriveSessionState(envRole, debugState),
    [envRole, debugState]
  );

  const sessionLabels: Record<string, string> = {
    "no-auth": "未登录",
    loading: "认证中",
    "signed-in": "已登录",
    expired: "已过期",
    error: "认证故障",
    forbidden: "权限不足",
    "insufficient-role": "权限受限"
  };

  return {
    auth,
    debugState,
    runtime: {
      source: isDebug ? "mock" : "mock",
      sourceLabel: isDebug ? "DEV 调试认证" : "本地模拟认证",
      sessionLabel: sessionLabels[auth.session] ?? auth.session,
      roleLabel: auth.role
        ? (import.meta.env.DEV
          ? `DEV-${auth.role}`
          : auth.role)
        : "未分配",
      permissionLabel: "完全"
    }
  };
}
