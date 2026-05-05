import type { ReactNode } from "react";

interface MetricPanelProps {
  title: string;
  value: string | number;
  label: string;
  children?: ReactNode;
}

export function MetricPanel({ title, value, label, children }: MetricPanelProps) {
  const titleId = `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-title`;

  return (
    <section className="panel metric-panel" aria-labelledby={titleId}>
      <div>
        <p className="eyebrow" id={titleId}>
          {title}
        </p>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      {children}
    </section>
  );
}
