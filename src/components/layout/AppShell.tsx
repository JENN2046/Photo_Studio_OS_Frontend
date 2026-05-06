import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const commandSurfaces = [
    { id: "risk-overview", href: "#risk", label: "风险雷达", icon: "grid" },
    { id: "project-list", href: "#projects", label: "项目执行", icon: "target" },
    {
      id: "approval-queue",
      href: "#approvals",
      label: "审批队列",
      icon: "brief"
    },
    {
      id: "activity-timeline",
      href: "#activity",
      label: "活动时间线",
      icon: "calendar"
    },
    {
      id: "ai-inspections",
      href: "#inspections",
      label: "Agent 巡检",
      icon: "team"
    },
    { id: "project-execution", href: "#projects", label: "项目执行", icon: "chart" },
    { id: "risk-settings", href: "#risk", label: "风险摘要", icon: "gear" }
  ] as const;

  return (
    <div className="app-shell">
      <aside className="command-rail" aria-label="命令中心导航栏">
        <a className="rail-brand" href="#" aria-label="命令中心总览">
          <span className="brand-mark" />
        </a>
        <nav aria-label="命令中心场景">
          {commandSurfaces.map((surface) => (
            <a href={surface.href} key={surface.id} title={surface.label}>
              <span
                aria-hidden="true"
                className={`rail-icon rail-icon-${surface.icon}`}
              />
              <span className="sr-only">{surface.label}</span>
            </a>
          ))}
        </nav>
        <a className="rail-alert" href="#risk" aria-label="风险提醒">
          <span aria-hidden="true" className="rail-icon rail-icon-bell" />
          <strong>3</strong>
        </a>
      </aside>
      <div className="command-workspace">
        <header className="topbar">
          <div className="topbar-status" aria-label="只读运行状态">
            <span>布鲁克林影棚 A</span>
            <span>2025-05-19</span>
            <span>10:42</span>
            <i aria-hidden="true" />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
