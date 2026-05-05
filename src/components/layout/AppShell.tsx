import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const commandSurfaces = [
    { href: "#risk", label: "Risk", mark: "RP" },
    { href: "#approvals", label: "Approvals", mark: "AQ" },
    { href: "#projects", label: "Projects", mark: "PX" },
    { href: "#skus", label: "SKUs", mark: "SK" },
    { href: "#assets", label: "Assets", mark: "AS" },
    { href: "#reviews", label: "Reviews", mark: "RV" },
    { href: "#activity", label: "Activity", mark: "AT" },
    { href: "#inspections", label: "AI", mark: "AI" },
    { href: "#deliveries", label: "Deliveries", mark: "DL" }
  ] as const;

  return (
    <div className="app-shell">
      <aside className="command-rail" aria-label="Command center rail">
        <a className="rail-brand" href="#" aria-label="Command center overview">
          <span />
        </a>
        <nav aria-label="Command surfaces">
          {commandSurfaces.map((surface) => (
            <a href={surface.href} key={surface.href} title={surface.label}>
              {surface.mark}
            </a>
          ))}
        </nav>
        <a className="rail-alert" href="#risk" aria-label="Risk alerts">
          <span>3</span>
        </a>
      </aside>
      <div className="command-workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Photo Studio OS</p>
            <span>Command Center Alpha / mock read-only cockpit</span>
          </div>
          <div className="topbar-status" aria-label="Read-only operating status">
            <span>North Hall Product Studio</span>
            <span>May 05, 2026</span>
            <span>09:30 AM</span>
            <i aria-hidden="true" />
          </div>
          <nav aria-label="Command surfaces">
            {commandSurfaces.slice(0, 5).map((surface) => (
              <a href={surface.href} key={surface.href}>
                {surface.label}
              </a>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
