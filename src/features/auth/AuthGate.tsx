import { type ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import {
  RuntimeChipList,
  type RuntimeChip
} from "../../components/panels/RuntimeChipList";
import type { AppRoute, PageAccess, Role } from "./authTypes";
import { getRequiredRoleLabel, roleLabels } from "./authTypes";
import type { AuthRuntimeView } from "./useAuthState";
import type { AuthState } from "./authTypes";

interface AuthGateProps {
  auth: AuthState;
  runtime: AuthRuntimeView;
  currentRoute: AppRoute;
  onLogin?: () => void;
  onLogout?: () => void;
  pageAccess: PageAccess;
  children: ReactNode;
}

function authChips(runtime: AuthRuntimeView): RuntimeChip[] {
  return [
    { key: "auth-source", label: "认证源", value: runtime.sourceLabel, tone: runtime.source },
    { key: "session", label: "会话", value: runtime.sessionLabel },
    { key: "role", label: "角色", value: runtime.roleLabel },
    { key: "access", label: "访问权限", value: runtime.permissionLabel },
    { key: "boundary", label: "写入边界", value: "mock-first / read-only", tone: "readonly" }
  ];
}

function AuthStatePage({
  title,
  subtitle,
  statusLabel,
  children,
  runtime
}: {
  title: string;
  subtitle: string;
  statusLabel: string;
  children: ReactNode;
  runtime: AuthRuntimeView;
}) {
  return (
    <AppShell>
      <main className="read-model-page" aria-label={title}>
        <section className="read-model-hero">
          <div>
            <p className="eyebrow">认证安全边界</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </section>
        <section className="read-model-context-bar" aria-label="认证状态栏">
          <RuntimeChipList chips={authChips(runtime)} />
        </section>
        <section className="read-model-state read-model-state-forbidden" role="status">
          <div>
            <strong>{title}</strong>
            <span>{subtitle}</span>
            <small>状态 / {statusLabel} · mock-first / read-only</small>
          </div>
          {children}
        </section>
      </main>
    </AppShell>
  );
}

function SignedOutGate({
  onLogin,
  runtime
}: {
  onLogin?: () => void;
  runtime: AuthRuntimeView;
}) {
  return (
    <AuthStatePage
      runtime={runtime}
      statusLabel="未登录"
      subtitle={
        runtime.source === "backend"
          ? "请使用 Auth0 登录以访问只读驾驶舱。"
          : "当前阶段：前端只读驾驶舱，不启用生产认证。"
      }
      title="请登录以访问命令中心。"
    >
      <button
        aria-disabled={onLogin ? undefined : "true"}
        className="status-action"
        disabled={!onLogin}
        onClick={onLogin}
        type="button"
      >
        登录
      </button>
    </AuthStatePage>
  );
}

function ExpiredSessionGate({
  onLogin,
  runtime
}: {
  onLogin?: () => void;
  runtime: AuthRuntimeView;
}) {
  return (
    <AuthStatePage
      runtime={runtime}
      statusLabel="会话过期"
      subtitle="您的登录会话已过期。请重新认证以继续操作。"
      title="会话已过期"
    >
      <button
        aria-disabled={onLogin ? undefined : "true"}
        className="status-action"
        disabled={!onLogin}
        onClick={onLogin}
        type="button"
      >
        重新登录
      </button>
    </AuthStatePage>
  );
}

function AuthLoadingGate({ runtime }: { runtime: AuthRuntimeView }) {
  return (
    <AuthStatePage
      runtime={runtime}
      statusLabel="认证中"
      subtitle="正在验证会话令牌。"
      title="认证验证中"
    >
      {null}
    </AuthStatePage>
  );
}

function AuthErrorGate({
  message,
  onLogin,
  runtime
}: {
  message?: string;
  onLogin?: () => void;
  runtime: AuthRuntimeView;
}) {
  return (
    <AuthStatePage
      runtime={runtime}
      statusLabel="认证故障"
      subtitle="认证服务暂时不可用。请在几分钟后重试。"
      title="认证服务不可用"
    >
      {message ? (
        <div className="status-message-bar">
          <span className="status-message-label">错误详情</span>
          <strong>{message}</strong>
        </div>
      ) : null}
      <button
        aria-disabled={onLogin ? undefined : "true"}
        className="status-action"
        disabled={!onLogin}
        onClick={onLogin}
        type="button"
      >
        重试登录
      </button>
    </AuthStatePage>
  );
}

function ForbiddenGate({
  currentRoute,
  role,
  runtime
}: {
  currentRoute: AppRoute;
  role: Role | null;
  runtime: AuthRuntimeView;
}) {
  const requiredLabel = getRequiredRoleLabel(currentRoute);
  const currentRoleLabel = role ? roleLabels[role] : "未登录";

  return (
    <AuthStatePage
      runtime={runtime}
      statusLabel="权限不足"
      subtitle="您当前的角色无权查看此页面内容。如需访问请切换账号或联系管理员。"
      title="无权访问该页面"
    >
      <div className="status-message-bar">
        <span className="status-message-label">所需角色</span>
        <strong>{requiredLabel}</strong>
      </div>
      <div className="status-message-bar">
        <span className="status-message-label">当前角色</span>
        <strong>{currentRoleLabel}</strong>
      </div>
      <a className="status-action" href="#">
        返回命令中心
      </a>
    </AuthStatePage>
  );
}

function InsufficientRoleOverlay({
  access,
  role,
  children
}: {
  access: PageAccess;
  role: Role | null;
  children: ReactNode;
}) {
  if (access === "full") return <>{children}</>;

  const currentRoleLabel = role ? roleLabels[role] : "未登录";
  const accessLabel = access === "read" ? "只读" : "摘要";

  return (
    <div className="insufficient-role-wrapper" aria-label="部分权限视图">
      {children}
      {access === "none" ? null : (
        <aside className="insufficient-role-notice" aria-label="权限说明">
          <span>
            当前角色：{currentRoleLabel}，仅开放{accessLabel}视图；业务写入、上传、下载和公开链接仍保持禁用。
          </span>
        </aside>
      )}
    </div>
  );
}

export function AuthGate({
  auth,
  runtime,
  currentRoute,
  onLogin,
  onLogout,
  pageAccess,
  children
}: AuthGateProps) {
  switch (auth.session) {
    case "no-auth":
      return <SignedOutGate onLogin={onLogin} runtime={runtime} />;
    case "loading":
      return <AuthLoadingGate runtime={runtime} />;
    case "expired":
      return <ExpiredSessionGate onLogin={onLogin} runtime={runtime} />;
    case "error":
      return (
        <AuthErrorGate
          message={auth.message}
          onLogin={onLogin}
          runtime={runtime}
        />
      );
    case "forbidden":
      return (
        <ForbiddenGate
          currentRoute={currentRoute}
          role={auth.role}
          runtime={runtime}
        />
      );
    case "insufficient-role":
      if (pageAccess === "full") {
        return (
          <>
            {children}
            {onLogout ? (
              <button className="auth-session-action" onClick={onLogout} type="button">
                退出
              </button>
            ) : null}
          </>
        );
      }

      return (
        <>
          <InsufficientRoleOverlay access={pageAccess} role={auth.role}>
            {children}
          </InsufficientRoleOverlay>
          {onLogout ? (
            <button className="auth-session-action" onClick={onLogout} type="button">
              退出
            </button>
          ) : null}
        </>
      );
    case "signed-in":
      return (
        <>
          {children}
          {onLogout ? (
            <button className="auth-session-action" onClick={onLogout} type="button">
              退出
            </button>
          ) : null}
        </>
      );
  }
}

export { InsufficientRoleOverlay };
