import type { ReactNode } from "react";

interface MetricPanelProps {
  title: string;
  value: string | number;
  label: string;
  children?: ReactNode;
}

export function MetricPanel({ title, value, label, children }: MetricPanelProps) {
  return (
    <section className="panel metric-panel" aria-labelledby={`${title}-title`}>
      <div>
        <p className="eyebrow" id={`${title}-title`}>
          {title}
        </p>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      {children}
    </section>
  );
}
