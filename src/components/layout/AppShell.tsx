import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Photo Studio OS</p>
          <span>Command Center Alpha / mock read-only cockpit</span>
        </div>
        <nav aria-label="Command surfaces">
          <a href="#projects">Projects</a>
          <a href="#skus">SKUs</a>
          <a href="#assets">Assets</a>
          <a href="#reviews">Reviews</a>
          <a href="#activity">Activity</a>
          <a href="#inspections">AI</a>
          <a href="#deliveries">Deliveries</a>
        </nav>
      </header>
      {children}
    </div>
  );
}
