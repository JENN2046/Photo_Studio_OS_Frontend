import { useEffect, useState, type ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  studioName?: string;
  snapshotAt?: string;
  sourceLabel?: string;
  riskSignalCount?: number;
}

const commandSurfaces = [
  { id: "creative-workbench", href: "#creative-workbench", label: "创作工作台", icon: "target" },
  { id: "risk", href: "#risk", label: "风险雷达", icon: "grid" },
  { id: "projects", href: "#projects", label: "项目执行", icon: "target" },
  { id: "approvals", href: "#approvals", label: "审批队列", icon: "brief" },
  {
    id: "activity",
    href: "#activity",
    label: "活动时间线",
    icon: "calendar"
  },
  {
    id: "inspections",
    href: "#inspections",
    label: "Agent 巡检",
    icon: "team"
  }
] as const;

function getRouteHash() {
  if (typeof window === "undefined") {
    return "#";
  }

  const [routeHash] = window.location.hash.split("?");
  return routeHash || "#";
}

function useRouteHash() {
  const [routeHash, setRouteHash] = useState(getRouteHash);

  useEffect(() => {
    const updateRouteHash = () => setRouteHash(getRouteHash());

    updateRouteHash();
    window.addEventListener("hashchange", updateRouteHash);

    return () => {
      window.removeEventListener("hashchange", updateRouteHash);
    };
  }, []);

  return routeHash;
}

export function AppShell({ children, studioName, snapshotAt, sourceLabel, riskSignalCount }: AppShellProps) {
  const routeHash = useRouteHash();
  const activeSurfaceHref = commandSurfaces.some(
    (surface) => surface.href === routeHash
  )
    ? routeHash
    : null;

  return (
    <div className="app-shell">
      <aside className="command-rail" aria-label="命令中心导航栏">
        <a
          aria-current={routeHash === "#" ? "page" : undefined}
          className="rail-brand"
          href="#"
          aria-label="命令中心总览"
        >
          <span className="brand-mark" />
        </a>
        <nav aria-label="命令中心场景">
          {commandSurfaces.map((surface) => (
            <a
              aria-current={
                activeSurfaceHref === surface.href ? "page" : undefined
              }
              href={surface.href}
              key={surface.id}
              title={surface.label}
            >
              <span
                aria-hidden="true"
                className={`rail-icon rail-icon-${surface.icon}`}
              />
              <span className="sr-only">{surface.label}</span>
            </a>
          ))}
        </nav>
        <a className="rail-alert" href="#risk" aria-label={riskSignalCount === undefined ? "风险项数量未提供" : `风险信号 ${riskSignalCount} 项`}>
          <span aria-hidden="true" className="rail-icon rail-icon-bell" />
          <strong>{riskSignalCount ?? "—"}</strong>
        </a>
      </aside>
      <div className="command-workspace">
        <header className="topbar">
          <div className="topbar-status" aria-label="工作区与快照来源">
            <span>{studioName ?? "Photo Studio"}</span>
            <span>{sourceLabel ?? "工作区"}</span>
            <span>{snapshotAt ? `快照 ${snapshotAt}` : "快照时间未提供"}</span>
            <i aria-hidden="true" />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
