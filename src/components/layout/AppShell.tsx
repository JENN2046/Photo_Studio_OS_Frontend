import { useEffect, useState, type ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

const commandSurfaces = [
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

export function AppShell({ children }: AppShellProps) {
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
