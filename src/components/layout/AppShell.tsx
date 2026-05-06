import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const commandSurfaces = [
    { id: "risk-overview", href: "#risk", label: "Risk", icon: "grid" },
    { id: "project-list", href: "#projects", label: "Projects", icon: "target" },
    { id: "approval-queue", href: "#approvals", label: "Approvals", icon: "brief" },
    { id: "activity-timeline", href: "#activity", label: "Activity", icon: "calendar" },
    { id: "ai-inspections", href: "#inspections", label: "AI Inspection", icon: "team" },
    { id: "project-execution", href: "#projects", label: "Execution", icon: "chart" },
    { id: "risk-settings", href: "#risk", label: "Settings", icon: "gear" }
  ] as const;

  return (
    <div className="app-shell">
      <aside className="command-rail" aria-label="Command center rail">
        <a className="rail-brand" href="#" aria-label="Command center overview">
          <span className="brand-mark" />
        </a>
        <nav aria-label="Command surfaces">
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
        <a className="rail-alert" href="#risk" aria-label="Risk alerts">
          <span aria-hidden="true" className="rail-icon rail-icon-bell" />
          <strong>3</strong>
        </a>
      </aside>
      <div className="command-workspace">
        <header className="topbar">
          <div className="topbar-status" aria-label="Read-only operating status">
            <span>Brooklyn Studio A</span>
            <span>May 19, 2025</span>
            <span>10:42 AM</span>
            <i aria-hidden="true" />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
